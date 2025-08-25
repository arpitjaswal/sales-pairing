import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../logger';
import { verifyToken } from './jwt';
import { config } from '../../config';
import { User } from '../../modules/user/user.entity';

export interface AuthenticatedSocket extends Socket {
  user?: User;
  userId?: string;
  role?: string;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string>; // userId -> socketId
  private userSockets: Map<string, Set<string>>; // userId -> Set<socketId>
  private socketRooms: Map<string, Set<string>>; // socketId -> Set<roomId>

  constructor() {
    this.connectedUsers = new Map();
    this.userSockets = new Map();
    this.socketRooms = new Map();
  }

  /**
   * Initialize Socket.IO server
   */
  public initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });

    // Middleware for authentication
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token || 
                     socket.handshake.query?.token as string;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
          return next(new Error('Authentication error: Invalid token'));
        }

        socket.user = decoded.user;
        socket.userId = decoded.user.id;
        socket.role = decoded.user.role;
        
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid or expired token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.userId) {
        socket.disconnect(true);
        return;
      }

      this.handleConnection(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle join room
      socket.on('join_room', (roomId: string) => {
        this.joinRoom(socket, roomId);
      });

      // Handle leave room
      socket.on('leave_room', (roomId: string) => {
        this.leaveRoom(socket, roomId);
      });

      // Handle custom events
      socket.onAny((event: string, ...args: any[]) => {
        logger.debug(`Socket event received: ${event}`, {
          userId: socket.userId,
          event,
          args: args.length > 0 ? args[0] : {},
        });
      });
    });

    logger.info('Socket.IO server initialized');
  }

  /**
   * Get the Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized');
    }
    return this.io;
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const socketId = socket.id;

    // Add to connected users
    this.connectedUsers.set(userId, socketId);

    // Add to user's socket set
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Initialize socket rooms set
    this.socketRooms.set(socketId, new Set());

    logger.info(`User connected: ${userId} (socket: ${socketId})`, {
      userId,
      socketId,
      totalConnected: this.connectedUsers.size,
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const socketId = socket.id;

    // Remove from connected users if this was the last socket for the user
    if (this.connectedUsers.get(userId) === socketId) {
      this.connectedUsers.delete(userId);
    }

    // Remove from user's socket set
    if (this.userSockets.has(userId)) {
      const userSockets = this.userSockets.get(userId)!;
      userSockets.delete(socketId);

      // If no more sockets for this user, clean up
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Leave all rooms
    const rooms = this.socketRooms.get(socketId) || new Set();
    rooms.forEach(roomId => {
      socket.leave(roomId);
    });
    this.socketRooms.delete(socketId);

    logger.info(`User disconnected: ${userId} (socket: ${socketId})`, {
      userId,
      socketId,
      totalConnected: this.connectedUsers.size,
    });
  }

  /**
   * Join a room
   */
  public joinRoom(socket: AuthenticatedSocket, roomId: string): void {
    const userId = socket.userId!;
    const socketId = socket.id;

    // Add to room
    socket.join(roomId);

    // Track room membership
    if (!this.socketRooms.has(socketId)) {
      this.socketRooms.set(socketId, new Set());
    }
    this.socketRooms.get(socketId)!.add(roomId);

    logger.info(`User ${userId} joined room ${roomId}`, {
      userId,
      socketId,
      roomId,
    });
  }

  /**
   * Leave a room
   */
  public leaveRoom(socket: AuthenticatedSocket, roomId: string): void {
    const userId = socket.userId!;
    const socketId = socket.id;

    // Leave room
    socket.leave(roomId);

    // Update room membership tracking
    if (this.socketRooms.has(socketId)) {
      this.socketRooms.get(socketId)!.delete(roomId);
    }

    logger.info(`User ${userId} left room ${roomId}`, {
      userId,
      socketId,
      roomId,
    });
  }

  /**
   * Emit an event to a specific user
   */
  public emitToUser(userId: string, event: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Emit an event to all sockets of a specific user
   */
  public emitToUserAllSockets(userId: string, event: string, data: any): void {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Emit an event to all users in a room
   */
  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Emit an event to all connected users
   */
  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Check if a user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all connected user IDs
   */
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Get all rooms a user is in
   */
  public getUserRooms(userId: string): string[] {
    const socketIds = this.userSockets.get(userId) || new Set();
    const rooms = new Set<string>();

    socketIds.forEach(socketId => {
      const socketRooms = this.socketRooms.get(socketId) || new Set();
      socketRooms.forEach(room => rooms.add(room));
    });

    return Array.from(rooms);
  }

  /**
   * Get all users in a room
   */
  public getUsersInRoom(roomId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }
}

export const socketService = new SocketService();
export default socketService;
