import { generateToken, verifyToken, extractTokenFromHeader } from '../jwt';
import jwt from 'jsonwebtoken';

// Mock the JWT module
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: '123', role: 'user' }),
}));

describe('JWT Utility', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    role: 'user',
  };

  const mockConfig = {
    jwt: {
      secret: 'test-secret',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the config
    jest.mock('../../../config', () => mockConfig, { virtual: true });
  });

  describe('generateToken', () => {
    it('should generate an access token', () => {
      const token = generateToken(mockUser, 'access');
      
      expect(token).toBe('mocked-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, role: mockUser.role, type: 'access' },
        mockConfig.jwt.secret,
        { expiresIn: mockConfig.jwt.accessTokenExpiry }
      );
    });

    it('should generate a refresh token', () => {
      const token = generateToken(mockUser, 'refresh');
      
      expect(token).toBe('mocked-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, role: mockUser.role, type: 'refresh' },
        mockConfig.jwt.secret,
        { expiresIn: mockConfig.jwt.refreshTokenExpiry }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = verifyToken('valid-token');
      
      expect(payload).toEqual({ userId: '123', role: 'user' });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', mockConfig.jwt.secret);
    });

    it('should throw an error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from authorization header', () => {
      const token = extractTokenFromHeader('Bearer valid-token');
      expect(token).toBe('valid-token');
    });

    it('should return undefined for missing authorization header', () => {
      const token = extractTokenFromHeader(undefined);
      expect(token).toBeUndefined();
    });

    it('should return undefined for invalid authorization header format', () => {
      const token = extractTokenFromHeader('InvalidFormat');
      expect(token).toBeUndefined();
    });
  });
});
