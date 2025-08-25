import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTokenExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<JWTPayload> => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Decode JWT token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  return expiration < new Date();
};
