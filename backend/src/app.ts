import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { AppDataSource } from './data-source';
import { errorHandler } from './common/middleware/error-handler';
import { NotFoundError } from './common/errors/not-found-error';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/user.routes';
import { sessionRouter } from './modules/sessions/session.routes';
import { matchingRouter } from './modules/matching/matching.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { feedbackRouter } from './modules/feedback/feedback.routes';
import { calendarRouter } from './modules/calendar/calendar.routes';
import { skillRouter } from './modules/skills/skill.routes';
import { gamificationRouter } from './modules/gamification/gamification.routes';
import { initializeSocket } from './socket';
import { config } from './config';
import { initializeCronJobs } from './cron';

class App {
  public app: Application;
  public server: HttpServer;
  public io: SocketIOServer;
  private redisClient: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeNotFoundHandler();
  }

  private async initializeMiddlewares() {
    // Security headers
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    });
    
    this.app.use(limiter);
    
    // Request logging
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan('dev'));
    }
    
    // Body parsing
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    
    // Compression
    this.app.use(compression());
    
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });
  }

  private initializeRoutes() {
    // API routes
    const apiRouter = express.Router();
    
    // Mount all routes
    apiRouter.use('/auth', authRouter);
    apiRouter.use('/users', userRouter);
    apiRouter.use('/sessions', sessionRouter);
    apiRouter.use('/matching', matchingRouter);
    apiRouter.use('/chat', chatRouter);
    apiRouter.use('/feedback', feedbackRouter);
    apiRouter.use('/calendar', calendarRouter);
    apiRouter.use('/skills', skillRouter);
    apiRouter.use('/gamification', gamificationRouter);
    
    // Apply API prefix
    this.app.use('/api/v1', apiRouter);
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  private initializeNotFoundHandler() {
    this.app.all('*', (req: Request, res: Response, next: NextFunction) => {
      throw new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
    });
  }

  private async initializeRedis() {
    try {
      // Create Redis client for pub/sub
      this.redisClient = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
        ...(config.redis.password && { password: config.redis.password }),
      });
      
      await this.redisClient.connect();
      
      // Create Redis adapter for Socket.IO
      const pubClient = this.redisClient.duplicate();
      await pubClient.connect();
      
      const subClient = this.redisClient.duplicate();
      await subClient.connect();
      
      this.io.adapter(createAdapter(pubClient, subClient));
      
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Don't exit process, just log the error
      console.log('Continuing without Redis...');
    }
  }

  public async initializeSocketIO() {
    // Initialize Socket.IO with CORS configuration
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Enable HTTP long-polling as fallback
      transports: ['websocket', 'polling'],
      // Enable connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
    });

    // Initialize Redis for Socket.IO (optional)
    try {
      await this.initializeRedis();
    } catch (error) {
      console.log('Redis not available, continuing without it...');
    }

    // Initialize socket event handlers
    initializeSocket(this.io);
  }

  public async initializeDatabase() {
    try {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
      
      // Run database migrations in production
      if (config.nodeEnv === 'production') {
        await AppDataSource.runMigrations();
        console.log('Database migrations completed');
      }
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      process.exit(1);
    }
  }

  public async start() {
    try {
      // Initialize database connection
      await this.initializeDatabase();
      
      // Initialize Socket.IO
      await this.initializeSocketIO();
      
      // Start the server
      const port = config.port || 5000;
      this.server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        
        // Initialize scheduled tasks
        if (config.nodeEnv !== 'test') {
          initializeCronJobs();
        }
      });
      
      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Consider logging to an external service here
      });
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        // Consider logging to an external service here
        process.exit(1);
      });
      
      // Handle graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      
    } catch (error) {
      console.error('Failed to start the server:', error);
      process.exit(1);
    }
  }

  private async shutdown() {
    console.log('Shutting down server...');
    
    try {
      // Close the HTTP server
      this.server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connection
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('Database connection closed');
        }
        
        // Close Redis connection if it exists
        if (this.redisClient) {
          await this.redisClient.quit();
          console.log('Redis connection closed');
        }
        
        console.log('Server shutdown completed');
        process.exit(0);
      });
      
      // Force close server after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
      
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

export const app = new App();

// Start the application if this file is run directly
if (require.main === module) {
  app.start();
}
