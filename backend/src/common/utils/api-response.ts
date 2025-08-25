import { Response } from 'express';
import { HttpStatus } from '../enums';

/**
 * Standard API response format
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Send a success response
 */
const success = <T>(
  res: Response,
  data: T,
  message: string = 'Operation successful',
  statusCode: number = HttpStatus.OK,
  meta?: any
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
const error = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  errorCode: string = 'INTERNAL_ERROR',
  errorDetails?: any
): void => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  // Add error details in development or if explicitly enabled
  if (errorDetails && (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true')) {
    response.error = {
      ...response.error,
      details: errorDetails,
      stack: errorDetails?.stack,
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
const paginate = <T>(
  res: Response,
  data: T[], 
  total: number,
  page: number = 1,
  limit: number = 10,
  message: string = 'Data retrieved successfully'
): void => {
  const totalPages = Math.ceil(total / limit);
  
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };

  res.status(HttpStatus.OK).json(response);
};

/**
 * Send a created response
 */
const created = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void => {
  success(res, data, message, HttpStatus.CREATED);
};

/**
 * Send a no content response
 */
const noContent = (res: Response): void => {
  res.status(HttpStatus.NO_CONTENT).end();
};

/**
 * Send a bad request response
 */
const badRequest = (
  res: Response,
  message: string = 'Bad request',
  errorCode: string = 'BAD_REQUEST',
  errorDetails?: any
): void => {
  error(res, message, HttpStatus.BAD_REQUEST, errorCode, errorDetails);
};

/**
 * Send an unauthorized response
 */
const unauthorized = (
  res: Response,
  message: string = 'Unauthorized',
  errorCode: string = 'UNAUTHORIZED'
): void => {
  error(res, message, HttpStatus.UNAUTHORIZED, errorCode);
};

/**
 * Send a forbidden response
 */
const forbidden = (
  res: Response,
  message: string = 'Forbidden',
  errorCode: string = 'FORBIDDEN'
): void => {
  error(res, message, HttpStatus.FORBIDDEN, errorCode);
};

/**
 * Send a not found response
 */
const notFound = (
  res: Response,
  message: string = 'Resource not found',
  errorCode: string = 'NOT_FOUND'
): void => {
  error(res, message, HttpStatus.NOT_FOUND, errorCode);
};

/**
 * Send a method not allowed response
 */
const methodNotAllowed = (
  res: Response,
  message: string = 'Method not allowed',
  errorCode: string = 'METHOD_NOT_ALLOWED'
): void => {
  error(res, message, HttpStatus.METHOD_NOT_ALLOWED, errorCode);
};

/**
 * Send a conflict response
 */
const conflict = (
  res: Response,
  message: string = 'Conflict',
  errorCode: string = 'CONFLICT',
  errorDetails?: any
): void => {
  error(res, message, HttpStatus.CONFLICT, errorCode, errorDetails);
};

/**
 * Send an unprocessable entity response
 */
const unprocessableEntity = (
  res: Response,
  message: string = 'Unprocessable entity',
  errorCode: string = 'UNPROCESSABLE_ENTITY',
  errorDetails?: any
): void => {
  error(res, message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode, errorDetails);
};

/**
 * Send a too many requests response
 */
const tooManyRequests = (
  res: Response,
  message: string = 'Too many requests',
  errorCode: string = 'TOO_MANY_REQUESTS',
  retryAfter?: number
): void => {
  if (retryAfter) {
    res.set('Retry-After', retryAfter.toString());
  }
  error(res, message, HttpStatus.TOO_MANY_REQUESTS, errorCode);
};

/**
 * Send an internal server error response
 */
const internalServerError = (
  res: Response,
  message: string = 'Internal server error',
  errorCode: string = 'INTERNAL_SERVER_ERROR',
  errorDetails?: any
): void => {
  error(res, message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode, errorDetails);
};

export {
  success,
  error,
  paginate,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  methodNotAllowed,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
};

export type { ApiResponse };
