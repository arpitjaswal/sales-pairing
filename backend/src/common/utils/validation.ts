import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { BadRequestException } from '../../common/exceptions';
import { sanitize } from 'class-sanitizer';

/**
 * Validates the given data against the provided DTO class
 * @param dtoClass The DTO class to validate against
 * @param data The data to validate
 * @param options Optional validation options
 * @returns A promise that resolves to the validated and transformed data
 * @throws BadRequestException if validation fails
 */
export const validateDto = async <T extends object>(
  dtoClass: ClassConstructor<T>,
  data: any,
  options: ValidatorOptions = {}
): Promise<T> => {
  // Default validation options
  const defaultOptions: ValidatorOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
    ...options,
  };

  // Transform plain object to class instance
  const dto = plainToInstance(dtoClass, data);

  // Sanitize the data
  sanitize(dto);

  // Validate the data
  const errors = await validate(dto as object, defaultOptions);

  // If there are validation errors, format and throw them
  if (errors.length > 0) {
    const formattedErrors = formatValidationErrors(errors);
    throw new BadRequestException('Validation failed', formattedErrors);
  }

  return dto;
};

/**
 * Formats validation errors into a more user-friendly format
 * @param errors Array of validation errors
 * @returns Object with field names as keys and error messages as values
 */
const formatValidationErrors = (errors: ValidationError[]): Record<string, string[]> => {
  const formattedErrors: Record<string, string[]> = {};

  for (const error of errors) {
    if (error.constraints) {
      formattedErrors[error.property] = Object.values(error.constraints);
    }

    // Handle nested objects
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatValidationErrors(error.children);
      for (const [nestedKey, nestedValue] of Object.entries(nestedErrors)) {
        formattedErrors[`${error.property}.${nestedKey}`] = nestedValue;
      }
    }
  }

  return formattedErrors;
};

/**
 * Validates a string against common injection patterns
 * @param input The string to validate
 * @returns boolean indicating if the input is safe
 */
export const isSafeString = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  
  // List of potentially dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript URLs
    /on\w+\s*=/gi, // Inline event handlers
    /eval\(/gi, // eval() function
    /document\./gi, // Document object access
    /window\./gi, // Window object access
    /<iframe/gi, // Iframe tags
    /<object/gi, // Object tags
    /<embed/gi, // Embed tags
    /<link/gi, // Link tags
    /<meta/gi, // Meta tags
    /<form/gi, // Form tags
    /<input/gi, // Input tags
    /<button/gi, // Button tags
    /<select/gi, // Select tags
    /<textarea/gi, // Textarea tags
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitizes a string by removing potentially dangerous content
 * @param input The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  
  // Remove JavaScript event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["\'][^"\']*["\']/gi, '');
  
  // Remove JavaScript URLs
  sanitized = sanitized.replace(/javascript:[^\s"']*/gi, '');
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\s+(?:href|src|style|class|id|on\w+)\s*=\s*["\'][^"\']*["\']/gi, '');
  
  return sanitized.trim();
};

/**
 * Validates an email address
 * @param email The email to validate
 * @returns boolean indicating if the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  if (typeof email !== 'string') return false;
  
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email);
};

/**
 * Validates a password against security requirements
 * @param password The password to validate
 * @returns Object with validation results
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a UUID
 * @param uuid The UUID to validate
 * @returns boolean indicating if the UUID is valid
 */
export const isValidUuid = (uuid: string): boolean => {
  if (typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates a URL
 * @param url The URL to validate
 * @returns boolean indicating if the URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  if (typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates a date string
 * @param date The date string to validate
 * @returns boolean indicating if the date is valid
 */
export const isValidDate = (date: string | Date): boolean => {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validates a timezone string
 * @param timezone The timezone to validate
 * @returns boolean indicating if the timezone is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  if (typeof timezone !== 'string') return false;
  
  try {
    // This will throw if the timezone is invalid
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
};
