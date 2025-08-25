import { Request, Response } from 'express';
import { MatchingService } from './matching.service';
import { logger } from '../../common/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class MatchingController {
  private matchingService: MatchingService;

  constructor() {
    this.matchingService = new MatchingService();
  }

  // Get all available users
  async getAvailableUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const excludeUserId = req.user?.id;
      const users = await this.matchingService.getAvailableUsers(excludeUserId);
      
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('Error getting available users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available users',
      });
    }
  }

  // Update user availability
  async updateAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { isAvailable } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      await this.matchingService.updateUserAvailability(userId, isAvailable);
      
      res.json({
        success: true,
        message: 'Availability updated successfully',
      });
    } catch (error) {
      logger.error('Error updating availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update availability',
      });
    }
  }

  // Start random matching
  async startRandomMatching(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { topic, skillLevel, sessionLength, preferredSkillLevel } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Create match request
      const matchRequest = await this.matchingService.createMatchRequest({
        requesterId: userId,
        topic: topic || 'general-practice',
        skillLevel: skillLevel || 'intermediate',
        duration: sessionLength || 15,
      });

      // Try to find a match
      const matchedUser = await this.matchingService.findRandomMatch(userId, {
        skillLevel: skillLevel || 'intermediate',
        preferredSkillLevel: preferredSkillLevel || 'any',
        sessionLength: sessionLength || 15,
      });

      if (matchedUser) {
        // Accept the match automatically for random matching
        const session = await this.matchingService.acceptMatchRequest(matchRequest.id, matchedUser.id);
        
        res.json({
          success: true,
          data: {
            matchRequest,
            matchedUser,
            session,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            matchRequest,
            matchedUser: null,
            message: 'No available users found. Your request is in the queue.',
          },
        });
      }
    } catch (error) {
      logger.error('Error starting random matching:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start matching',
      });
    }
  }

  // Invite specific user
  async inviteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { targetUserId, topic, skillLevel, sessionLength } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const matchRequest = await this.matchingService.createMatchRequest({
        requesterId: userId,
        targetId: targetUserId,
        topic: topic || 'general-practice',
        skillLevel: skillLevel || 'intermediate',
        duration: sessionLength || 15,
      });

      res.json({
        success: true,
        data: matchRequest,
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      logger.error('Error inviting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation',
      });
    }
  }

  // Accept invitation
  async acceptInvitation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const session = await this.matchingService.acceptMatchRequest(requestId, userId);

      res.json({
        success: true,
        data: session,
        message: 'Invitation accepted successfully',
      });
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept invitation',
      });
    }
  }

  // Decline invitation
  async declineInvitation(req: Request, res: Response) {
    try {
      const { requestId } = req.params;

      await this.matchingService.declineMatchRequest(requestId);

      res.json({
        success: true,
        message: 'Invitation declined successfully',
      });
    } catch (error) {
      logger.error('Error declining invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decline invitation',
      });
    }
  }

  // Get pending invitations
  async getPendingInvitations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const invitations = await this.matchingService.getPendingInvitations(userId);

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      logger.error('Error getting pending invitations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending invitations',
      });
    }
  }

  // End practice session
  async endSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { notes, ratings } = req.body;

      await this.matchingService.endSession(sessionId, {
        notes,
        ratings,
      });

      res.json({
        success: true,
        message: 'Session ended successfully',
      });
    } catch (error) {
      logger.error('Error ending session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end session',
      });
    }
  }

  // Get leaderboard
  async getLeaderboard(req: Request, res: Response) {
    try {
      const leaderboard = await this.matchingService.getLeaderboard();

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboard',
      });
    }
  }

  // Get user statistics
  async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const stats = await this.matchingService.getUserStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user stats',
      });
    }
  }

  // Cancel match request
  async cancelMatchRequest(req: Request, res: Response) {
    try {
      const { requestId } = req.params;

      await this.matchingService.declineMatchRequest(requestId);

      res.json({
        success: true,
        message: 'Match request cancelled successfully',
      });
    } catch (error) {
      logger.error('Error cancelling match request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel match request',
      });
    }
  }
}
