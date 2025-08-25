import { Repository } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { Session } from './session.entity';
import { CreateSessionDto, SessionStatus, SessionCategory } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { NotFoundError } from '../../common/errors/not-found-error';
import { BadRequestError } from '../../common/errors/bad-request-error';
import { uploadToS3 } from '../../common/utils/file-upload';
import { logger } from '../../common/logger';

export interface SessionFilters {
  page: number;
  limit: number;
  status?: string;
  category?: string;
  search?: string;
}

export interface SessionAnalytics {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  totalParticipants: number;
  averageDuration: number;
  categoryBreakdown: Record<SessionCategory, number>;
}

export class SessionService {
  private sessionRepository: Repository<Session>;

  constructor() {
    this.sessionRepository = AppDataSource.getRepository(Session);
  }

  /**
   * Get all sessions with filters
   */
  async getAllSessions(filters: SessionFilters): Promise<{ sessions: Session[]; total: number; page: number; limit: number }> {
    const { page, limit, status, category, search } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.sessionRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.creator', 'creator')
      .leftJoinAndSelect('session.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('session.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('session.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(session.title ILIKE :search OR session.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const sessions = await queryBuilder
      .orderBy('session.scheduledAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      sessions,
      total,
      page,
      limit
    };
  }

  /**
   * Get user's sessions
   */
  async getUserSessions(userId: string, filters: { page: number; limit: number; status?: string }): Promise<{ sessions: Session[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.sessionRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.creator', 'creator')
      .leftJoinAndSelect('session.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('session.creator.id = :userId OR participants.user.id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('session.status = :status', { status });
    }

    const total = await queryBuilder.getCount();

    const sessions = await queryBuilder
      .orderBy('session.scheduledAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      sessions,
      total,
      page,
      limit
    };
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['creator', 'participants', 'participants.user', 'feedback', 'feedback.user']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return session;
  }

  /**
   * Create new session
   */
  async createSession(userId: string, createDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create({
      ...createDto,
      creator: { id: userId },
      status: SessionStatus.SCHEDULED,
      scheduledAt: new Date(createDto.scheduledAt)
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Update session
   */
  async updateSession(id: string, userId: string, updateDto: UpdateSessionDto): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('You can only update sessions you created');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestError('Cannot update completed sessions');
    }

    Object.assign(session, updateDto);
    
    if (updateDto.scheduledAt) {
      session.scheduledAt = new Date(updateDto.scheduledAt);
    }

    return await this.sessionRepository.save(session);
  }

  /**
   * Delete session
   */
  async deleteSession(id: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('You can only delete sessions you created');
    }

    if (session.status === SessionStatus.IN_PROGRESS) {
      throw new BadRequestError('Cannot delete session in progress');
    }

    await this.sessionRepository.remove(session);
  }

  /**
   * Join session
   */
  async joinSession(sessionId: string, userId: string, role: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['participants', 'participants.user']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestError('Can only join scheduled sessions');
    }

    // Check if user is already a participant
    const existingParticipant = session.participants.find(p => p.user.id === userId);
    if (existingParticipant) {
      throw new BadRequestError('You are already a participant in this session');
    }

    // Check if session is full
    if (session.participants.length >= session.maxParticipants) {
      throw new BadRequestError('Session is full');
    }

    // Add participant
    session.participants.push({
      user: { id: userId },
      role,
      joinedAt: new Date()
    } as any);

    return await this.sessionRepository.save(session);
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['participants', 'participants.user']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.status === SessionStatus.IN_PROGRESS) {
      throw new BadRequestError('Cannot leave session in progress');
    }

    const participantIndex = session.participants.findIndex(p => p.user.id === userId);
    if (participantIndex === -1) {
      throw new BadRequestError('You are not a participant in this session');
    }

    session.participants.splice(participantIndex, 1);
    await this.sessionRepository.save(session);
  }

  /**
   * Start session
   */
  async startSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('Only the session creator can start the session');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestError('Session is not in scheduled status');
    }

    session.status = SessionStatus.IN_PROGRESS;
    session.startedAt = new Date();

    return await this.sessionRepository.save(session);
  }

  /**
   * End session
   */
  async endSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('Only the session creator can end the session');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestError('Session is not in progress');
    }

    session.status = SessionStatus.COMPLETED;
    session.endedAt = new Date();

    return await this.sessionRepository.save(session);
  }

  /**
   * Start recording
   */
  async startRecording(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('Only the session creator can start recording');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestError('Can only record during active sessions');
    }

    session.isRecording = true;
    session.recordingStartedAt = new Date();

    await this.sessionRepository.save(session);
  }

  /**
   * Stop recording
   */
  async stopRecording(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('Only the session creator can stop recording');
    }

    if (!session.isRecording) {
      throw new BadRequestError('Session is not currently recording');
    }

    session.isRecording = false;
    session.recordingEndedAt = new Date();

    await this.sessionRepository.save(session);
  }

  /**
   * Upload recording
   */
  async uploadRecording(sessionId: string, userId: string, file: Express.Multer.File): Promise<string> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['creator']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.creator.id !== userId) {
      throw new BadRequestError('Only the session creator can upload recordings');
    }

    try {
      const recordingUrl = await uploadToS3(file, 'recordings');
      
      session.recordingUrl = recordingUrl;
      await this.sessionRepository.save(session);

      return recordingUrl;
    } catch (error) {
      logger.error('Recording upload error:', error);
      throw new BadRequestError('Failed to upload recording');
    }
  }

  /**
   * Submit feedback
   */
  async submitFeedback(sessionId: string, userId: string, feedbackDto: SubmitFeedbackDto): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['participants', 'participants.user']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check if user participated in the session
    const participant = session.participants.find(p => p.user.id === userId);
    if (!participant) {
      throw new BadRequestError('You must be a participant to submit feedback');
    }

    // Check if session is completed
    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestError('Can only submit feedback for completed sessions');
    }

    // TODO: Save feedback to database
    const feedback = {
      id: Math.random().toString(36).substr(2, 9),
      sessionId,
      userId,
      ...feedbackDto,
      submittedAt: new Date()
    };

    return feedback;
  }

  /**
   * Get session feedback
   */
  async getSessionFeedback(sessionId: string): Promise<any[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['feedback', 'feedback.user']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // TODO: Return actual feedback from database
    return session.feedback || [];
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['participants', 'feedback']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // TODO: Calculate actual analytics
    const analytics: SessionAnalytics = {
      totalSessions: 1,
      completedSessions: session.status === SessionStatus.COMPLETED ? 1 : 0,
      averageRating: session.feedback?.length ? 
        session.feedback.reduce((sum, f) => sum + (f as any).overallRating, 0) / session.feedback.length : 0,
      totalParticipants: session.participants.length,
      averageDuration: session.duration,
      categoryBreakdown: {
        [SessionCategory.SALES_PRESENTATION]: 0,
        [SessionCategory.NEGOTIATION]: 0,
        [SessionCategory.OBJECTION_HANDLING]: 0,
        [SessionCategory.CLOSING]: 0,
        [SessionCategory.DISCOVERY]: 0,
        [SessionCategory.DEMO]: 0,
        [SessionCategory.FOLLOW_UP]: 0
      }
    };

    analytics.categoryBreakdown[session.category] = 1;

    return analytics;
  }

  /**
   * Get all sessions (admin)
   */
  async getAllSessionsAdmin(filters: { page: number; limit: number; status?: string; category?: string }): Promise<{ sessions: Session[]; total: number; page: number; limit: number }> {
    return this.getAllSessions(filters);
  }

  /**
   * Update session status (admin)
   */
  async updateSessionStatus(sessionId: string, status: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (!Object.values(SessionStatus).includes(status as SessionStatus)) {
      throw new BadRequestError('Invalid status');
    }

    session.status = status as SessionStatus;
    return await this.sessionRepository.save(session);
  }

  /**
   * Assign participants (admin)
   */
  async assignParticipants(sessionId: string, participants: Array<{ userId: string; role: string }>): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['participants']
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Clear existing participants
    session.participants = [];

    // Add new participants
    session.participants = participants.map(p => ({
      user: { id: p.userId },
      role: p.role,
      joinedAt: new Date()
    } as any));

    return await this.sessionRepository.save(session);
  }
}
