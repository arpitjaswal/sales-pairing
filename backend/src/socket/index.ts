import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../common/utils/jwt';
import { logger } from '../common/logger';

export interface AuthenticatedSocket extends SocketIOServer.Socket {
  userId?: string;
  user?: any;
}

export const initializeSocket = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = await verifyToken(token.replace('Bearer ', ''));
      socket.userId = decoded.userId;
      socket.user = decoded;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle roleplay session events
    socket.on('join-session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.info(`User ${socket.userId} joined session ${sessionId}`);
      
      // Notify other users in the session
      socket.to(`session:${sessionId}`).emit('user-joined', {
        userId: socket.userId,
        user: socket.user,
        timestamp: new Date()
      });
    });

    socket.on('leave-session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      logger.info(`User ${socket.userId} left session ${sessionId}`);
      
      // Notify other users in the session
      socket.to(`session:${sessionId}`).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle chat messages
    socket.on('send-message', (data: { sessionId: string; message: string; type: string }) => {
      const { sessionId, message, type } = data;
      
      logger.info(`Message from user ${socket.userId} in session ${sessionId}`);
      
      // Broadcast message to all users in the session
      io.to(`session:${sessionId}`).emit('new-message', {
        userId: socket.userId,
        user: socket.user,
        message,
        type,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing-start', (sessionId: string) => {
      socket.to(`session:${sessionId}`).emit('user-typing', {
        userId: socket.userId,
        user: socket.user,
        isTyping: true
      });
    });

    socket.on('typing-stop', (sessionId: string) => {
      socket.to(`session:${sessionId}`).emit('user-typing', {
        userId: socket.userId,
        user: socket.user,
        isTyping: false
      });
    });

    // Handle session recording
    socket.on('start-recording', (sessionId: string) => {
      logger.info(`Recording started for session ${sessionId} by user ${socket.userId}`);
      
      io.to(`session:${sessionId}`).emit('recording-started', {
        startedBy: socket.userId,
        timestamp: new Date()
      });
    });

    socket.on('stop-recording', (sessionId: string) => {
      logger.info(`Recording stopped for session ${sessionId} by user ${socket.userId}`);
      
      io.to(`session:${sessionId}`).emit('recording-stopped', {
        stoppedBy: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle session feedback
    socket.on('submit-feedback', (data: { sessionId: string; feedback: any }) => {
      const { sessionId, feedback } = data;
      
      logger.info(`Feedback submitted for session ${sessionId} by user ${socket.userId}`);
      
      // TODO: Save feedback to database
      
      // Notify session participants
      io.to(`session:${sessionId}`).emit('feedback-submitted', {
        userId: socket.userId,
        feedback,
        timestamp: new Date()
      });
    });

    // Handle user status updates
    socket.on('update-status', (status: string) => {
      logger.info(`User ${socket.userId} status updated to ${status}`);
      
      // Broadcast status update to all connected users
      socket.broadcast.emit('user-status-updated', {
        userId: socket.userId,
        user: socket.user,
        status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
      
      // Notify other users about the disconnection
      socket.broadcast.emit('user-disconnected', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  logger.info('Socket.IO initialized successfully');
};
