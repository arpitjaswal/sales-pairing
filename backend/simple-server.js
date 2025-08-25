const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174","https://endearing-meerkat-1129fa.netlify.app/"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Real user data - starts empty, users register when they connect
const users = new Map(); // userId -> user data
const userSessions = new Map(); // userId -> socket session
const matchRequests = [];
const practiceSessions = [];

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their info
  socket.on('user-join', (userData) => {
    const userId = userData.id || socket.id;
    
    // Create or update user
    users.set(userId, {
      id: userId,
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || userId.slice(0, 6),
      email: userData.email || `${userId}@example.com`,
      isAvailable: false,
      lastActive: new Date(),
      practiceCount: 0,
      streak: 0,
      rating: 0,
      skillLevel: 'intermediate',
      skills: ['cold-calling', 'objection-handling'],
      timezone: 'UTC',
      preferredSessionLength: 15,
      preferredSkillLevel: 'any',
      socketId: socket.id
    });
    
    userSessions.set(userId, socket);
    
        // Send current available users to the new user (excluding self)
    const availableUsers = Array.from(users.values())
      .filter(user => user.isAvailable && user.id !== userId)
      .map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: 'Sales Rep',
        rating: user.rating,
        skillLevel: user.skillLevel,
        skills: user.skills,
        timezone: user.timezone,
        isAvailable: user.isAvailable,
        lastActive: user.lastActive,
        practiceCount: user.practiceCount,
        streak: user.streak,
        preferredSessionLength: user.preferredSessionLength,
        preferredSkillLevel: user.preferredSkillLevel,
      }));

    socket.emit('available-users', availableUsers);

    // Also update other users' available users list (excluding the new user)
    for (const [connectedUserId, userSocket] of userSessions.entries()) {
      if (connectedUserId !== userId) {
        const otherUserAvailableUsers = Array.from(users.values())
          .filter(u => u.isAvailable && u.id !== connectedUserId)
          .map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            avatar: u.avatar,
            role: 'Sales Rep',
            rating: u.rating,
            skillLevel: u.skillLevel,
            skills: u.skills,
            timezone: u.timezone,
            isAvailable: u.isAvailable,
            lastActive: u.lastActive,
            practiceCount: u.practiceCount,
            streak: u.streak,
            preferredSessionLength: u.preferredSessionLength,
            preferredSkillLevel: u.preferredSkillLevel,
          }));

        userSocket.emit('available-users', otherUserAvailableUsers);
      }
    }
    
    // Broadcast to all other users that a new user joined
    socket.broadcast.emit('user-joined', {
      id: userId,
      name: `${userData.firstName || 'User'} ${userData.lastName || 'Session'}`,
      isAvailable: false
    });
    
    console.log(`User ${userId} joined. Available users: ${availableUsers.length}`);
    
    console.log(`User ${userId} joined`);
  });

  // User updates availability
  socket.on('update-availability', (data) => {
    const userId = data.userId;
    const user = users.get(userId);
    
    if (user) {
      user.isAvailable = data.isAvailable;
      user.lastActive = new Date();
      
      // Send updated available users list to each user individually (excluding themselves)
      for (const [connectedUserId, userSocket] of userSessions.entries()) {
        const userSpecificAvailableUsers = Array.from(users.values())
          .filter(u => u.isAvailable && u.id !== connectedUserId)
          .map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            avatar: u.avatar,
            role: 'Sales Rep',
            rating: u.rating,
            skillLevel: u.skillLevel,
            skills: u.skills,
            timezone: u.timezone,
            isAvailable: u.isAvailable,
            lastActive: u.lastActive,
            practiceCount: u.practiceCount,
            streak: u.streak,
            preferredSessionLength: u.preferredSessionLength,
            preferredSkillLevel: u.preferredSkillLevel,
          }));

        userSocket.emit('available-users', userSpecificAvailableUsers);
      }
      
      // Broadcast availability change to all users
      io.emit('user-availability-changed', {
        userId: userId,
        isAvailable: data.isAvailable,
        name: `${user.firstName} ${user.lastName}`
      });
      
      console.log(`User ${userId} availability updated to ${data.isAvailable}`);
    }
  });

  // User sends invitation
  socket.on('send-invitation', (data) => {
    const { targetUserId, topic, skillLevel, sessionLength } = data;
    const requesterId = data.userId;
    
    const matchRequest = {
      id: Date.now().toString(),
      requesterId: requesterId,
      targetId: targetUserId,
      topic: topic || 'general-practice',
      skillLevel: skillLevel || 'intermediate',
      duration: sessionLength || 15,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    
    matchRequests.push(matchRequest);
    
    // Send notification to target user
    const targetSocket = userSessions.get(targetUserId);
    if (targetSocket) {
      const requester = users.get(requesterId);
      console.log('Requester data:', requester);
      console.log('Requester ID:', requesterId);
      console.log('All users:', Array.from(users.keys()));
      targetSocket.emit('invitation-received', {
        ...matchRequest,
        requesterName: requester ? `${requester.firstName} ${requester.lastName}` : 'Unknown User'
      });
    }
    
    // Send confirmation to requester
    socket.emit('invitation-sent', matchRequest);
    
    console.log(`Invitation sent from ${requesterId} to ${targetUserId}`);
  });

  // User accepts invitation
  socket.on('accept-invitation', (data) => {
    const { requestId, userId } = data;
    const matchRequest = matchRequests.find(req => req.id === requestId);
    
    if (matchRequest) {
      const session = {
        id: Date.now().toString(),
        participants: [matchRequest.requesterId, userId],
        topic: matchRequest.topic,
        skillLevel: matchRequest.skillLevel,
        duration: matchRequest.duration,
        startTime: new Date(),
        status: 'active',
      };
      
      practiceSessions.push(session);
      matchRequest.status = 'accepted';
      
      // Notify both users about the session
      const requesterSocket = userSessions.get(matchRequest.requesterId);
      const targetSocket = userSessions.get(userId);
      
      if (requesterSocket) {
        requesterSocket.emit('session-started', session);
      }
      if (targetSocket) {
        targetSocket.emit('session-started', session);
      }
      
      console.log(`Session started between ${matchRequest.requesterId} and ${userId}`);
    }
  });

  // User declines invitation
  socket.on('decline-invitation', (data) => {
    const { requestId, userId } = data;
    const matchRequest = matchRequests.find(req => req.id === requestId);
    
    if (matchRequest) {
      matchRequest.status = 'declined';
      
      // Notify requester about decline
      const requesterSocket = userSessions.get(matchRequest.requesterId);
      if (requesterSocket) {
        requesterSocket.emit('invitation-declined', {
          requestId: requestId,
          targetId: userId
        });
      }
      
      console.log(`Invitation ${requestId} declined by ${userId}`);
    }
  });

  // Send message in session
  socket.on('send-session-message', (data) => {
    const { sessionId, message, senderId, senderName } = data;
    
    console.log('Looking for session with ID:', sessionId);
    console.log('Available sessions:', practiceSessions.map(s => ({ id: s.id, participants: s.participants })));
    
    // Broadcast message to all participants in the session (including sender)
    const session = practiceSessions.find(s => s.id === sessionId);
    if (session) {
      console.log('Found session:', session);
      session.participants.forEach(participantId => {
        const participantSocket = userSessions.get(participantId);
        if (participantSocket) {
          participantSocket.emit('session-message-received', {
            sessionId,
            message: {
              id: Date.now().toString(),
              senderId,
              senderName,
              content: message,
              timestamp: new Date().toISOString(),
              type: 'message'
            }
          });
        }
      });
    } else {
      console.log('Session not found for ID:', sessionId);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove user
    let disconnectedUserId = null;
    for (const [userId, userSocket] of userSessions.entries()) {
      if (userSocket.id === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      const user = users.get(disconnectedUserId);
      if (user) {
        user.isAvailable = false;
        user.lastActive = new Date();
        
        // Broadcast user left
        io.emit('user-left', {
          userId: disconnectedUserId,
          name: `${user.firstName} ${user.lastName}`
        });
      }
      
      users.delete(disconnectedUserId);
      userSessions.delete(disconnectedUserId);
    }
  });
});

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get available users
app.get('/api/v1/matching/users/available', (req, res) => {
  const excludeUserId = req.query.excludeUserId;
  const availableUsers = Array.from(users.values())
    .filter(user => user.isAvailable && user.id !== excludeUserId)
    .map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      role: 'Sales Rep',
      rating: user.rating,
      skillLevel: user.skillLevel,
      skills: user.skills,
      timezone: user.timezone,
      isAvailable: user.isAvailable,
      lastActive: user.lastActive,
      practiceCount: user.practiceCount,
      streak: user.streak,
      preferredSessionLength: user.preferredSessionLength,
      preferredSkillLevel: user.preferredSkillLevel,
    }));
  
  res.json({ success: true, data: availableUsers });
});

// Update user availability
app.put('/api/v1/matching/users/availability', (req, res) => {
  const { isAvailable, userId } = req.body;
  
  const user = users.get(userId);
  if (user) {
    user.isAvailable = isAvailable;
    user.lastActive = new Date();
    
    // Broadcast via WebSocket
    io.emit('user-availability-changed', {
      userId: userId,
      isAvailable: isAvailable,
      name: `${user.firstName} ${user.lastName}`
    });
    
    console.log(`User ${userId} availability updated to ${isAvailable}`);
  }
  
  res.json({ success: true, message: 'Availability updated successfully' });
});

// Get leaderboard
app.get('/api/v1/matching/leaderboard', (req, res) => {
  const leaderboard = Array.from(users.values())
    .map(user => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      totalSessions: user.practiceCount,
      currentStreak: user.streak,
      averageRating: user.rating,
      totalPracticeTime: user.practiceCount * 15,
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 10);
  
  res.json({ success: true, data: leaderboard });
});

// Get user stats
app.get('/api/v1/matching/users/stats', (req, res) => {
  const userId = req.headers.authorization?.replace('Bearer ', '') || req.query.userId;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  const stats = {
    totalSessions: user.practiceCount,
    currentStreak: user.streak,
    totalPracticeTime: user.practiceCount * 15,
    averageRating: user.rating,
    skillsProgress: {},
  };
  
  res.json({ success: true, data: stats });
});

// Invite specific user (REST API endpoint)
app.post('/api/v1/matching/invite', (req, res) => {
  const { targetUserId, topic, skillLevel, sessionLength } = req.body;
  const userId = req.headers.authorization?.replace('Bearer ', '') || req.query.userId || '1';
  
  const matchRequest = {
    id: Date.now().toString(),
    requesterId: userId,
    targetId: targetUserId,
    topic: topic || 'general-practice',
    skillLevel: skillLevel || 'intermediate',
    duration: sessionLength || 15,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
  
  matchRequests.push(matchRequest);
  
  // Send notification to target user via WebSocket if they're connected
  const targetSocket = userSessions.get(targetUserId);
  if (targetSocket) {
    const requester = users.get(userId);
    targetSocket.emit('invitation-received', {
      ...matchRequest,
      requesterName: requester ? `${requester.firstName} ${requester.lastName}` : 'Unknown User'
    });
  }
  
  res.json({
    success: true,
    data: matchRequest,
    message: 'Invitation sent successfully',
  });
});

// Accept invitation (REST API endpoint)
app.post('/api/v1/matching/invitations/:requestId/accept', (req, res) => {
  const { requestId } = req.params;
  const userId = req.headers.authorization?.replace('Bearer ', '') || req.query.userId || '1';
  
  const matchRequest = matchRequests.find(req => req.id === requestId);
  if (!matchRequest) {
    return res.status(404).json({ success: false, message: 'Invitation not found' });
  }
  
  const session = {
    id: Date.now().toString(),
    participants: [matchRequest.requesterId, userId],
    topic: matchRequest.topic,
    skillLevel: matchRequest.skillLevel,
    duration: matchRequest.duration,
    startTime: new Date(),
    status: 'active',
  };
  
  practiceSessions.push(session);
  matchRequest.status = 'accepted';
  
  // Notify both users via WebSocket
  const requesterSocket = userSessions.get(matchRequest.requesterId);
  const targetSocket = userSessions.get(userId);
  
  if (requesterSocket) {
    requesterSocket.emit('session-started', session);
  }
  if (targetSocket) {
    targetSocket.emit('session-started', session);
  }
  
  res.json({ success: true, data: session });
});

// Decline invitation (REST API endpoint)
app.post('/api/v1/matching/invitations/:requestId/decline', (req, res) => {
  const { requestId } = req.params;
  const userId = req.headers.authorization?.replace('Bearer ', '') || req.query.userId || '1';
  
  const matchRequest = matchRequests.find(req => req.id === requestId);
  if (matchRequest) {
    matchRequest.status = 'declined';
    
    // Notify requester via WebSocket
    const requesterSocket = userSessions.get(matchRequest.requesterId);
    if (requesterSocket) {
      requesterSocket.emit('invitation-declined', {
        requestId: requestId,
        targetId: userId
      });
    }
  }
  
  res.json({ success: true, message: 'Invitation declined successfully' });
});

// Get pending invitations
app.get('/api/v1/matching/invitations/pending', (req, res) => {
  const userId = req.headers.authorization?.replace('Bearer ', '') || req.query.userId;
  const pendingInvitations = matchRequests.filter(req => 
    req.targetId === userId && req.status === 'pending'
  );
  
  res.json({ success: true, data: pendingInvitations });
});

// End session with feedback
app.post('/api/v1/matching/sessions/:sessionId/end', (req, res) => {
  const { sessionId } = req.params;
  const { rating, notes, skillsPracticed } = req.body;
  const userId = req.headers.authorization?.replace('Bearer ', '') || req.query.userId || '1';
  
  const session = practiceSessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }
  
  // Update session
  session.status = 'completed';
  session.endTime = new Date();
  
  // Update user stats
  const user = users.get(userId);
  if (user) {
    user.practiceCount += 1;
    user.totalPracticeTime += session.duration;
    user.lastPracticeDate = new Date();
    
    // Update rating
    if (rating) {
      user.totalRating += rating;
      user.rating = user.totalRating / user.practiceCount;
    }
  }
  
  // Notify both participants via WebSocket
  session.participants.forEach(participantId => {
    const participantSocket = userSessions.get(participantId);
    if (participantSocket) {
      participantSocket.emit('session-ended', {
        sessionId,
        feedback: { rating, notes, skillsPracticed }
      });
    }
  });
  
  res.json({ success: true, message: 'Session ended successfully' });
});

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Available users: http://localhost:${PORT}/api/v1/matching/users/available`);
});
