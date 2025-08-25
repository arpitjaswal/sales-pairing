import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './modules/users/user.entity';
import { RoleplaySession } from './modules/sessions/session.entity';
import { MatchRequest } from './modules/matching/match-request.entity';
import { PracticeSession } from './modules/matching/practice-session.entity';
// import { Availability } from './modules/availability/availability.entity';
// import { Badge } from './modules/gamification/badge.entity';
// import { UserBadge } from './modules/gamification/user-badge.entity';
// import { Leaderboard } from './modules/gamification/leaderboard.entity';
// import { Feedback } from './modules/feedback/feedback.entity';
// import { Notification } from './modules/notifications/notification.entity';
// import { Message } from './modules/chat/message.entity';
// import { ChatRoom } from './modules/chat/chat-room.entity';
// import { CalendarEvent } from './modules/calendar/calendar-event.entity';
// import { Skill } from './modules/skills/skill.entity';
// import { UserSkill } from './modules/skills/user-skill.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'roleplay_platform',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    RoleplaySession,
    MatchRequest,
    PracticeSession,
    // Availability,
    // Badge,
    // UserBadge,
    // Leaderboard,
    // Feedback,
    // Notification,
    // Message,
    // ChatRoom,
    // CalendarEvent,
    // Skill,
    // UserSkill,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
};
