import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  revokedByIp: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  replacedByToken: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdByIp: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * Check if the token is expired
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Check if the token is active (not expired and not revoked)
   */
  isActive(): boolean {
    return !this.revoked && !this.isExpired();
  }

  /**
   * Revoke the token
   * @param ipAddress The IP address that revoked the token
   * @param replacedByToken The token that replaces this one (if any)
   */
  revoke(ipAddress?: string, replacedByToken?: string): void {
    this.revoked = true;
    this.revokedAt = new Date();
    this.revokedByIp = ipAddress || null;
    this.replacedByToken = replacedByToken || null;
  }

  /**
   * Convert the token to a plain object
   */
  toJSON() {
    const { id, token, userId, userAgent, ipAddress, expiresAt, revoked, revokedAt, createdAt, updatedAt } = this;
    return {
      id,
      token,
      userId,
      userAgent,
      ipAddress,
      expiresAt,
      revoked,
      revokedAt,
      createdAt,
      updatedAt,
    };
  }
}
