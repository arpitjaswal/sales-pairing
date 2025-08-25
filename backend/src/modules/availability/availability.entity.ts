import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum AvailabilityType {
  RECURRING = 'recurring',
  ONE_TIME = 'one_time',
  BLOCKED = 'blocked',
}

export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AvailabilityType })
  type: AvailabilityType;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'jsonb', nullable: true })
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    byDay?: DayOfWeek[];
    byMonthDay?: number[];
    endDate?: Date;
    occurrences?: number;
  };

  @Column({ type: 'varchar', length: 50, nullable: true })
  label?: string;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    timezone: string;
    createdFrom?: 'manual' | 'calendar' | 'import';
    sourceId?: string;
    lastSyncedAt?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.availabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @Index()
  userId: string;

  // Indexes
  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'start_time' })
  startTimeIndex: Date;

  @Index()
  @Column({ type: 'timestamptz', generated: 'STORED', asExpression: 'end_time' })
  endTimeIndex: Date;

  // Methods
  isRecurring(): boolean {
    return this.type === AvailabilityType.RECURRING;
  }

  isAvailableAt(time: Date): boolean {
    const checkTime = new Date(time);
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);

    // Check if the time is within the availability window
    if (checkTime >= start && checkTime <= end) {
      if (this.isRecurring()) {
        // For recurring availabilities, check the recurrence pattern
        return this.matchesRecurrencePattern(checkTime);
      }
      return true;
    }
    return false;
  }

  private matchesRecurrencePattern(time: Date): boolean {
    if (!this.recurrence) return false;
    
    const checkTime = new Date(time);
    const start = new Date(this.startTime);
    
    // Check if we're past the end date if it exists
    if (this.recurrence.endDate && checkTime > new Date(this.recurrence.endDate)) {
      return false;
    }
    
    // Check day of week for weekly recurrence
    if (this.recurrence.frequency === 'weekly' && this.recurrence.byDay?.length) {
      const dayOfWeek = checkTime.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      return this.recurrence.byDay.includes(dayOfWeek as DayOfWeek);
    }
    
    // Check day of month for monthly recurrence
    if (this.recurrence.frequency === 'monthly' && this.recurrence.byMonthDay?.length) {
      const dayOfMonth = checkTime.getDate();
      return this.recurrence.byMonthDay.includes(dayOfMonth);
    }
    
    // For daily or other frequencies, just check if it's within the time window
    return true;
  }

  getNextOccurrence(afterDate: Date = new Date()): Date | null {
    if (!this.isRecurring()) {
      return new Date(this.startTime) > afterDate ? new Date(this.startTime) : null;
    }
    
    // This is a simplified implementation - a full implementation would need to handle
    // all recurrence rules and edge cases
    let nextDate = new Date(Math.max(Date.parse(afterDate.toString()), Date.parse(this.startTime.toString())));
    
    if (nextDate < new Date(this.startTime)) {
      nextDate = new Date(this.startTime);
    }
    
    // This is a placeholder - a real implementation would calculate the next occurrence
    // based on the recurrence rules
    if (this.recurrence) {
      if (this.recurrence.frequency === 'daily') {
        nextDate.setDate(nextDate.getDate() + this.recurrence.interval);
      } else if (this.recurrence.frequency === 'weekly' && this.recurrence.byDay?.length) {
        // Find the next matching day of week
        const currentDay = nextDate.getDay();
        const daysOfWeek = this.recurrence.byDay.map(day => 
          [
            'sunday', 'monday', 'tuesday', 'wednesday', 
            'thursday', 'friday', 'saturday'
          ].indexOf(day)
        ).sort((a, b) => a - b);
        
        let daysToAdd = 0;
        const nextDay = daysOfWeek.find(d => d > currentDay);
        
        if (nextDay !== undefined) {
          daysToAdd = nextDay - currentDay;
        } else {
          daysToAdd = (7 - currentDay) + (daysOfWeek[0] || 0);
        }
        
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      }
      // Add handling for monthly and other frequencies
    }
    
    // Make sure the next occurrence is within the end time if specified
    if (this.recurrence?.endDate && nextDate > new Date(this.recurrence.endDate)) {
      return null;
    }
    
    return nextDate;
  }
}
