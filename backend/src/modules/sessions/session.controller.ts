import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { logger } from '../../common/logger';

export class SessionController {
  private sessionService = new SessionService();

  /**
   * Get all sessions
   */
  getAllSessions = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;
      const sessions = await this.sessionService.getAllSessions({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        category: category as string,
        search: search as string,
      });
      
      return res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get all sessions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get sessions',
      });
    }
  };

  /**
   * Get user's sessions
   */
  getMySessions = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      const sessions = await this.sessionService.getUserSessions(userId, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });
      
      return res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get my sessions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get your sessions',
      });
    }
  };

  /**
   * Get session by ID
   */
  getSessionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSessionById(id);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Get session by ID error:', error);
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
  };

  /**
   * Create new session
   */
  createSession = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const createDto = plainToInstance(CreateSessionDto, req.body);
      await validateOrReject(createDto);

      const session = await this.sessionService.createSession(userId, createDto);
      
      return res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Create session error:', error);
      
      if (Array.isArray(error)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create session',
      });
    }
  };

  /**
   * Update session
   */
  updateSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateDto = plainToInstance(UpdateSessionDto, req.body);
      await validateOrReject(updateDto);

      const session = await this.sessionService.updateSession(id, userId, updateDto);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Update session error:', error);
      
      if (Array.isArray(error)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update session',
      });
    }
  };

  /**
   * Delete session
   */
  deleteSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await this.sessionService.deleteSession(id, userId);
      
      return res.json({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error) {
      logger.error('Delete session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete session',
      });
    }
  };

  /**
   * Join session
   */
  joinSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { role } = req.body;

      const session = await this.sessionService.joinSession(id, userId, role);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Join session error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to join session',
      });
    }
  };

  /**
   * Leave session
   */
  leaveSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await this.sessionService.leaveSession(id, userId);
      
      return res.json({
        success: true,
        message: 'Left session successfully',
      });
    } catch (error) {
      logger.error('Leave session error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to leave session',
      });
    }
  };

  /**
   * Start session
   */
  startSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const session = await this.sessionService.startSession(id, userId);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Start session error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to start session',
      });
    }
  };

  /**
   * End session
   */
  endSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const session = await this.sessionService.endSession(id, userId);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('End session error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to end session',
      });
    }
  };

  /**
   * Start recording
   */
  startRecording = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await this.sessionService.startRecording(id, userId);
      
      return res.json({
        success: true,
        message: 'Recording started',
      });
    } catch (error) {
      logger.error('Start recording error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to start recording',
      });
    }
  };

  /**
   * Stop recording
   */
  stopRecording = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await this.sessionService.stopRecording(id, userId);
      
      return res.json({
        success: true,
        message: 'Recording stopped',
      });
    } catch (error) {
      logger.error('Stop recording error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to stop recording',
      });
    }
  };

  /**
   * Upload recording
   */
  uploadRecording = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No recording file uploaded',
        });
      }

      const recordingUrl = await this.sessionService.uploadRecording(id, userId, file);
      
      return res.json({
        success: true,
        data: { recordingUrl },
      });
    } catch (error) {
      logger.error('Upload recording error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload recording',
      });
    }
  };

  /**
   * Submit feedback
   */
  submitFeedback = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const feedbackDto = plainToInstance(SubmitFeedbackDto, req.body);
      await validateOrReject(feedbackDto);

      const feedback = await this.sessionService.submitFeedback(id, userId, feedbackDto);
      
      return res.json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      logger.error('Submit feedback error:', error);
      
      if (Array.isArray(error)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit feedback',
      });
    }
  };

  /**
   * Get session feedback
   */
  getSessionFeedback = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const feedback = await this.sessionService.getSessionFeedback(id);
      
      return res.json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      logger.error('Get session feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get session feedback',
      });
    }
  };

  /**
   * Get session analytics
   */
  getSessionAnalytics = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const analytics = await this.sessionService.getSessionAnalytics(id);
      
      return res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Get session analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get session analytics',
      });
    }
  };

  /**
   * Get all sessions (admin)
   */
  getAllSessionsAdmin = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, category } = req.query;
      const sessions = await this.sessionService.getAllSessionsAdmin({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        category: category as string,
      });
      
      return res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get all sessions admin error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get sessions',
      });
    }
  };

  /**
   * Update session status (admin)
   */
  updateSessionStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const session = await this.sessionService.updateSessionStatus(id, status);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Update session status error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update session status',
      });
    }
  };

  /**
   * Assign participants (admin)
   */
  assignParticipants = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { participants } = req.body;

      const session = await this.sessionService.assignParticipants(id, participants);
      
      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Assign participants error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to assign participants',
      });
    }
  };
}
