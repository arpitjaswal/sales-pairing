import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { NotFoundError } from '../errors/not-found-error';
import { BadRequestError } from '../errors/bad-request-error';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error instanceof NotFoundError) {
    statusCode = 404;
  } else if (error instanceof BadRequestError) {
    statusCode = 400;
  }

  // Handle validation errors
  if (Array.isArray(error)) {
    statusCode = 400;
    message = 'Validation failed';
    return res.status(statusCode).json({
      success: false,
      message,
      errors: error.map(e => ({
        property: e.property,
        constraints: e.constraints,
      })),
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle database errors
  if (error.name === 'QueryFailedError') {
    statusCode = 400;
    message = 'Database operation failed';
  }

  // Handle file upload errors
  if (error.message && error.message.includes('File')) {
    statusCode = 400;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
