import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { SessionStatus, SessionCategory } from './dto/create-session.dto';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SessionCategory,
    default: SessionCategory.SALES_PRESENTATION
  })
  category: SessionCategory;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED
  })
  status: SessionStatus;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @Column({ type: 'int' })
  maxParticipants: number;

  @Column('simple-array', { nullable: true })
  objectives?: string[];

  @Column('text', { nullable: true })
  scenario?: string;

  @Column('text', { nullable: true })
  script?: string;

  @Column('simple-array', { nullable: true })
  talkingPoints?: string[];

  @Column('simple-array', { nullable: true })
  evaluationCriteria?: string[];

  @Column('text', { nullable: true })
  notes?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ default: false })
  isRecording: boolean;

  @Column({ type: 'timestamp', nullable: true })
  recordingStartedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  recordingEndedAt?: Date;

  @Column({ nullable: true })
  recordingUrl?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column()
  creator_id: string;

  @OneToMany(() => SessionParticipant, participant => participant.session, { cascade: true })
  participants: SessionParticipant[];

  @OneToMany(() => SessionFeedback, feedback => feedback.session, { cascade: true })
  feedback: SessionFeedback[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('session_participants')
export class SessionParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column()
  session_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column()
  role: string; // seller, buyer, observer, coach

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date;
}

@Entity('session_feedback')
export class SessionFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column()
  session_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column({ type: 'int' })
  overallRating: number;

  @Column('text')
  feedback: string;

  @Column('simple-json', { nullable: true })
  skillRatings?: {
    communication?: number;
    presentation?: number;
    objectionHandling?: number;
    closing?: number;
    productKnowledge?: number;
  };

  @Column('simple-array', { nullable: true })
  strengths?: string[];

  @Column('simple-array', { nullable: true })
  areasForImprovement?: string[];

  @Column('text', { nullable: true })
  suggestions?: string;

  @Column({ nullable: true })
  role?: string;

  @CreateDateColumn()
  submittedAt: Date;
}
