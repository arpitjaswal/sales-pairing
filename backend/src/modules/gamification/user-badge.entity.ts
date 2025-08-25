import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  earnedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  viewedAt?: Date;

  // Relations
  @ManyToOne(() => User, user => user.badges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Badge, badge => badge.userBadges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @Column('uuid')
  badgeId: string;

  // Methods
  markAsViewed(): void {
    if (!this.viewedAt) {
      this.viewedAt = new Date();
    }
  }

  isNew(): boolean {
    return !this.viewedAt;
  }

  getProgress(): { current: number; total: number } | null {
    if (!this.badge.criteria) return null;
    
    // Example implementation - would be based on actual badge criteria
    if (this.badge.criteria.minSessions) {
      return {
        current: this.metadata?.currentSessions || 0,
        total: this.badge.criteria.minSessions
      };
    }
    
    if (this.badge.criteria.minStreak) {
      return {
        current: this.metadata?.currentStreak || 0,
        total: this.badge.criteria.minStreak
      };
    }
    
    return null;
  }
}
