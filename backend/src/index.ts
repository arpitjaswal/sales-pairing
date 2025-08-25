import 'reflect-metadata';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import app and database
import { app } from './app';
import { AppDataSource } from './data-source';
import { initializeSocket } from './socket/index';
import { initializeCronJobs } from './cron/index';
import { logger } from './common/logger';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket handlers
initializeSocket(io);

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Initialize cron jobs
const initializeCron = async () => {
  try {
    await initializeCronJobs();
    logger.info('Cron jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize cron jobs:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize cron jobs
    await initializeCron();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    AppDataSource.destroy().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error closing database connection:', error);
      process.exit(1);
    });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();
