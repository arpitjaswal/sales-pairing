import { Repository } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { MatchRequest } from './match-request.entity';
import { User } from '../users/user.entity';
import { PracticeSession } from './practice-session.entity';
import { logger } from '../../common/logger';

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

export interface PracticeSessionData {
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

export class MatchingService {
  private matchRequestRepository: Repository<MatchRequest>;
  private userRepository: Repository<User>;
  private sessionRepository: Repository<PracticeSession>;

  constructor() {
    this.matchRequestRepository = AppDataSource.getRepository(MatchRequest);
    this.userRepository = AppDataSource.getRepository(User);
    this.sessionRepository = AppDataSource.getRepository(PracticeSession);
  }

  // Get all available users for matching
  async getAvailableUsers(excludeUserId?: string): Promise<MatchingUser[]> {
    try {
      const users = await this.userRepository.find({
        where: { isAvailable: true },
        select: [
          'id', 'firstName', 'lastName', 'avatar', 'role', 'rating', 
          'skillLevel', 'skills', 'timezone', 'isAvailable', 'lastActive',
          'practiceCount', 'streak', 'preferredSessionLength', 'preferredSkillLevel'
        ]
      });

      return users
        .filter(user => user.id !== excludeUserId)
        .map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          role: user.role,
          rating: user.rating || 0,
          skillLevel: user.skillLevel || 'intermediate',
          skills: user.skills || [],
          timezone: user.timezone || 'UTC',
          isAvailable: user.isAvailable,
          lastActive: user.lastActive || new Date(),
          practiceCount: user.practiceCount || 0,
          streak: user.streak || 0,
          preferredSessionLength: user.preferredSessionLength || 15,
          preferredSkillLevel: user.preferredSkillLevel || 'any',
        }));
    } catch (error) {
      logger.error('Error getting available users:', error);
      throw error;
    }
  }

  // Update user availability
  async updateUserAvailability(userId: string, isAvailable: boolean): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        isAvailable,
        lastActive: new Date(),
      });
      logger.info(`User ${userId} availability updated to ${isAvailable}`);
    } catch (error) {
      logger.error('Error updating user availability:', error);
      throw error;
    }
  }

  // Create a match request
  async createMatchRequest(data: {
    requesterId: string;
    targetId?: string;
    topic: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
  }): Promise<MatchRequest> {
    try {
      const matchRequest = this.matchRequestRepository.create({
        ...data,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });

      const savedRequest = await this.matchRequestRepository.save(matchRequest);
      logger.info(`Match request created: ${savedRequest.id}`);
      return savedRequest;
    } catch (error) {
      logger.error('Error creating match request:', error);
      throw error;
    }
  }

  // Find a random match
  async findRandomMatch(requesterId: string, preferences: {
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredSkillLevel: 'any' | 'similar' | 'advanced';
    sessionLength: number;
  }): Promise<MatchingUser | null> {
    try {
      const availableUsers = await this.getAvailableUsers(requesterId);
      
      // Filter users based on preferences
      const compatibleUsers = availableUsers.filter(user => {
        if (preferences.preferredSkillLevel === 'any') return true;
        if (preferences.preferredSkillLevel === 'similar') {
          return user.skillLevel === preferences.skillLevel;
        }
        if (preferences.preferredSkillLevel === 'advanced') {
          return user.skillLevel === 'advanced';
        }
        return true;
      });

      if (compatibleUsers.length === 0) {
        return null;
      }

      // Simple random selection (can be enhanced with more sophisticated matching)
      const randomIndex = Math.floor(Math.random() * compatibleUsers.length);
      return compatibleUsers[randomIndex];
    } catch (error) {
      logger.error('Error finding random match:', error);
      throw error;
    }
  }

  // Accept a match request
  async acceptMatchRequest(requestId: string, acceptorId: string): Promise<PracticeSessionData> {
    try {
      const matchRequest = await this.matchRequestRepository.findOne({
        where: { id: requestId }
      });

      if (!matchRequest) {
        throw new Error('Match request not found');
      }

      if (matchRequest.status !== 'pending') {
        throw new Error('Match request is no longer pending');
      }

      // Update match request status
      await this.matchRequestRepository.update(requestId, { status: 'accepted' });

      // Create practice session
      const session = this.sessionRepository.create({
        participants: [matchRequest.requesterId, acceptorId],
        topic: matchRequest.topic,
        skillLevel: matchRequest.skillLevel,
        duration: matchRequest.duration,
        startTime: new Date(),
        status: 'active',
      });

      const savedSession = await this.sessionRepository.save(session);
      logger.info(`Practice session created: ${savedSession.id}`);

      return {
        id: savedSession.id,
        participants: savedSession.participants,
        topic: savedSession.topic,
        skillLevel: savedSession.skillLevel,
        duration: savedSession.duration,
        startTime: savedSession.startTime,
        status: savedSession.status,
      };
    } catch (error) {
      logger.error('Error accepting match request:', error);
      throw error;
    }
  }

  // Decline a match request
  async declineMatchRequest(requestId: string): Promise<void> {
    try {
      await this.matchRequestRepository.update(requestId, { status: 'declined' });
      logger.info(`Match request declined: ${requestId}`);
    } catch (error) {
      logger.error('Error declining match request:', error);
      throw error;
    }
  }

  // Get pending invitations for a user
  async getPendingInvitations(userId: string): Promise<MatchRequest[]> {
    try {
      return await this.matchRequestRepository.find({
        where: { targetId: userId, status: 'pending' },
        relations: ['requester'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      logger.error('Error getting pending invitations:', error);
      throw error;
    }
  }

  // End a practice session
  async endSession(sessionId: string, data: {
    notes?: string;
    ratings?: { [userId: string]: number };
  }): Promise<void> {
    try {
      await this.sessionRepository.update(sessionId, {
        status: 'completed',
        notes: data.notes,
        ratings: data.ratings,
        endTime: new Date(),
      });

      // Update user statistics
      if (data.ratings) {
        for (const [userId, rating] of Object.entries(data.ratings)) {
          await this.updateUserStats(userId, rating);
        }
      }

      logger.info(`Practice session ended: ${sessionId}`);
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  // Update user statistics after a session
  private async updateUserStats(userId: string, rating: number): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) return;

      const newPracticeCount = (user.practiceCount || 0) + 1;
      const newTotalRating = (user.totalRating || 0) + rating;
      const newAverageRating = newTotalRating / newPracticeCount;

      await this.userRepository.update(userId, {
        practiceCount: newPracticeCount,
        totalRating: newTotalRating,
        rating: newAverageRating,
        lastPracticeDate: new Date(),
      });
    } catch (error) {
      logger.error('Error updating user stats:', error);
    }
  }

  // Get leaderboard
  async getLeaderboard(): Promise<Array<{
    userId: string;
    name: string;
    avatar?: string;
    totalSessions: number;
    currentStreak: number;
    averageRating: number;
    totalPracticeTime: number;
  }>> {
    try {
      const users = await this.userRepository.find({
        select: [
          'id', 'firstName', 'lastName', 'avatar', 'practiceCount', 
          'streak', 'rating', 'totalPracticeTime'
        ],
        order: { practiceCount: 'DESC', rating: 'DESC' },
        take: 10,
      });

      return users.map(user => ({
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        totalSessions: user.practiceCount || 0,
        currentStreak: user.streak || 0,
        averageRating: user.rating || 0,
        totalPracticeTime: user.totalPracticeTime || 0,
      }));
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    totalSessions: number;
    currentStreak: number;
    totalPracticeTime: number;
    averageRating: number;
    skillsProgress: { [skill: string]: number };
  }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      return {
        totalSessions: user.practiceCount || 0,
        currentStreak: user.streak || 0,
        totalPracticeTime: user.totalPracticeTime || 0,
        averageRating: user.rating || 0,
        skillsProgress: user.skillsProgress || {},
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Clean up expired match requests
  async cleanupExpiredRequests(): Promise<void> {
    try {
      const expiredRequests = await this.matchRequestRepository.find({
        where: { 
          status: 'pending',
          expiresAt: new Date(Date.now() - 5 * 60 * 1000) // Expired 5 minutes ago
        }
      });

      for (const request of expiredRequests) {
        await this.matchRequestRepository.update(request.id, { status: 'expired' });
      }

      if (expiredRequests.length > 0) {
        logger.info(`Cleaned up ${expiredRequests.length} expired match requests`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired requests:', error);
    }
  }
}
