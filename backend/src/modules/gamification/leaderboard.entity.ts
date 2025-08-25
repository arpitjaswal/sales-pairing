import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum LeaderboardType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
  BY_SKILL = 'by_skill',
  BY_ROLE = 'by_role',
  BY_EXPERIENCE = 'by_experience',
}

export enum LeaderboardMetric {
  SESSION_COUNT = 'session_count',
  SESSION_HOURS = 'session_hours',
  AVERAGE_RATING = 'average_rating',
  FEEDBACK_GIVEN = 'feedback_given',
  STREAK_DAYS = 'streak_days',
  BADGES_EARNED = 'badges_earned',
  XP_POINTS = 'xp_points',
}

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LeaderboardType })
  type: LeaderboardType;

  @Column({ type: 'enum', enum: LeaderboardMetric })
  metric: LeaderboardMetric;

  @Column({ type: 'varchar', nullable: true })
  category?: string; // For skill/role specific leaderboards

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'jsonb' })
  rankings: Array<{
    userId: string;
    rank: number;
    value: number;
    displayValue: string;
    changeFromPrevious?: number; // Position change from previous period
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    totalParticipants: number;
    averageValue: number;
    topValue: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  getUserRank(userId: string): { rank: number; value: number } | null {
    const ranking = this.rankings.find(r => r.userId === userId);
    return ranking ? { rank: ranking.rank, value: ranking.value } : null;
  }

  getTopN(count: number) {
    return this.rankings.slice(0, count);
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  isUpcoming(): boolean {
    return new Date() < this.startDate;
  }

  isCompleted(): boolean {
    return new Date() > this.endDate;
  }
}

// Entity to track user's leaderboard positions across different time periods
@Entity('user_leaderboard_positions')
export class UserLeaderboardPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LeaderboardType })
  type: LeaderboardType;

  @Column({ type: 'enum', enum: LeaderboardMetric })
  metric: LeaderboardMetric;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @Column({ type: 'int' })
  rank: number;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'int', nullable: true })
  previousRank?: number;

  @Column({ type: 'float', nullable: true })
  previousValue?: number;

  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Column({ type: 'timestamptz' })
  periodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  // Indexes
  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'period_end' })
  periodEndIndex: Date;

  // Methods
  getRankChange(): number | null {
    if (this.previousRank === undefined || this.previousRank === null) return null;
    return this.previousRank - this.rank; // Positive means improved, negative means dropped
  }

  getValueChange(): number | null {
    if (this.previousValue === undefined || this.previousValue === null) return null;
    return this.value - this.previousValue;
  }

  getPercentChange(): number | null {
    const valueChange = this.getValueChange();
    if (valueChange === null || this.previousValue === 0) return null;
    return (valueChange / this.previousValue) * 100;
  }
}
