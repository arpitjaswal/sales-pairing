import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SessionSkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('practice_sessions')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-array')
  participants: string[];

  @Column()
  topic: string;

  @Column({
    type: 'enum',
    enum: SessionSkillLevel,
    default: SessionSkillLevel.INTERMEDIATE,
  })
  skillLevel: SessionSkillLevel;

  @Column()
  duration: number; // in minutes

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime?: Date;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.WAITING,
  })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'simple-json', nullable: true })
  ratings?: { [userId: string]: number };

  @Column({ type: 'simple-json', nullable: true })
  feedback?: { [userId: string]: string };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
