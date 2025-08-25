import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { config } from '../../config';
import { AppDataSource } from '../../data-source';
import { User } from '../../modules/users/user.entity';
import { logger } from '../logger';

/**
 * Interface for JWT payload
 */
interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing.',
      });
    }

    // Verify token
    let payload: TokenPayload;
    
    try {
      payload = verify(token, config.jwt.secret, {
        audience: config.jwt.audience,
        issuer: config.jwt.issuer,
      }) as TokenPayload;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    // Check if user exists and is active
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      select: ['id', 'email', 'role', 'isActive', 'isVerified'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account is inactive.',
      });
    }

    // Check if email is verified (if required)
    if (config.features.enableEmailVerification && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to continue.',
      });
    }

    // Attach user to request object
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * Middleware to check if user has required roles
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource
 * @param paramName Name of the parameter containing the resource ID
 * @param userField Name of the user field in the resource (default: 'userId')
 */
export const isOwner = (paramName: string, userField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceId = req.params[paramName];
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admin can access any resource
    if (user.role === 'admin') {
      return next();
    }

    // Get the resource
    try {
      const resource = await AppDataSource.manager
        .createQueryBuilder()
        .from('resource_table', 'resource')
        .where('resource.id = :id', { id: resourceId })
        .andWhere(`resource.${userField} = :userId`, { userId: user.id })
        .getOne();

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found or access denied.',
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while checking resource ownership.',
      });
    }
  };
};
