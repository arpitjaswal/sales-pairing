import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { socketService, AuthenticatedSocket } from '../socket';

// Mock Socket.IO server
jest.mock('socket.io', () => {
  const mockSocket = {
    id: 'test-socket-id',
    handshake: {
      auth: { token: 'test-token' },
      query: {},
    },
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket;

  return {
    Server: jest.fn(() => ({
      use: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      }),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map([
          ['test-socket-id', mockSocket],
        ]),
      },
    })),
  };
});

// Mock JWT verification
jest.mock('../jwt', () => ({
  verifyToken: jest.fn().mockReturnValue({
    user: { id: 'test-user-id', role: 'user' },
  }),
}));

describe('SocketService', () => {
  let httpServer: HttpServer;
  
  beforeAll(() => {
    httpServer = new HttpServer();
  });

  beforeEach(() => {
    // Reset the SocketService instance before each test
    jest.clearAllMocks();
    // @ts-ignore - Reset the private instance for testing
    socketService['io'] = undefined;
    // @ts-ignore - Reset connected users
    socketService['connectedUsers'] = new Map();
  });

  describe('initialize', () => {
    it('should initialize the Socket.IO server', () => {
      socketService.initialize(httpServer);
      expect(SocketIOServer).toHaveBeenCalled();
    });
  });

  describe('handleConnection', () => {
    it('should handle a new socket connection', () => {
      socketService.initialize(httpServer);
      // The connection is automatically handled in the mock
      expect(socketService.isUserConnected('test-user-id')).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should handle socket disconnection', () => {
      socketService.initialize(httpServer);
      // The connection is automatically handled in the mock
      const socket = {
        id: 'test-socket-id',
        userId: 'test-user-id',
        disconnect: jest.fn(),
      } as unknown as AuthenticatedSocket;
      
      // @ts-ignore - Access private method for testing
      socketService.handleDisconnect(socket);
      
      expect(socketService.isUserConnected('test-user-id')).toBe(false);
    });
  });

  describe('room management', () => {
    it('should allow joining and leaving rooms', () => {
      const socket = {
        id: 'test-socket-id',
        userId: 'test-user-id',
        join: jest.fn(),
        leave: jest.fn(),
      } as unknown as AuthenticatedSocket;
      
      const roomId = 'test-room';
      
      // @ts-ignore - Access private method for testing
      socketService.joinRoom(socket, roomId);
      expect(socket.join).toHaveBeenCalledWith(roomId);
      
      // @ts-ignore - Access private method for testing
      socketService.leaveRoom(socket, roomId);
      expect(socket.leave).toHaveBeenCalledWith(roomId);
    });
  });

  describe('message broadcasting', () => {
    it('should emit messages to users and rooms', () => {
      const io = new SocketIOServer(httpServer);
      // @ts-ignore - Set the private io instance
      socketService['io'] = io;
      
      const testEvent = 'test-event';
      const testData = { message: 'test' };
      
      // Test emitting to a user
      socketService.emitToUser('test-user-id', testEvent, testData);
      expect(io.to).toHaveBeenCalled();
      
      // Test emitting to a room
      socketService.emitToRoom('test-room', testEvent, testData);
      expect(io.to).toHaveBeenCalledWith('test-room');
      
      // Test emitting to all
      socketService.emitToAll(testEvent, testData);
      expect(io.emit).toHaveBeenCalledWith(testEvent, testData);
    });
  });

  afterAll(() => {
    // Cleanup
    httpServer.close();
  });
});
