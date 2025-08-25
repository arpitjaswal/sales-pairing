import axios from 'axios';

// Smart fallback for API URL based on environment
const isProduction = import.meta.env.PROD;
const defaultApiUrl = isProduction ? 'https://sales-pairing.onrender.com/api/v1' : 'http://localhost:5001/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUser');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface MatchingUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  rating: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  timezone: string;
  isAvailable: boolean;
  lastActive: Date;
  practiceCount: number;
  streak: number;
  preferredSessionLength: number;
  preferredSkillLevel: 'any' | 'similar' | 'advanced';
}

export interface PracticeSession {
  id: string;
  participants: string[];
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  startTime: Date;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  ratings?: { [userId: string]: number };
}

export interface MatchRequest {
  id: string;
  requesterId: string;
  targetId?: string;
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface UserStats {
  totalSessions: number;
  currentStreak: number;
  totalPracticeTime: number;
  averageRating: number;
  skillsProgress: { [skill: string]: number };
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  totalSessions: number;
  currentStreak: number;
  averageRating: number;
  totalPracticeTime: number;
}

export const matchingService = {
  // Get all available users
  async getAvailableUsers(currentUserId?: string): Promise<MatchingUser[]> {
    try {
      const params = currentUserId ? { excludeUserId: currentUserId } : {};
      const response = await api.get('/matching/users/available', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error getting available users:', error);
      throw error;
    }
  },

  // Update user availability
  async updateAvailability(isAvailable: boolean, userId?: string): Promise<void> {
    try {
      await api.put('/matching/users/availability', { 
        isAvailable,
        userId: userId || '1' // fallback for testing
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  },

  // Start random matching
  async startRandomMatching(preferences: {
    topic?: string;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
    sessionLength?: number;
    preferredSkillLevel?: 'any' | 'similar' | 'advanced';
  }): Promise<{
    matchRequest: MatchRequest;
    matchedUser: MatchingUser | null;
    session?: PracticeSession;
    message?: string;
  }> {
    try {
      const response = await api.post('/matching/random', preferences);
      return response.data.data;
    } catch (error) {
      console.error('Error starting random matching:', error);
      throw error;
    }
  },

  // Invite specific user
  async inviteUser(data: {
    targetUserId: string;
    topic?: string;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
    sessionLength?: number;
  }, sessionUserId?: string): Promise<MatchRequest> {
    try {
      const params = sessionUserId ? { userId: sessionUserId } : {};
      const response = await api.post('/matching/invite', data, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  },

  // Accept invitation
  async acceptInvitation(requestId: string, sessionUserId?: string): Promise<PracticeSession> {
    try {
      const params = sessionUserId ? { userId: sessionUserId } : {};
      const response = await api.post(`/matching/invitations/${requestId}/accept`, {}, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  // Decline invitation
  async declineInvitation(requestId: string, sessionUserId?: string): Promise<void> {
    try {
      const params = sessionUserId ? { userId: sessionUserId } : {};
      await api.post(`/matching/invitations/${requestId}/decline`, {}, { params });
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  },

  // Get pending invitations
  async getPendingInvitations(): Promise<MatchRequest[]> {
    try {
      const response = await api.get('/matching/invitations/pending');
      return response.data.data;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      throw error;
    }
  },

  // End practice session
  async endSession(sessionId: string, feedback?: any): Promise<void> {
    try {
      await api.post(`/matching/sessions/${sessionId}/end`, feedback);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Get leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get('/matching/leaderboard');
      return response.data.data;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/matching/users/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  // Cancel match request
  async cancelMatchRequest(requestId: string): Promise<void> {
    try {
      await api.delete(`/matching/requests/${requestId}`);
    } catch (error) {
      console.error('Error cancelling match request:', error);
      throw error;
    }
  },
};

export default matchingService;
