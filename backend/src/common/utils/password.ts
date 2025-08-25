import bcrypt from 'bcryptjs';
import { config } from '../../config';

/**
 * Hashes a password using bcrypt
 * @param password The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(config.auth.saltRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password
 * @param password The plain text password
 * @param hashedPassword The hashed password to compare against
 * @returns A promise that resolves to true if the passwords match, false otherwise
 */
export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Validates password strength
 * @param password The password to validate
 * @returns An object with validation results
 */
export const validatePasswordStrength = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  // Minimum length
  if (password.length < config.auth.passwordMinLength) {
    errors.push(`Password must be at least ${config.auth.passwordMinLength} characters long`);
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generates a random password
 * @param length The length of the password to generate (default: 12)
 * @returns A random password
 */
export const generateRandomPassword = (length = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:;?><,./-=';
  let password = '';
  
  // Ensure at least one character from each character set
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+~`|}{[]\\:;?><,./-=';
  
  // Add one character from each required set
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest of the password with random characters
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password to make it more random
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
