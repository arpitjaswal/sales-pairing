import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { matchingService } from '../services/matching';
import { websocketService } from '../services/websocket';

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
  preferredSessionLength: number; // in minutes
  preferredSkillLevel: 'any' | 'similar' | 'advanced';
}

export interface PracticeSession {
  id: string;
  participants: string[];
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  startTime: Date;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  ratings?: { [userId: string]: number };
}

export interface MatchRequest {
  id: string;
  requesterId: string;
  requesterName?: string;
  targetId?: string; // undefined for random matching
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'searching';
  createdAt: Date;
  expiresAt: Date;
}

interface MatchingContextType {
  // User availability
  isAvailable: boolean;
  setIsAvailable: (available: boolean) => void;
  
  // Online users
  onlineUsers: MatchingUser[];
  setOnlineUsers: (users: MatchingUser[]) => void;
  
  // Current user preferences
  userPreferences: {
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredSkillLevel: 'any' | 'similar' | 'advanced';
    sessionLength: number;
    skills: string[];
  };
  updatePreferences: (preferences: Partial<MatchingContextType['userPreferences']>) => void;
  
  // Matching
  currentMatchRequest: MatchRequest | null;
  startRandomMatching: () => Promise<void>;
  inviteUser: (userId: string) => Promise<void>;
  acceptInvitation: (requestId: string) => Promise<void>;
  declineInvitation: (requestId: string) => Promise<void>;
  cancelMatching: () => Promise<void>;
  
  // Active session
  activeSession: PracticeSession | null;
  startSession: (session: PracticeSession) => void;
  endSession: (sessionId: string, feedback?: any) => void;
  startPracticeSession: (session: PracticeSession) => void;
  closePracticeSession: () => void;
  sessionUserId: string;
  
  // Pending invitations
  pendingInvitations: MatchRequest[];
  
  // Notifications
  notification: { message: string; type: 'info' | 'success' | 'error' | 'warning' } | null;
  setNotification: (notification: { message: string; type: 'info' | 'success' | 'error' | 'warning' } | null) => void;
  
  // Statistics
  userStats: {
    totalSessions: number;
    currentStreak: number;
    totalPracticeTime: number;
    averageRating: number;
    skillsProgress: { [skill: string]: number };
  };
  
  // Leaderboard
  leaderboard: Array<{
    userId: string;
    name: string;
    avatar?: string;
    totalSessions: number;
    currentStreak: number;
    averageRating: number;
    totalPracticeTime: number;
  }>;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

interface MatchingProviderProps {
  children: ReactNode;
}

export const MatchingProvider: React.FC<MatchingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // User availability
  const [isAvailable, setIsAvailable] = useState(false);
  
  // Online users
  const [onlineUsers, setOnlineUsers] = useState<MatchingUser[]>([]);
  
  // User preferences
  const [userPreferences, setUserPreferences] = useState<MatchingContextType['userPreferences']>({
    skillLevel: 'intermediate',
    preferredSkillLevel: 'any',
    sessionLength: 15,
    skills: ['cold-calling', 'objection-handling', 'closing-techniques'],
  });
  
  // Current match request
  const [currentMatchRequest, setCurrentMatchRequest] = useState<MatchRequest | null>(null);
  
  // Active session
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string>('');
  
  // Pending invitations
  const [pendingInvitations, setPendingInvitations] = useState<MatchRequest[]>([]);
  
  // User statistics
  const [userStats, setUserStats] = useState({
    totalSessions: 0,
    currentStreak: 0,
    totalPracticeTime: 0,
    averageRating: 0,
    skillsProgress: {} as { [skill: string]: number },
  });
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<MatchingContextType['leaderboard']>([]);
  
  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);
  
  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Session management functions
  const startPracticeSession = (session: PracticeSession) => {
    setActiveSession(session);
    // Make user unavailable when entering a session
    updateAvailability(false);
    navigate(`/practice-session/${session.id}`);
  };

  const closePracticeSession = () => {
    setActiveSession(null);
    // Make user available again when leaving a session
    updateAvailability(true);
    navigate('/matching');
  };

  // Initialize with real data
  useEffect(() => {
    if (user) {
      // Connect to WebSocket with stable user ID based on email
      const userId = user.email ? `user-${user.email.replace(/[^a-zA-Z0-9]/g, '')}` : `user-${Date.now()}`;
      setSessionUserId(userId);
      websocketService.connect(userId, {
        firstName: user.firstName || 'User',
        lastName: user.lastName || 'Session',
        email: user.email,
      });

      // Set up WebSocket event listeners
      websocketService.onAvailableUsers((users) => {
        console.log('Received available users:', users);
        // Filter out current user from the received list
        const filteredUsers = users.filter(user => user.id !== userId);
        setOnlineUsers(filteredUsers);
      });

      websocketService.onUserJoined((_newUser) => {
        // User joined, but not available yet
      });

      websocketService.onUserLeft((leftUser) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== leftUser.userId));
      });

      websocketService.onUserAvailabilityChanged((data) => {
        console.log('User availability changed:', data);
        if (data.userId === userId) {
          setIsAvailable(data.isAvailable);
        } else {
          setOnlineUsers(prev => 
            prev.map(u => 
              u.id === data.userId 
                ? { ...u, isAvailable: data.isAvailable }
                : u
            )
          );
        }
      });

      websocketService.onInvitationReceived((invitation) => {
        console.log('Invitation received:', invitation);
        setPendingInvitations(prev => {
          const newInvitations = [...prev, invitation];
          console.log('Updated pending invitations:', newInvitations);
          return newInvitations;
        });
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Practice Invitation', {
            body: `${invitation.requesterName} wants to practice with you!`,
            icon: '/favicon.ico'
          });
        }
        // Force show invitations dialog
        setTimeout(() => {
          const event = new CustomEvent('show-invitations');
          window.dispatchEvent(event);
        }, 1000);
      });

      websocketService.onInvitationSent((_invitation) => {
        // Show confirmation
        console.log('Invitation sent successfully');
      });

      websocketService.onInvitationDeclined((data) => {
        setPendingInvitations(prev => prev.filter(inv => inv.id !== data.requestId));
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Invitation Declined', {
            body: 'Your practice invitation was declined',
            icon: '/favicon.ico'
          });
        }
      });

      websocketService.onSessionStarted((session) => {
        console.log('Session started via WebSocket:', session);
        console.log('Current session user ID:', userId);
        console.log('Session participants:', session.participants);
        console.log('Session participants type:', typeof session.participants);
        console.log('Session participants length:', session.participants ? session.participants.length : 'null');
        console.log('Is current user a participant?', session.participants && session.participants.includes(userId));
        console.log('Session participants array check:', Array.isArray(session.participants));
        
        // Only start the session if the current user is a participant
        if (session.participants && Array.isArray(session.participants) && session.participants.includes(userId)) {
          console.log('Current user is a participant, starting session');
          startPracticeSession(session);
          setCurrentMatchRequest(null);
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Practice Session Started', {
              body: 'Your practice session has begun!',
              icon: '/favicon.ico'
            });
          }
        } else {
          console.log('Current user is not a participant in this session');
          console.log('Reason: participants not found or not an array or user not included');
        }
      });

      // Quick match event listeners
      websocketService.onQuickMatchFound((data) => {
        console.log('Quick match found:', data);
        setCurrentMatchRequest(data.matchRequest);
        setNotification({ 
          message: `Found match: ${data.matchedUser.firstName} ${data.matchedUser.lastName}`, 
          type: 'success' 
        });
      });

      websocketService.onQuickMatchQueued((data) => {
        console.log('Quick match queued:', data);
        setNotification({ 
          message: data.message, 
          type: 'info' 
        });
      });

      websocketService.onQuickMatchError((data) => {
        console.log('Quick match error:', data);
        setNotification({ 
          message: data.message, 
          type: 'error' 
        });
      });

      websocketService.onQuickMatchTimeout((data) => {
        console.log('Quick match timeout:', data);
        setNotification({ 
          message: data.message, 
          type: 'warning' 
        });
        setCurrentMatchRequest(null);
      });

      websocketService.onQuickMatchNoUsers((data) => {
        console.log('Quick match no users:', data);
        setNotification({ 
          message: data.message, 
          type: 'error' 
        });
        setCurrentMatchRequest(null);
      });

      loadInitialData();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  const loadInitialData = async () => {
    try {
      // Load available users (excluding current user)
      const users = await matchingService.getAvailableUsers(user?.id);
      setOnlineUsers(users);

      // Load leaderboard
      const leaderboardData = await matchingService.getLeaderboard();
      setLeaderboard(leaderboardData);

      // Load user stats
      const stats = await matchingService.getUserStats();
      setUserStats(stats);

      // Load pending invitations
      const invitations = await matchingService.getPendingInvitations();
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Update preferences
  const updatePreferences = (newPreferences: Partial<MatchingContextType['userPreferences']>) => {
    setUserPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  // Update availability
  const updateAvailability = async (available: boolean) => {
    try {
      console.log('Updating availability to:', available);
      // Update via WebSocket for real-time
      websocketService.updateAvailability(available);
      
      // Also update via REST API for persistence
      await matchingService.updateAvailability(available, user?.id);
      setIsAvailable(available);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  // Start random matching
  const startRandomMatching = async () => {
    if (!user) return;
    
    try {
      // Use WebSocket for real-time quick matching
      websocketService.quickMatch({
        topic: userPreferences.skills[0] || 'general-practice',
        skillLevel: userPreferences.skillLevel,
        sessionLength: userPreferences.sessionLength,
        preferredSkillLevel: userPreferences.preferredSkillLevel,
      });
      
      // Show loading state
      setNotification({ message: 'Looking for a compatible match...', type: 'info' });
      
      // Set searching state
      setCurrentMatchRequest({
        id: 'searching',
        requesterId: user.id,
        topic: userPreferences.skills[0] || 'general-practice',
        skillLevel: userPreferences.skillLevel,
        duration: userPreferences.sessionLength,
        status: 'searching',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    } catch (error) {
      console.error('Error starting random matching:', error);
      setNotification({ message: 'Failed to start matching', type: 'error' });
    }
  };

  // Invite specific user
  const inviteUser = async (userId: string) => {
    if (!user) return;
    
    try {
      // Send invitation via WebSocket for real-time only
      websocketService.sendInvitation(
        userId, 
        userPreferences.skills[0] || 'general-practice',
        userPreferences.skillLevel,
        userPreferences.sessionLength
      );
      
      // Don't call REST API - let WebSocket handle everything
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  // Accept invitation
  const acceptInvitation = async (requestId: string) => {
    try {
      // Accept via WebSocket for real-time only
      websocketService.acceptInvitation(requestId, sessionUserId);
      
      // Remove invitation from pending list
      setPendingInvitations(prev => prev.filter(inv => inv.id !== requestId));
      
      // Don't call REST API - let WebSocket handle session creation
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  // Decline invitation
  const declineInvitation = async (requestId: string) => {
    try {
      // Decline via WebSocket for real-time
      websocketService.declineInvitation(requestId);
      
      // Also decline via REST API for persistence
      await matchingService.declineInvitation(requestId, sessionUserId);
      setPendingInvitations(prev => prev.filter(inv => inv.id !== requestId));
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  // Cancel matching
  const cancelMatching = async () => {
    if (currentMatchRequest) {
      try {
        await matchingService.cancelMatchRequest(currentMatchRequest.id);
        setCurrentMatchRequest(null);
      } catch (error) {
        console.error('Error cancelling matching:', error);
      }
    }
  };

  // Start session
  const startSession = (session: PracticeSession) => {
    setActiveSession(session);
  };

  // End session
  const endSession = async (sessionId: string, feedback?: any) => {
    try {
      await matchingService.endSession(sessionId, feedback);
      
      // Reload user stats
      const stats = await matchingService.getUserStats();
      setUserStats(stats);
      
      setActiveSession(null);
      // Make user available again when session ends
      updateAvailability(true);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const value: MatchingContextType = {
    isAvailable,
    setIsAvailable: updateAvailability,
    onlineUsers,
    setOnlineUsers,
    userPreferences,
    updatePreferences,
    currentMatchRequest,
    startRandomMatching,
    inviteUser,
    acceptInvitation,
    declineInvitation,
    cancelMatching,
    activeSession,
    startSession,
    endSession,
    startPracticeSession,
    closePracticeSession,
    sessionUserId,
    pendingInvitations,
    notification,
    setNotification,
    userStats,
    leaderboard,
  };

  return (
    <MatchingContext.Provider value={value}>
      {children}
    </MatchingContext.Provider>
  );
};

export const useMatching = (): MatchingContextType => {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};
