import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserBadge } from './user-badge.entity';

export enum BadgeType {
  ACHIEVEMENT = 'achievement',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
  EVENT = 'event',
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  @Column({ type: 'enum', enum: BadgeRarity, default: BadgeRarity.COMMON })
  rarity: BadgeRarity;

  @Column({ default: '' })
  iconUrl: string;

  @Column({ default: 0 })
  xpValue: number;

  @Column({ type: 'jsonb', nullable: true })
  criteria: {
    minSessions?: number;
    minRating?: number;
    minStreak?: number;
    specificSkillId?: string;
    specificEventId?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserBadge, userBadge => userBadge.badge)
  userBadges: UserBadge[];

  // Methods
  isEarned(userStats: {
    totalSessions: number;
    averageRating: number;
    currentStreak: number;
    skills: string[];
  }): boolean {
    if (!this.criteria) return false;
    
    if (this.criteria.minSessions && userStats.totalSessions < this.criteria.minSessions) {
      return false;
    }
    
    if (this.criteria.minRating && userStats.averageRating < this.criteria.minRating) {
      return false;
    }
    
    if (this.criteria.minStreak && userStats.currentStreak < this.criteria.minStreak) {
      return false;
    }
    
    if (this.criteria.specificSkillId && 
        !userStats.skills.includes(this.criteria.specificSkillId)) {
      return false;
    }
    
    return true;
  }
}
