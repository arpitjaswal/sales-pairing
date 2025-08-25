import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
// import { Availability } from '../availability/availability.entity';
import { RoleplaySession } from '../sessions/session.entity';
// import { UserBadge } from '../gamification/user-badge.entity';
// import { Feedback } from '../feedback/feedback.entity';
// import { Message } from '../chat/message.entity';
// import { UserSkill } from '../skills/user-skill.entity';
// import { RefreshToken } from '../auth/refresh-token.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum ExperienceLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: ExperienceLevel, default: ExperienceLevel.BEGINNER })
  experienceLevel: ExperienceLevel;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastActive?: Date;

  @Column({ default: 0 })
  practiceCount: number;

  @Column({ default: 0 })
  streak: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalRating: number;

  @Column({ default: 0 })
  totalPracticeTime: number; // in minutes

  @Column({ type: 'timestamp', nullable: true })
  lastPracticeDate?: Date;

  @Column({
    type: 'enum',
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  })
  skillLevel: 'beginner' | 'intermediate' | 'advanced';

  @Column({ type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ default: 15 })
  preferredSessionLength: number; // in minutes

  @Column({
    type: 'enum',
    enum: ['any', 'similar', 'advanced'],
    default: 'any',
  })
  preferredSkillLevel: 'any' | 'similar' | 'advanced';

  @Column({ type: 'simple-json', nullable: true })
  skillsProgress?: { [skill: string]: number };

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  resetPasswordExpires: Date | null;

  // @OneToMany(() => RefreshToken, refreshToken => refreshToken.user, { cascade: true })
  // refreshTokens: RefreshToken[];

  @Column({ nullable: true })
  lastActiveAt?: Date;

  @Column({ default: 0 })
  totalSessions: number;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ nullable: true })
  lastSessionAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    notificationEmails: boolean;
    notificationPush: boolean;
    matchWithSameLevel: boolean;
    matchWithHigherLevel: boolean;
    matchWithLowerLevel: boolean;
    preferredSessionDuration: number; // in minutes
    language: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  // @OneToMany(() => Availability, availability => availability.user)
  // availabilities: Availability[];

  @OneToMany(() => RoleplaySession, session => session.initiator)
  initiatedSessions: RoleplaySession[];

  @OneToMany(() => RoleplaySession, session => session.participant)
  participatedSessions: RoleplaySession[];

  // @OneToMany(() => UserBadge, userBadge => userBadge.user)
  // badges: UserBadge[];

  // @OneToMany(() => Feedback, feedback => feedback.fromUser)
  // givenFeedbacks: Feedback[];

  // @OneToMany(() => Feedback, feedback => feedback.toUser)
  // receivedFeedbacks: Feedback[];

  // @OneToMany(() => Message, message => message.sender)
  // messages: Message[];

  // @OneToMany(() => UserSkill, userSkill => userSkill.user)
  // skills: UserSkill[];

  // Methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  isAvailable(): boolean {
    // Check if user has any active availability slots
    if (!this.availabilities || this.availabilities.length === 0) return false;
    const now = new Date();
    return this.availabilities.some(avail => {
      const start = new Date(avail.startTime);
      const end = new Date(avail.endTime);
      return now >= start && now <= end;
    });
  }

  async getTotalSessionHours(): Promise<number> {
    // Calculate total hours from completed sessions
    const sessions = await RoleplaySession.find({
      where: [
        { host: { id: this.id }, status: 'completed' },
        { participant: { id: this.id }, status: 'completed' },
      ],
    });

    return sessions.reduce((total, session) => {
      if (session.endedAt && session.startedAt) {
        const durationMs = session.endedAt.getTime() - session.startedAt.getTime();
        return total + durationMs / (1000 * 60 * 60); // Convert ms to hours
      }
      return total;
    }, 0);
  }

  /**
   * Check if the user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if the user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  /**
   * Check if the user is an admin
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if the user is a moderator or admin
   */
  isModeratorOrHigher(): boolean {
    return [UserRole.MODERATOR, UserRole.ADMIN].includes(this.role);
  }

  /**
   * Sanitize user object before sending to client
   */
  toJSON() {
    const { password, resetPasswordToken, resetPasswordExpires, ...user } = this;
    return user;
  }
}
