import { SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { HttpStatus } from '../enums';
import { BadRequestException } from '../exceptions';

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: any; // Allow additional query parameters
}

/**
 * Pagination result interface
 */
export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse pagination options from request query
 * @param req Express request object
 * @returns Pagination options
 */
export const getPaginationOptions = (req: Request): PaginationOptions => {
  const page = parseInt(req.query.page as string, 10) || DEFAULT_PAGE;
  let limit = parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = ((req.query.sortOrder as string) || 'DESC').toUpperCase() as 'ASC' | 'DESC';

  // Validate page and limit
  if (page < 1) {
    throw new BadRequestException('Page must be greater than 0');
  }

  // Ensure limit doesn't exceed maximum
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  // Include all query parameters in the options
  const options: PaginationOptions = {
    ...req.query,
    page,
    limit,
    sortBy,
    sortOrder: ['ASC', 'DESC'].includes(sortOrder) ? sortOrder as 'ASC' | 'DESC' : 'DESC',
  };

  return options;
};

/**
 * Apply pagination to a TypeORM query builder
 * @param queryBuilder TypeORM query builder
 * @param options Pagination options
 * @returns Promise with paginated results
 */
export const paginate = async <T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PaginationOptions
): Promise<PaginationResult<T>> => {
  const { page, limit, sortBy, sortOrder, ...filters } = options;
  const skip = (page - 1) * limit;

  // Apply sorting
  if (sortBy) {
    const order: any = {};
    order[sortBy] = sortOrder || 'DESC';
    queryBuilder.orderBy(order);
  }

  // Apply pagination
  queryBuilder.skip(skip).take(limit);

  // Execute queries to get both data and total count
  const [data, total] = await Promise.all([
    queryBuilder.getMany(),
    queryBuilder.getCount(),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
};

/**
 * Format pagination result for API response
 * @param data Paginated data
 * @param statusCode HTTP status code
 * @param message Optional message
 * @returns Formatted response object
 */
export const formatPaginationResponse = <T>(
  data: T[],
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  },
  statusCode: number = HttpStatus.OK,
  message: string = 'Data retrieved successfully'
) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    meta: {
      pagination: {
        currentPage: meta.page,
        pageSize: meta.limit,
        totalItems: meta.total,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPreviousPage: meta.hasPreviousPage,
      },
    },
  };
};

/**
 * Create a pagination URL for the given page
 * @param req Express request object
 * @param page Page number
 * @param limit Items per page
 * @returns URL string
 */
export const createPageUrl = (req: Request, page: number, limit: number): string => {
  const { protocol, originalUrl, baseUrl, hostname } = req;
  const baseUrlWithProtocol = `${protocol}://${hostname}${baseUrl}`;
  const url = new URL(originalUrl, baseUrlWithProtocol);
  
  // Update page and limit parameters
  url.searchParams.set('page', page.toString());
  url.searchParams.set('limit', limit.toString());
  
  return url.toString();
};

/**
 * Generate pagination links for HATEOAS
 * @param req Express request object
 * @param meta Pagination metadata
 * @returns Object with pagination links
 */
export const generatePaginationLinks = (
  req: Request,
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) => {
  const { page, limit, totalPages } = meta;
  const links: { [key: string]: string | null } = {
    first: null,
    prev: null,
    next: null,
    last: null,
    self: createPageUrl(req, page, limit),
  };

  if (page > 1) {
    links.first = createPageUrl(req, 1, limit);
    links.prev = createPageUrl(req, page - 1, limit);
  }

  if (page < totalPages) {
    links.next = createPageUrl(req, page + 1, limit);
    links.last = createPageUrl(req, totalPages, limit);
  }

  return links;
};

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (req: Request, res: any, next: any) => {
  const { page, limit } = req.query;
  
  if (page && isNaN(Number(page))) {
    return next(new BadRequestException('Page must be a number'));
  }
  
  if (limit && isNaN(Number(limit))) {
    return next(new BadRequestException('Limit must be a number'));
  }
  
  if (req.query.sortOrder && !['ASC', 'DESC'].includes((req.query.sortOrder as string).toUpperCase())) {
    return next(new BadRequestException("sortOrder must be either 'ASC' or 'DESC'"));
  }
  
  next();
};
