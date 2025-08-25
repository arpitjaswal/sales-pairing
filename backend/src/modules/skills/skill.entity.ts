import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { UserSkill } from './user-skill.entity';

export enum SkillCategory {
  SALES = 'sales',
  COMMUNICATION = 'communication',
  NEGOTIATION = 'negotiation',
  PRODUCT_KNOWLEDGE = 'product_knowledge',
  SOFT_SKILLS = 'soft_skills',
  TECHNICAL = 'technical',
  LANGUAGE = 'language',
  INDUSTRY_SPECIFIC = 'industry_specific',
  OTHER = 'other',
}

export enum SkillLevel {
  NOVICE = 'novice',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: SkillCategory })
  category: SkillCategory;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    // For skill assessment
    assessmentQuestions?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    
    // For skill matching
    relatedSkills?: string[]; // Array of related skill IDs
    
    // For UI display
    color?: string;
    
    // For skill progression
    levelDescriptions?: Record<SkillLevel, string>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserSkill, userSkill => userSkill.skill)
  userSkills: UserSkill[];

  // Methods
  static createDefaultSkills(): Partial<Skill>[] {
    return [
      {
        name: 'Objection Handling',
        description: 'Effectively addressing and overcoming customer objections',
        category: SkillCategory.SALES,
        isSystem: true,
        metadata: {
          levelDescriptions: {
            [SkillLevel.NOVICE]: 'Basic understanding of common objections',
            [SkillLevel.BEGINNER]: 'Can handle simple objections with guidance',
            [SkillLevel.INTERMEDIATE]: 'Confidently handles most common objections',
            [SkillLevel.ADVANCED]: 'Expert at reframing and overcoming objections',
            [SkillLevel.EXPERT]: 'Master at handling even the most difficult objections',
          },
        },
      },
      {
        name: 'Active Listening',
        description: 'Fully concentrating, understanding, and responding to the speaker',
        category: SkillCategory.COMMUNICATION,
        isSystem: true,
      },
      {
        name: 'Closing Techniques',
        description: 'Methods and strategies for successfully closing sales',
        category: SkillCategory.SALES,
        isSystem: true,
      },
      {
        name: 'Product Demonstration',
        description: 'Effectively showcasing product features and benefits',
        category: SkillCategory.PRODUCT_KNOWLEDGE,
        isSystem: true,
      },
      {
        name: 'Negotiation',
        description: 'Reaching mutually beneficial agreements',
        category: SkillCategory.NEGOTIATION,
        isSystem: true,
      },
      {
        name: 'Empathy',
        description: 'Understanding and sharing the feelings of customers',
        category: SkillCategory.SOFT_SKILLS,
        isSystem: true,
      },
    ];
  }
}

// Entity to track user's skills and their levels
@Entity('user_skills')
export class UserSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SkillLevel, default: SkillLevel.BEGINNER })
  level: SkillLevel;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 0 })
  sessionsCompleted: number;

  @Column({ type: 'float', nullable: true })
  averageRating?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    // For tracking progress
    lastPracticed?: Date;
    
    // For self-assessment
    selfAssessedLevel?: SkillLevel;
    selfAssessedAt?: Date;
    
    // For skill validation
    validatedBy?: Array<{
      validatorId: string;
      validatedAt: Date;
      comment?: string;
    }>;
    
    // For skill goals
    goalLevel?: SkillLevel;
    targetDate?: Date;
    
    // For skill evidence
    evidence?: Array<{
      type: 'session' | 'feedback' | 'certification' | 'other';
      referenceId: string;
      description: string;
      date: Date;
    }>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Skill, skill => skill.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skill: Skill;

  @Column('uuid')
  skillId: string;

  // Methods
  addXp(amount: number): { levelUp: boolean; newLevel?: SkillLevel } {
    if (amount <= 0) return { levelUp: false };
    
    this.xp += amount;
    const previousLevel = this.level;
    this.level = this.calculateLevel();
    
    return {
      levelUp: this.level !== previousLevel,
      newLevel: this.level !== previousLevel ? this.level : undefined,
    };
  }

  private calculateLevel(): SkillLevel {
    const xpThresholds: Record<SkillLevel, number> = {
      [SkillLevel.NOVICE]: 0,
      [SkillLevel.BEGINNER]: 100,
      [SkillLevel.INTERMEDIATE]: 500,
      [SkillLevel.ADVANCED]: 2000,
      [SkillLevel.EXPERT]: 5000,
    };
    
    if (this.xp >= xpThresholds[SkillLevel.EXPERT]) return SkillLevel.EXPERT;
    if (this.xp >= xpThresholds[SkillLevel.ADVANCED]) return SkillLevel.ADVANCED;
    if (this.xp >= xpThresholds[SkillLevel.INTERMEDIATE]) return SkillLevel.INTERMEDIATE;
    if (this.xp >= xpThresholds[SkillLevel.BEGINNER]) return SkillLevel.BEGINNER;
    return SkillLevel.NOVICE;
  }

  addSessionCompleted(rating?: number): void {
    this.sessionsCompleted += 1;
    
    // Update average rating if a rating is provided
    if (rating !== undefined) {
      if (this.averageRating === undefined) {
        this.averageRating = rating;
      } else {
        this.averageRating = (this.averageRating * (this.sessionsCompleted - 1) + rating) / this.sessionsCompleted;
      }
    }
    
    // Update last practiced timestamp
    this.metadata = this.metadata || {};
    this.metadata.lastPracticed = new Date();
  }

  addValidation(validatorId: string, comment?: string): void {
    this.metadata = this.metadata || {};
    this.metadata.validatedBy = this.metadata.validatedBy || [];
    this.metadata.validatedBy.push({
      validatorId,
      validatedAt: new Date(),
      comment,
    });
  }

  addEvidence(
    type: 'session' | 'feedback' | 'certification' | 'other',
    referenceId: string,
    description: string
  ): void {
    this.metadata = this.metadata || {};
    this.metadata.evidence = this.metadata.evidence || [];
    this.metadata.evidence.push({
      type,
      referenceId,
      description,
      date: new Date(),
    });
  }

  setGoal(level: SkillLevel, targetDate: Date): void {
    this.metadata = this.metadata || {};
    this.metadata.goalLevel = level;
    this.metadata.targetDate = targetDate;
  }

  getProgressToNextLevel(): { currentXp: number; nextLevelXp: number; progress: number } {
    const xpThresholds: Record<SkillLevel, number> = {
      [SkillLevel.NOVICE]: 0,
      [SkillLevel.BEGINNER]: 100,
      [SkillLevel.INTERMEDIATE]: 500,
      [SkillLevel.ADVANCED]: 2000,
      [SkillLevel.EXPERT]: 5000,
    };
    
    const currentLevelIndex = Object.values(SkillLevel).indexOf(this.level);
    const nextLevel = currentLevelIndex < Object.values(SkillLevel).length - 1 
      ? Object.values(SkillLevel)[currentLevelIndex + 1] 
      : null;
    
    if (!nextLevel) {
      return {
        currentXp: this.xp,
        nextLevelXp: this.xp,
        progress: 100,
      };
    }
    
    const currentThreshold = xpThresholds[this.level];
    const nextThreshold = xpThresholds[nextLevel as SkillLevel];
    const xpInCurrentLevel = this.xp - currentThreshold;
    const xpNeededForNextLevel = nextThreshold - currentThreshold;
    
    return {
      currentXp: xpInCurrentLevel,
      nextLevelXp: xpNeededForNextLevel,
      progress: Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)),
    };
  }
}
