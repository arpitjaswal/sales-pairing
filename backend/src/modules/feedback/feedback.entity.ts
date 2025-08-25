import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { RoleplaySession } from '../sessions/session.entity';

export enum FeedbackType {
  SESSION = 'session',
  SKILL = 'skill',
  GENERAL = 'general',
  ANONYMOUS = 'anonymous',
}

export enum FeedbackStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  EDITED = 'edited',
  ARCHIVED = 'archived',
}

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: FeedbackType })
  type: FeedbackType;

  @Column({ type: 'enum', enum: FeedbackStatus, default: FeedbackStatus.SUBMITTED })
  status: FeedbackStatus;

  @Column({ type: 'int', nullable: true })
  rating?: number; // 1-5 scale

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  ratings?: {
    [key: string]: number; // skillId -> rating (1-5)
  };

  @Column({ type: 'jsonb', nullable: true })
  strengths?: string[];

  @Column({ type: 'jsonb', nullable: true })
  areasForImprovement?: string[];

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    // For session-specific feedback
    sessionDuration?: number; // in minutes
    sessionType?: string;
    scenarioUsed?: string;
    
    // For skill-specific feedback
    skillId?: string;
    skillName?: string;
    
    // For general feedback
    feedbackCategory?: string;
    
    // For AI analysis
    sentimentScore?: number; // -1 to 1
    keyThemes?: string[];
    
    // For moderation
    isFlagged?: boolean;
    flagReason?: string;
    moderatedAt?: Date;
    moderatorNotes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;

  @Column('uuid')
  fromUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toUserId' })
  toUser: User;

  @Column('uuid')
  toUserId: string;

  @ManyToOne(() => RoleplaySession, session => session.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session?: RoleplaySession;

  @Column('uuid', { nullable: true })
  sessionId?: string;

  // Methods
  calculateAverageRating(): number | null {
    if (this.rating) return this.rating;
    
    if (this.ratings && Object.keys(this.ratings).length > 0) {
      const values = Object.values(this.ratings);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    return null;
  }

  getOverallSentiment(): 'positive' | 'neutral' | 'negative' {
    const avgRating = this.calculateAverageRating();
    
    if (avgRating === null) {
      // If no rating, analyze the comment sentiment if available
      const sentiment = this.metadata?.sentimentScore;
      if (sentiment === undefined) return 'neutral';
      return sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';
    }
    
    return avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral';
  }

  // Factory methods for common feedback types
  static createSessionFeedback(
    fromUser: User,
    toUser: User,
    session: RoleplaySession,
    rating: number,
    comment: string,
    strengths: string[] = [],
    areasForImprovement: string[] = [],
    isAnonymous: boolean = false
  ): Feedback {
    const feedback = new Feedback();
    feedback.type = FeedbackType.SESSION;
    feedback.rating = rating;
    feedback.comment = comment;
    feedback.strengths = strengths;
    feedback.areasForImprovement = areasForImprovement;
    feedback.isAnonymous = isAnonymous;
    feedback.fromUser = fromUser;
    feedback.toUser = toUser;
    feedback.session = session;
    feedback.metadata = {
      sessionDuration: session.getDurationInMinutes(),
      sessionType: session.type,
      scenarioUsed: session.scenario?.title,
    };
    return feedback;
  }

  static createSkillFeedback(
    fromUser: User,
    toUser: User,
    skillId: string,
    skillName: string,
    rating: number,
    comment: string,
    isPublic: boolean = false
  ): Feedback {
    const feedback = new Feedback();
    feedback.type = FeedbackType.SKILL;
    feedback.ratings = { [skillId]: rating };
    feedback.comment = comment;
    feedback.isPublic = isPublic;
    feedback.fromUser = fromUser;
    feedback.toUser = toUser;
    feedback.metadata = {
      skillId,
      skillName,
    };
    return feedback;
  }

  // Add more factory methods as needed
}
