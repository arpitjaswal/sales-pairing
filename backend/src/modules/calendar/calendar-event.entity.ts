import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { RoleplaySession } from '../sessions/session.entity';

export enum CalendarEventStatus {
  TENTATIVE = 'tentative',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum CalendarEventVisibility {
  DEFAULT = 'default',
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum CalendarEventSource {
  INTERNAL = 'internal',
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  ICAL = 'ical',
  API = 'api',
}

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'enum', enum: CalendarEventStatus, default: CalendarEventStatus.CONFIRMED })
  status: CalendarEventStatus;

  @Column({ type: 'enum', enum: CalendarEventVisibility, default: CalendarEventVisibility.DEFAULT })
  visibility: CalendarEventVisibility;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true })
  attendees?: Array<{
    userId: string;
    email: string;
    name: string;
    status: 'needsAction' | 'accepted' | 'declined' | 'tentative';
    responseTime?: Date;
    isOrganizer: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  reminders?: Array<{
    method: 'email' | 'popup' | 'push';
    minutes: number;
    sent: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    count?: number;
    until?: Date;
    byDay?: string[];
    byMonthDay?: number[];
    byMonth?: number[];
    timezone?: string;
  };

  @Column({ type: 'enum', enum: CalendarEventSource, default: CalendarEventSource.INTERNAL })
  source: CalendarEventSource;

  @Column({ type: 'varchar', nullable: true })
  sourceId?: string; // External ID from Google/Outlook/etc.

  @Column({ type: 'varchar', nullable: true })
  sourceUrl?: string; // URL to view the event in the source calendar

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    colorId?: string;
    hangoutLink?: string;
    conferenceData?: any;
    iCalUID?: string;
    originalStartTime?: {
      dateTime: Date;
      timeZone: string;
    };
    isRecurringEvent?: boolean;
    recurringEventId?: string;
    organizer?: {
      id: string;
      email: string;
      displayName: string;
      self: boolean;
    };
  };

  @Column({ type: 'boolean', default: false })
  isAllDay: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  @Column('uuid')
  @Index()
  organizerId: string;

  @OneToOne(() => RoleplaySession, session => session.calendarEvent, { nullable: true })
  session?: RoleplaySession;

  @Column('uuid', { nullable: true })
  sessionId?: string;

  // Indexes
  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'start_time' })
  startTimeIndex: Date;

  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'end_time' })
  endTimeIndex: Date;

  // Methods
  isUpcoming(): boolean {
    return new Date() < new Date(this.startTime);
  }

  isOngoing(): boolean {
    const now = new Date();
    return now >= new Date(this.startTime) && now <= new Date(this.endTime);
  }

  isPast(): boolean {
    return new Date() > new Date(this.endTime);
  }

  getDurationInMinutes(): number {
    return (new Date(this.endTime).getTime() - new Date(this.startTime).getTime()) / (1000 * 60);
  }

  addAttendee(user: User, status: 'needsAction' | 'accepted' | 'declined' | 'tentative' = 'needsAction'): void {
    if (!this.attendees) this.attendees = [];
    
    const existingAttendee = this.attendees.find(a => a.userId === user.id);
    if (existingAttendee) {
      existingAttendee.status = status;
      existingAttendee.responseTime = new Date();
    } else {
      this.attendees.push({
        userId: user.id,
        email: user.email,
        name: user.getFullName(),
        status,
        responseTime: new Date(),
        isOrganizer: user.id === this.organizerId,
      });
    }
  }

  removeAttendee(userId: string): void {
    if (!this.attendees) return;
    this.attendees = this.attendees.filter(a => a.userId !== userId);
  }

  updateAttendeeStatus(userId: string, status: 'needsAction' | 'accepted' | 'declined' | 'tentative'): boolean {
    if (!this.attendees) return false;
    
    const attendee = this.attendees.find(a => a.userId === userId);
    if (attendee) {
      attendee.status = status;
      attendee.responseTime = new Date();
      return true;
    }
    return false;
  }

  // Factory methods for common event types
  static createSessionEvent(session: RoleplaySession, organizer: User): CalendarEvent {
    const event = new CalendarEvent();
    event.title = `Roleplay Session: ${session.title || 'Practice Session'}`;
    event.description = session.description || 'Roleplay practice session';
    event.startTime = new Date(session.startTime);
    event.endTime = new Date(session.endTime);
    event.timezone = 'UTC'; // Should be set based on user's timezone
    event.organizer = organizer;
    event.organizerId = organizer.id;
    event.session = session;
    event.visibility = CalendarEventVisibility.PRIVATE;
    
    // Add participants as attendees
    event.attendees = [
      {
        userId: session.initiatorId,
        email: session.initiator.email,
        name: session.initiator.getFullName(),
        status: 'accepted',
        responseTime: new Date(),
        isOrganizer: session.initiatorId === organizer.id,
      },
      {
        userId: session.participantId,
        email: session.participant.email,
        name: session.participant.getFullName(),
        status: 'needsAction',
        isOrganizer: session.participantId === organizer.id,
      },
    ];
    
    // Add reminders
    event.reminders = [
      { method: 'email', minutes: 1440, sent: false }, // 1 day before
      { method: 'push', minutes: 30, sent: false }, // 30 minutes before
    ];
    
    return event;
  }

  static createAvailabilityBlock(user: User, startTime: Date, endTime: Date, title: string = 'Available for Roleplay'): CalendarEvent {
    const event = new CalendarEvent();
    event.title = title;
    event.startTime = startTime;
    event.endTime = endTime;
    event.timezone = user.timezone || 'UTC';
    event.organizer = user;
    event.organizerId = user.id;
    event.visibility = CalendarEventVisibility.PRIVATE;
    event.status = CalendarEventStatus.CONFIRMED;
    event.metadata = {
      isAvailabilityBlock: true,
    };
    return event;
  }
}
