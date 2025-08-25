import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  SESSION_REQUEST = 'session_request',
  SESSION_CONFIRMATION = 'session_confirmation',
  SESSION_REMINDER = 'session_reminder',
  SESSION_CANCELLATION = 'session_cancellation',
  MATCH_FOUND = 'match_found',
  NEW_MESSAGE = 'new_message',
  FEEDBACK_RECEIVED = 'feedback_received',
  BADGE_EARNED = 'badge_earned',
  STREAK_UPDATED = 'streak_updated',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ROLEPLAY_INVITE = 'roleplay_invite',
  AVAILABILITY_UPDATE = 'availability_update',
  LEADERBOARD_UPDATE = 'leaderboard_update',
  SKILL_IMPROVEMENT = 'skill_improvement',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  SLACK = 'slack',
  DISCORD = 'discord',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({ type: 'enum', enum: NotificationChannel, array: true, default: [NotificationChannel.IN_APP] })
  channels: NotificationChannel[];

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'jsonb', nullable: true })
  error?: {
    message: string;
    code?: string;
    stack?: string;
    channel?: NotificationChannel;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  userId: string;

  // Indexes
  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'COALESCE(scheduled_at, created_at)' })
  effectiveDate: Date;

  // Methods
  markAsRead(): void {
    if (!this.readAt) {
      this.readAt = new Date();
      this.isRead = true;
      this.status = NotificationStatus.READ;
    }
  }

  markAsSent(channel: NotificationChannel): void {
    this.sentAt = new Date();
    this.status = NotificationStatus.SENT;
    this.data = this.data || {};
    this.data[`${channel}SentAt`] = new Date();
  }

  markAsDelivered(channel: NotificationChannel): void {
    this.status = NotificationStatus.DELIVERED;
    this.data = this.data || {};
    this.data[`${channel}DeliveredAt`] = new Date();
  }

  markAsFailed(error: Error, channel: NotificationChannel): void {
    this.status = NotificationStatus.FAILED;
    this.retryCount += 1;
    this.error = {
      message: error.message,
      code: (error as any).code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      channel,
    };
  }

  shouldRetry(): boolean {
    if (this.status !== NotificationStatus.FAILED) return false;
    if (this.retryCount >= 3) return false; // Max 3 retries
    
    // Exponential backoff: 5min, 15min, 30min
    const backoffTimes = [5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000];
    const lastAttempt = this.sentAt || this.createdAt;
    const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
    
    return timeSinceLastAttempt >= backoffTimes[Math.min(this.retryCount, backoffTimes.length - 1)];
  }

  getPriority(): number {
    // Higher number = higher priority
    const priorities = {
      [NotificationType.SESSION_REQUEST]: 100,
      [NotificationType.SESSION_CANCELLATION]: 90,
      [NotificationType.MATCH_FOUND]: 80,
      [NotificationType.SESSION_REMINDER]: 70,
      [NotificationType.FEEDBACK_RECEIVED]: 60,
      [NotificationType.BADGE_EARNED]: 50,
      [NotificationType.NEW_MESSAGE]: 40,
      [NotificationType.STREAK_UPDATED]: 30,
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 20,
      [NotificationType.ROLEPLAY_INVITE]: 80,
      [NotificationType.AVAILABILITY_UPDATE]: 30,
      [NotificationType.LEADERBOARD_UPDATE]: 20,
      [NotificationType.SKILL_IMPROVEMENT]: 40,
    };
    
    return priorities[this.type] || 10;
  }

  // Factory methods for common notification types
  static createSessionRequest(initiator: User, sessionId: string, recipient: User): Notification {
    return {
      type: NotificationType.SESSION_REQUEST,
      title: 'New Session Request',
      message: `${initiator.firstName} ${initiator.lastName} has requested a roleplay session with you`,
      data: { sessionId, initiatorId: initiator.id },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      userId: recipient.id,
      user: recipient,
    } as Notification;
  }

  static createMatchFound(user: User, matchDetails: any): Notification {
    return {
      type: NotificationType.MATCH_FOUND,
      title: 'Match Found!',
      message: `You've been matched for a roleplay session!`,
      data: matchDetails,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      userId: user.id,
      user,
    } as Notification;
  }

  static createBadgeEarned(user: User, badgeName: string, badgeId: string): Notification {
    return {
      type: NotificationType.BADGE_EARNED,
      title: 'New Badge Earned!',
      message: `Congratulations! You've earned the ${badgeName} badge.`,
      data: { badgeId, badgeName },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      userId: user.id,
      user,
    } as Notification;
  }
}
