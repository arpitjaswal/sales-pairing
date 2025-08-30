const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174",
      "https://endearing-meerkat-1129fa.netlify.app",
      "https://htcroleplay.highticketjobs.ai"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = 5001;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://endearing-meerkat-1129fa.netlify.app",
    "https://htcroleplay.highticketjobs.ai"
  ],
  credentials: true
}));
app.use(express.json());

// Real user data - starts empty, users register when they connect
const users = new Map(); // userId -> user data
const userSessions = new Map(); // userId -> socket session
const matchRequests = [];
const practiceSessions = [];
const quickMatchQueue = []; // Queue for quick matching
const quickMatchRetries = new Map(); // userId -> retry count and start time
const declinedUsers = new Map(); // requesterId -> Set of declined user IDs

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their info
  socket.on('user-join', (userData) => {
    const userId = userData.id || socket.id;
    
    // Check if this is a reconnection (user already exists)
    const existingUser = users.get(userId);
    const isReconnection = !!existingUser;
    
    // Create or update user
    users.set(userId, {
      id: userId,
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || userId.slice(0, 6),
      email: userData.email || `${userId}@example.com`,
      isAvailable: existingUser ? existingUser.isAvailable : false,
      lastActive: new Date(),
      practiceCount: existingUser ? existingUser.practiceCount : 0,
      streak: existingUser ? existingUser.streak : 0,
      rating: existingUser ? existingUser.rating : 0,
      skillLevel: existingUser ? existingUser.skillLevel : 'intermediate',
      skills: existingUser ? existingUser.skills : ['cold-calling', 'objection-handling'],
      timezone: existingUser ? existingUser.timezone : 'UTC',
      preferredSessionLength: existingUser ? existingUser.preferredSessionLength : 15,
      preferredSkillLevel: existingUser ? existingUser.preferredSkillLevel : 'any',
      socketId: socket.id
    });
    
    userSessions.set(userId, socket);
    
    // If this is a reconnection, preserve the declined users list
    if (isReconnection) {
      console.log(`User ${userId} reconnected. Preserving declined users list.`);
    }
    
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

  // Quick match functionality
  socket.on('quick-match', (data) => {
    const { userId, topic, skillLevel, sessionLength, preferredSkillLevel } = data;
    const user = users.get(userId);
    
    if (!user || !user.isAvailable) {
      socket.emit('quick-match-error', { message: 'User not available for matching' });
      return;
    }

    console.log(`User ${userId} requested quick match`);

    // Initialize retry tracking for this user
    quickMatchRetries.set(userId, {
      count: 0,
      startTime: new Date(),
      maxRetries: 10, // Maximum 10 retries
      timeout: 5 * 60 * 1000 // 5 minutes timeout
    });

    // Start the matching process
    attemptQuickMatch(userId, {
      topic,
      skillLevel: skillLevel || user.skillLevel,
      preferredSkillLevel: preferredSkillLevel || user.preferredSkillLevel,
      sessionLength: sessionLength || user.preferredSessionLength
    });
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
      isQuickMatch: false
    };
    
    matchRequests.push(matchRequest);
    
    // Send notification to target user
    const targetSocket = userSessions.get(targetUserId);
    if (targetSocket) {
      const requester = users.get(requesterId);
      targetSocket.emit('invitation-received', {
        ...matchRequest,
        requesterName: requester ? `${requester.firstName} ${requester.lastName}` : 'Unknown User',
        isQuickMatch: false
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
      
      // Make both users unavailable
      const requester = users.get(matchRequest.requesterId);
      const target = users.get(userId);
      
      if (requester) {
        requester.isAvailable = false;
        const requesterSocket = userSessions.get(matchRequest.requesterId);
        if (requesterSocket) {
          requesterSocket.emit('user-availability-changed', {
            userId: matchRequest.requesterId,
            isAvailable: false,
            name: `${requester.firstName} ${requester.lastName}`
          });
        }
      }
      
      if (target) {
        target.isAvailable = false;
        const targetSocket = userSessions.get(userId);
        if (targetSocket) {
          targetSocket.emit('user-availability-changed', {
            userId: userId,
            isAvailable: false,
            name: `${target.firstName} ${target.lastName}`
          });
        }
      }
      
      // Notify both users about the session
      const requesterSocket = userSessions.get(matchRequest.requesterId);
      const targetSocket = userSessions.get(userId);
      
      console.log(`Sending session-started to requester ${matchRequest.requesterId}:`, session);
      console.log(`Sending session-started to target ${userId}:`, session);
      
      if (requesterSocket) {
        requesterSocket.emit('session-started', session);
      }
      if (targetSocket) {
        targetSocket.emit('session-started', session);
      }
      
      // Update available users for all connected users
      updateAvailableUsersForAll();
      
      // Clear retry tracking and declined users list since match was accepted
      if (matchRequest.isQuickMatch) {
        quickMatchRetries.delete(matchRequest.requesterId);
        declinedUsers.delete(matchRequest.requesterId);
        console.log(`Cleared retry tracking for ${matchRequest.requesterId} after successful match`);
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
      
      // Track this user as declined for the requester
      if (!declinedUsers.has(matchRequest.requesterId)) {
        declinedUsers.set(matchRequest.requesterId, new Set());
      }
      declinedUsers.get(matchRequest.requesterId).add(userId);
      
      // Debug logging
      console.log(`Invitation ${requestId} declined by ${userId}. Added to declined list for ${matchRequest.requesterId}`);
      console.log(`Current declined users for ${matchRequest.requesterId}:`, Array.from(declinedUsers.get(matchRequest.requesterId)));
      debugSystemState();
      
      // Notify requester about decline
      const requesterSocket = userSessions.get(matchRequest.requesterId);
      if (requesterSocket) {
        requesterSocket.emit('invitation-declined', {
          requestId: requestId,
          targetId: userId
        });
        
        // If this was a quick match, try to find another match with retry logic
        if (matchRequest.isQuickMatch) {
          setTimeout(() => {
            console.log(`\n=== RETRYING QUICK MATCH ===`);
            console.log(`Retrying quick match for ${matchRequest.requesterId} after decline from ${userId}`);
            console.log(`Available users before retry:`, Array.from(users.values()).filter(u => u.isAvailable).map(u => u.id));
            console.log(`Declined users for ${matchRequest.requesterId}:`, Array.from(declinedUsers.get(matchRequest.requesterId) || new Set()));
            
            attemptQuickMatch(matchRequest.requesterId, {
              topic: matchRequest.topic,
              skillLevel: matchRequest.skillLevel,
              preferredSkillLevel: 'any', // Broaden search after decline
              sessionLength: matchRequest.duration
            });
          }, 1000);
        }
      }
    }
  });

  // Send message in session
  socket.on('send-session-message', (data) => {
    const { sessionId, message, senderId, senderName } = data;
    
    // Broadcast message to all participants in the session (including sender)
    const session = practiceSessions.find(s => s.id === sessionId);
    if (session) {
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
        
              // Remove from quick match queue
      const queueIndex = quickMatchQueue.findIndex(entry => entry.userId === disconnectedUserId);
      if (queueIndex !== -1) {
        quickMatchQueue.splice(queueIndex, 1);
      }
      
      // Clean up declined users tracking for this user's requests
      declinedUsers.delete(disconnectedUserId);
      
      // Remove this user from other users' declined lists
      for (const [requesterId, declinedSet] of declinedUsers.entries()) {
        declinedSet.delete(disconnectedUserId);
      }
        
        // Broadcast user left
        io.emit('user-left', {
          userId: disconnectedUserId,
          name: `${user.firstName} ${user.lastName}`
        });
      }
      
      users.delete(disconnectedUserId);
      userSessions.delete(disconnectedUserId);
      
      // Update available users for remaining users
      updateAvailableUsersForAll();
    }
  });
});

// Helper functions for quick matching
function attemptQuickMatch(userId, preferences) {
  console.log(`\n=== ATTEMPT QUICK MATCH ===`);
  console.log(`Attempting quick match for: ${userId}`);
  console.log(`Preferences:`, preferences);
  
  const retryInfo = quickMatchRetries.get(userId);
  if (!retryInfo) {
    console.log(`No retry info found for ${userId}, returning`);
    return;
  }

  // Check if we've exceeded timeout
  const timeElapsed = Date.now() - retryInfo.startTime;
  if (timeElapsed > retryInfo.timeout) {
    const userSocket = userSessions.get(userId);
    if (userSocket) {
      userSocket.emit('quick-match-timeout', { 
        message: 'No users available after 5 minutes. Please try again later.' 
      });
    }
    quickMatchRetries.delete(userId);
    return;
  }

  // Check if we've exceeded max retries
  if (retryInfo.count >= retryInfo.maxRetries) {
    const userSocket = userSessions.get(userId);
    if (userSocket) {
      userSocket.emit('quick-match-timeout', { 
        message: 'Maximum retry attempts reached. Please try again later.' 
      });
    }
    quickMatchRetries.delete(userId);
    return;
  }

  // Increment retry count
  retryInfo.count++;

  // Find compatible users
  const compatibleUsers = findCompatibleUsers(userId, preferences);
  
  if (compatibleUsers.length === 0) {
    // Check if we've tried all available users
    const declinedUserIds = declinedUsers.get(userId) || new Set();
    const totalAvailableUsers = Array.from(users.values()).filter(u => 
      u.id !== userId && u.isAvailable
    ).length;
    
    if (declinedUserIds.size >= totalAvailableUsers) {
      // All available users have declined
      const userSocket = userSessions.get(userId);
      if (userSocket) {
        userSocket.emit('quick-match-no-users', { 
          message: 'All available users have declined. No more users available for matching.' 
        });
      }
      quickMatchRetries.delete(userId);
      return;
    }
    
    // No compatible users found, add to queue and retry later
    const queueEntry = {
      userId,
      topic: preferences.topic,
      skillLevel: preferences.skillLevel,
      sessionLength: preferences.sessionLength,
      preferredSkillLevel: preferences.preferredSkillLevel,
      timestamp: new Date()
    };
    
    // Remove existing queue entry for this user
    const existingIndex = quickMatchQueue.findIndex(entry => entry.userId === userId);
    if (existingIndex !== -1) {
      quickMatchQueue.splice(existingIndex, 1);
    }
    
    quickMatchQueue.push(queueEntry);
    
    const userSocket = userSessions.get(userId);
    if (userSocket) {
      userSocket.emit('quick-match-queued', { 
        message: `No more compatible users available. Waiting for new users... (Attempt ${retryInfo.count}/${retryInfo.maxRetries})` 
      });
    }
    
    // Retry after 5 seconds to give time for new users
    setTimeout(() => {
      attemptQuickMatch(userId, preferences);
    }, 5000);
    
    return;
  }

  // Find the best match
  const user = users.get(userId);
  const bestMatch = selectBestMatch(compatibleUsers, user);
  
  // Create match request
  const matchRequest = {
    id: Date.now().toString(),
    requesterId: userId,
    targetId: bestMatch.id,
    topic: preferences.topic || 'general-practice',
    skillLevel: preferences.skillLevel || user.skillLevel,
    duration: preferences.sessionLength || user.preferredSessionLength,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    isQuickMatch: true
  };
  
  matchRequests.push(matchRequest);
  
  // Send invitation to the matched user
  const targetSocket = userSessions.get(bestMatch.id);
  if (targetSocket) {
    targetSocket.emit('invitation-received', {
      ...matchRequest,
      requesterName: `${user.firstName} ${user.lastName}`,
      isQuickMatch: true
    });
    
    // Also notify the requester
    const requesterSocket = userSessions.get(userId);
    if (requesterSocket) {
      requesterSocket.emit('quick-match-found', {
        message: `Found compatible user: ${bestMatch.firstName} ${bestMatch.lastName}`,
        matchRequest,
        matchedUser: bestMatch
      });
    }
    
    // DON'T clear retry tracking here - only clear when match is accepted
    // This allows for retries if the invitation is declined
  }
}

function findCompatibleUsers(excludeUserId, preferences) {
  // Get the set of declined users for this requester
  const declinedUserIds = declinedUsers.get(excludeUserId) || new Set();
  
  console.log(`\n=== Finding compatible users for ${excludeUserId} ===`);
  console.log(`Declined users:`, Array.from(declinedUserIds));
  console.log(`Total available users:`, Array.from(users.values()).filter(u => u.isAvailable).length);
  console.log(`All available users:`, Array.from(users.values()).filter(u => u.isAvailable).map(u => u.id));
  
  const compatibleUsers = Array.from(users.values())
    .filter(user => 
      user.id !== excludeUserId && 
      user.isAvailable &&
      isCompatible(user, preferences) &&
      !declinedUserIds.has(user.id) // Exclude users who have already declined
    );
  
  console.log(`Compatible users after filtering:`, compatibleUsers.map(u => u.id));
  console.log(`=== End search ===\n`);
  return compatibleUsers;
}

function isCompatible(user, preferences) {
  // Check skill level compatibility
  if (preferences.preferredSkillLevel === 'similar') {
    if (user.skillLevel !== preferences.skillLevel) {
      return false;
    }
  } else if (preferences.preferredSkillLevel === 'advanced') {
    if (user.skillLevel !== 'advanced') {
      return false;
    }
  }
  
  // Check session length compatibility (within 5 minutes)
  const lengthDiff = Math.abs(user.preferredSessionLength - preferences.sessionLength);
  if (lengthDiff > 5) {
    return false;
  }
  
  return true;
}

function selectBestMatch(compatibleUsers, requester) {
  // Score users based on compatibility
  const scoredUsers = compatibleUsers.map(user => {
    let score = 0;
    
    // Skill level match
    if (user.skillLevel === requester.skillLevel) score += 10;
    else if (Math.abs(getSkillLevelValue(user.skillLevel) - getSkillLevelValue(requester.skillLevel)) === 1) score += 5;
    
    // Session length match
    const lengthDiff = Math.abs(user.preferredSessionLength - requester.preferredSessionLength);
    if (lengthDiff === 0) score += 8;
    else if (lengthDiff <= 5) score += 4;
    
    // Rating compatibility
    const ratingDiff = Math.abs(user.rating - requester.rating);
    if (ratingDiff <= 1) score += 6;
    else if (ratingDiff <= 2) score += 3;
    
    // Recent activity bonus
    const hoursSinceActive = (new Date() - user.lastActive) / (1000 * 60 * 60);
    if (hoursSinceActive < 1) score += 3;
    else if (hoursSinceActive < 24) score += 1;
    
    return { ...user, score };
  });
  
  // Sort by score and return the best match
  scoredUsers.sort((a, b) => b.score - a.score);
  return scoredUsers[0];
}

function getSkillLevelValue(level) {
  switch (level) {
    case 'beginner': return 1;
    case 'intermediate': return 2;
    case 'advanced': return 3;
    default: return 2;
  }
}

function tryQuickMatchForUser(userId) {
  const user = users.get(userId);
  if (!user || !user.isAvailable) return;
  
  // Use the new retry logic
  attemptQuickMatch(userId, {
    topic: 'general-practice',
    skillLevel: user.skillLevel,
    preferredSkillLevel: user.preferredSkillLevel,
    sessionLength: user.preferredSessionLength
  });
}

function cleanupExpiredQueueEntries() {
  const now = new Date();
  const expiredIndexes = [];
  
  quickMatchQueue.forEach((entry, index) => {
    const ageInMinutes = (now - entry.timestamp) / (1000 * 60);
    if (ageInMinutes > 10) { // Remove entries older than 10 minutes
      expiredIndexes.push(index);
    }
  });
  
  // Remove expired entries (in reverse order to maintain indices)
  expiredIndexes.reverse().forEach(index => {
    quickMatchQueue.splice(index, 1);
  });
  
  if (expiredIndexes.length > 0) {
    console.log(`Cleaned up ${expiredIndexes.length} expired queue entries`);
  }
}

function updateAvailableUsersForAll() {
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
}

function debugSystemState() {
  console.log('\n=== SYSTEM STATE DEBUG ===');
  console.log('Connected users:', Array.from(userSessions.keys()));
  console.log('Available users:', Array.from(users.values()).filter(u => u.isAvailable).map(u => u.id));
  console.log('Declined users map:');
  for (const [requesterId, declinedSet] of declinedUsers.entries()) {
    console.log(`  ${requesterId}:`, Array.from(declinedSet));
  }
  console.log('=== END DEBUG ===\n');
}

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Debug endpoint to check system state
app.get('/debug', (req, res) => {
  const systemState = {
    connectedUsers: Array.from(userSessions.keys()),
    availableUsers: Array.from(users.values()).filter(u => u.isAvailable).map(u => u.id),
    declinedUsers: {},
    totalUsers: users.size,
    totalSessions: userSessions.size
  };
  
  for (const [requesterId, declinedSet] of declinedUsers.entries()) {
    systemState.declinedUsers[requesterId] = Array.from(declinedSet);
  }
  
  res.json(systemState);
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
  
  // Make users available again
  session.participants.forEach(participantId => {
    const participant = users.get(participantId);
    if (participant) {
      participant.isAvailable = true;
      participant.lastActive = new Date();
    }
  });
  
  // Notify both participants via WebSocket
  session.participants.forEach(participantId => {
    const participant = users.get(participantId);
    const participantSocket = userSessions.get(participantId);
    if (participantSocket && participant) {
      participantSocket.emit('session-ended', {
        sessionId,
        feedback: { rating, notes, skillsPracticed }
      });
      
      // Update availability
      participantSocket.emit('user-availability-changed', {
        userId: participantId,
        isAvailable: true,
        name: `${participant.firstName} ${participant.lastName}`
      });
    }
  });
  
  // Update available users for all
  updateAvailableUsersForAll();
  
  res.json({ success: true, message: 'Session ended successfully' });
});

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Available users: http://localhost:${PORT}/api/v1/matching/users/available`);
});
