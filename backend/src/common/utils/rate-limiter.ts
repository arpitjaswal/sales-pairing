import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from '../../config';
import { logger } from '../logger';
import { tooManyRequests } from './api-response';

// Create Redis client
const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        logger.error('Too many reconnection attempts on Redis. Killing the process.');
        return new Error('Too many reconnection attempts on Redis');
      }
      // Reconnect after 2 seconds, then 4, 8, 16, 32 seconds
      return Math.min(retries * 2000, 32000);
    },
  },
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis for rate limiting');
  } catch (error) {
    logger.error('Failed to connect to Redis for rate limiting:', error);
  }
};

// Initialize Redis connection
connectRedis();

/**
 * Rate limiter configuration
 */
const rateLimiterConfig = {
  // Rate limiter configuration for general API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    handler: (req: Request, res: Response) => {
      tooManyRequests(res, 'Too many requests, please try again later');
    },
  },
  
  // Stricter rate limiter for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    handler: (req: Request, res: Response) => {
      tooManyRequests(res, 'Too many login attempts, please try again later');
    },
  },
  
  // Very strict rate limiter for password reset and sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per hour
    message: 'Too many attempts, please try again after an hour',
    handler: (req: Request, res: Response) => {
      tooManyRequests(res, 'Too many attempts, please try again later');
    },
  },
};

/**
 * Create a rate limiter with Redis store
 * @param config Configuration for the rate limiter
 * @returns Rate limiter middleware
 */
const createRateLimiter = (config: {
  windowMs: number;
  max: number;
  message?: string;
  handler?: (req: Request, res: Response) => void;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rate-limit:',
    }),
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: config.message,
    handler: config.handler,
    keyGenerator: config.keyGenerator || ((req: Request) => {
      // Use IP + user ID if available for more granular rate limiting
      const userId = (req.user && req.user.id) ? `:user-${req.user.id}` : '';
      return `${req.ip}${userId}`;
    }),
  });
};

/**
 * Rate limiter for general API endpoints
 */
export const apiRateLimiter = createRateLimiter(rateLimiterConfig.api);

/**
 * Rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter(rateLimiterConfig.auth);

/**
 * Rate limiter for sensitive operations
 */
export const sensitiveRateLimiter = createRateLimiter(rateLimiterConfig.sensitive);

/**
 * Middleware to apply different rate limits based on the endpoint
 */
export const dynamicRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Apply different rate limits based on the path
  if (req.path.startsWith('/api/auth')) {
    if (['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'].includes(req.path)) {
      return authRateLimiter(req, res, next);
    }
    if (['/api/auth/reset-password', '/api/auth/verify-email'].includes(req.path)) {
      return sensitiveRateLimiter(req, res, next);
    }
  }
  
  // Apply API rate limiter by default
  return apiRateLimiter(req, res, next);
};

/**
 * Middleware to reset rate limiting for successful operations
 * Useful for login attempts where we want to reset the counter on success
 */
export const resetRateLimit = (req: Request) => {
  const key = `rate-limit:${req.ip}`;
  redisClient.del(key).catch(err => {
    logger.error('Error resetting rate limit:', err);
  });
};

/**
 * Get rate limit information for a specific key
 */
export const getRateLimitInfo = async (key: string) => {
  try {
    const data = await redisClient.get(`rate-limit:${key}`);
    if (!data) return null;
    
    const [totalHits, resetTime] = data.split(':');
    return {
      totalHits: parseInt(totalHits, 10),
      resetTime: new Date(parseInt(resetTime, 10)),
    };
  } catch (error) {
    logger.error('Error getting rate limit info:', error);
    return null;
  }
};

/**
 * Close the Redis connection when the application shuts down
 */
const cleanup = () => {
  redisClient.quit().catch(() => {
    // Ignore errors during cleanup
  });
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Export the Redis client in case it's needed elsewhere
export { redisClient as rateLimitRedisClient };
