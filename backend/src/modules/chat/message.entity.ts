import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { ChatRoom } from './chat-room.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  SYSTEM = 'system',
  TYPING = 'typing',
  READ_RECEIPT = 'read_receipt',
  REACTION = 'reaction',
  REPLY = 'reply',
  FORWARD = 'forward',
  POLL = 'poll',
  SCHEDULE = 'schedule',
  ROLEPLAY_ACTION = 'roleplay_action',
  FEEDBACK_REQUEST = 'feedback_request',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EDITED = 'edited',
  DELETED = 'deleted',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    // For media messages
    mediaUrl?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number; // for audio/video
    thumbnailUrl?: string;
    
    // For replies
    replyToId?: string;
    replyPreview?: string; // First 100 chars of the original message
    
    // For reactions
    reactions?: Record<string, string[]>; // emoji -> user IDs
    
    // For roleplay actions
    actionType?: string;
    actionData?: Record<string, any>;
    
    // For feedback requests
    feedbackRequestId?: string;
    
    // For system messages
    systemAction?: string;
    systemData?: any;
    
    // For read receipts
    readBy?: Array<{
      userId: string;
      readAt: Date;
    }>;
  };

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  mentions?: string[]; // Array of user IDs mentioned in the message

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column('uuid')
  @Index()
  senderId: string;

  @ManyToOne(() => ChatRoom, room => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @Column('uuid')
  @Index()
  roomId: string;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentMessageId' })
  parentMessage?: Message;

  @Column('uuid', { nullable: true })
  parentMessageId?: string;

  @OneToMany(() => Message, message => message.parentMessage)
  replies: Message[];

  // Indexes
  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'created_at' })
  createdAtIndex: Date;

  // Methods
  markAsRead(userId: string): void {
    if (!this.metadata) this.metadata = {};
    this.metadata.readBy = this.metadata.readBy || [];
    
    const existingRead = this.metadata.readBy.find(r => r.userId === userId);
    if (existingRead) {
      existingRead.readAt = new Date();
    } else {
      this.metadata.readBy.push({
        userId,
        readAt: new Date(),
      });
    }
    
    // Update status if all participants have read it
    if (this.room?.participants) {
      const participantIds = this.room.participants.map(p => p.id);
      const readByAll = participantIds.every(id => 
        id === this.senderId || this.metadata.readBy?.some(r => r.userId === id)
      );
      
      if (readByAll) {
        this.status = MessageStatus.READ;
      } else if (this.status === MessageStatus.SENT) {
        this.status = MessageStatus.DELIVERED;
      }
    }
  }

  addReaction(userId: string, emoji: string): void {
    if (!this.metadata) this.metadata = {};
    if (!this.metadata.reactions) this.metadata.reactions = {};
    
    // Remove user's previous reaction to this emoji if any
    for (const [e, users] of Object.entries(this.metadata.reactions)) {
      this.metadata.reactions[e] = users.filter(id => id !== userId);
      // Remove empty reaction arrays
      if (this.metadata.reactions[e].length === 0) {
        delete this.metadata.reactions[e];
      }
    }
    
    // Add new reaction
    if (!this.metadata.reactions[emoji]) {
      this.metadata.reactions[emoji] = [];
    }
    this.metadata.reactions[emoji].push(userId);
  }

  removeReaction(userId: string, emoji: string): void {
    if (!this.metadata?.reactions?.[emoji]) return;
    
    this.metadata.reactions[emoji] = this.metadata.reactions[emoji].filter(id => id !== userId);
    
    // Remove empty reaction arrays
    if (this.metadata.reactions[emoji].length === 0) {
      delete this.metadata.reactions[emoji];
    }
  }

  softDelete(): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
    // Clear sensitive data
    this.content = '[Message deleted]';
    this.metadata = {};
  }

  // Factory methods for common message types
  static createTextMessage(sender: User, roomId: string, content: string, mentions: string[] = []): Message {
    const message = new Message();
    message.type = MessageType.TEXT;
    message.content = content;
    message.sender = sender;
    message.senderId = sender.id;
    message.roomId = roomId;
    message.mentions = mentions;
    return message;
  }

  static createSystemMessage(roomId: string, content: string, systemAction: string, systemData: any = {}): Message {
    const message = new Message();
    message.type = MessageType.SYSTEM;
    message.content = content;
    message.roomId = roomId;
    message.metadata = {
      systemAction,
      systemData,
    };
    return message;
  }

  static createRoleplayAction(sender: User, roomId: string, actionType: string, actionData: any): Message {
    const message = new Message();
    message.type = MessageType.ROLEPLAY_ACTION;
    message.sender = sender;
    message.senderId = sender.id;
    message.roomId = roomId;
    message.metadata = {
      actionType,
      actionData,
    };
    return message;
  }
}
