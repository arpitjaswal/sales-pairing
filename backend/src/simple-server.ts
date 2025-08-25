import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for testing
let users: any[] = [
  {
    id: '1',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
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
  }
];

let matchRequests: any[] = [];
let practiceSessions: any[] = [];

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get available users
app.get('/api/v1/matching/users/available', (req, res) => {
  const excludeUserId = req.query.excludeUserId;
  const availableUsers = users
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
  const { isAvailable } = req.body;
  const userId = req.headers.authorization?.replace('Bearer ', '') || '1'; // For testing, use user 1
  
  const user = users.find(u => u.id === userId);
  if (user) {
    user.isAvailable = isAvailable;
    user.lastActive = new Date();
  }
  
  res.json({ success: true, message: 'Availability updated successfully' });
});

// Start random matching
app.post('/api/v1/matching/random', (req, res) => {
  const { topic, skillLevel, sessionLength } = req.body;
  const userId = req.headers.authorization?.replace('Bearer ', '') || '1';
  
  const matchRequest = {
    id: Date.now().toString(),
    requesterId: userId,
    topic: topic || 'general-practice',
    skillLevel: skillLevel || 'intermediate',
    duration: sessionLength || 15,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
  
  matchRequests.push(matchRequest);
  
  // Find a match
  const availableUsers = users.filter(u => u.isAvailable && u.id !== userId);
  let matchedUser = null;
  let session = null;
  
  if (availableUsers.length > 0) {
    matchedUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
    
    session = {
      id: Date.now().toString(),
      participants: [userId, matchedUser.id],
      topic: matchRequest.topic,
      skillLevel: matchRequest.skillLevel,
      duration: matchRequest.duration,
      startTime: new Date(),
      status: 'active',
    };
    
    practiceSessions.push(session);
  }
  
  res.json({
    success: true,
    data: {
      matchRequest,
      matchedUser,
      session,
    },
  });
});

// Get leaderboard
app.get('/api/v1/matching/leaderboard', (_req, res) => {
  const leaderboard = users
    .map(user => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      totalSessions: user.practiceCount,
      currentStreak: user.streak,
      averageRating: user.rating,
      totalPracticeTime: user.practiceCount * 15, // Assume 15 minutes per session
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 10);
  
  res.json({ success: true, data: leaderboard });
});

// Get user stats
app.get('/api/v1/matching/users/stats', (req, res) => {
  const userId = req.headers.authorization?.replace('Bearer ', '') || '1';
  const user = users.find(u => u.id === userId);
  
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

// Start server
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
