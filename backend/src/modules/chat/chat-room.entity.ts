import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Message } from './message.entity';
import { RoleplaySession } from '../sessions/session.entity';

export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  SESSION = 'session',
  BROADCAST = 'broadcast',
  SUPPORT = 'support',
}

export enum ChatRoomStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  MUTED = 'muted',
  BLOCKED = 'blocked',
}

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ChatRoomType })
  type: ChatRoomType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: ChatRoomStatus, default: ChatRoomStatus.ACTIVE })
  status: ChatRoomStatus;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    lastMessageId?: string;
    lastMessageAt?: Date;
    unreadCount?: Record<string, number>; // userId -> count
    settings?: {
      allowReactions: boolean;
      allowThreads: boolean;
      allowPolls: boolean;
      slowMode: number; // seconds between messages
    };
    customFields?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => User, user => user.chatRooms)
  @JoinTable({
    name: 'chat_room_participants',
    joinColumn: { name: 'chatRoomId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => Message, message => message.room)
  messages: Message[];

  @OneToOne(() => RoleplaySession, session => session.chatRoom, { nullable: true })
  session?: RoleplaySession;

  // Methods
  addParticipant(user: User): void {
    if (!this.participants.some(p => p.id === user.id)) {
      this.participants = [...(this.participants || []), user];
    }
  }

  removeParticipant(userId: string): void {
    this.participants = (this.participants || []).filter(p => p.id !== userId);
  }

  updateLastMessage(message: Message): void {
    this.metadata = this.metadata || {};
    this.metadata.lastMessageId = message.id;
    this.metadata.lastMessageAt = new Date();
    
    // Reset unread count for the sender
    if (this.metadata.unreadCount) {
      this.metadata.unreadCount[message.senderId] = 0;
      
      // Increment unread count for other participants
      this.participants
        .filter(p => p.id !== message.senderId)
        .forEach(participant => {
          this.metadata.unreadCount[participant.id] = (this.metadata.unreadCount[participant.id] || 0) + 1;
        });
    }
  }

  getUnreadCount(userId: string): number {
    return this.metadata?.unreadCount?.[userId] || 0;
  }

  markAsRead(userId: string): void {
    if (this.metadata?.unreadCount) {
      this.metadata.unreadCount[userId] = 0;
    }
  }

  isDirectMessage(): boolean {
    return this.type === ChatRoomType.DIRECT && this.participants?.length === 2;
  }

  getOtherParticipant(currentUserId: string): User | undefined {
    if (!this.isDirectMessage()) return undefined;
    return this.participants.find(p => p.id !== currentUserId);
  }
}

// Entity to track user-specific chat room settings
@Entity('user_chat_settings')
export class UserChatSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'varchar', length: 20, default: 'all' })
  notificationPreference: 'all' | 'mentions' | 'none';

  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  mutedUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  customSettings?: Record<string, any>;

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

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatRoomId' })
  chatRoom: ChatRoom;

  @Column('uuid')
  chatRoomId: string;

  // Methods
  isCurrentlyMuted(): boolean {
    if (!this.isMuted) return false;
    if (!this.mutedUntil) return true;
    return new Date() < new Date(this.mutedUntil);
  }

  mute(minutes: number = 60): void {
    this.isMuted = true;
    const muteTime = new Date();
    muteTime.setMinutes(muteTime.getMinutes() + minutes);
    this.mutedUntil = muteTime;
  }

  unmute(): void {
    this.isMuted = false;
    this.mutedUntil = undefined;
  }
}
