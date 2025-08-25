import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { MatchRequestStatus, MatchRequestType } from './dto/create-match-request.dto';

@Entity('match_requests')
export class MatchRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: MatchRequestType,
    default: MatchRequestType.INSTANT
  })
  type: MatchRequestType;

  @Column({
    type: 'enum',
    enum: MatchRequestStatus,
    default: MatchRequestStatus.PENDING
  })
  status: MatchRequestStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @Column('simple-array', { nullable: true })
  preferredCategories?: string[];

  @Column('text', { nullable: true })
  notes?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ type: 'timestamp', nullable: true })
  matchedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
