import { AppDataSource } from '../../data-source';
import { User } from '../users/user.entity';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { RefreshToken } from './refresh-token.entity';
import { MoreThan } from 'typeorm';
import { logger } from '../../common/logger';
import { EmailService } from '../email/email.service';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  private emailService = new EmailService();

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ 
      where: { email: userData.email } 
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hash(userData.password, 12);

    // Create user
    const user = this.userRepository.create({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      timezone: userData.timezone || 'UTC',
      isVerified: config.features.enableEmailVerification ? false : true,
    });

    await this.userRepository.save(user);

    // Generate verification token if email verification is enabled
    if (config.features.enableEmailVerification) {
      await this.sendVerificationEmail(user);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'isActive', 'isVerified', 'role', 'firstName', 'lastName', 'lastActiveAt'],
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    // Check if password is correct
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last active time
    user.lastActiveAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  /**
   * Generate access token (JWT)
   */
  private generateAccessToken(user: User): string {
    return sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }
    );
  }

  /**
   * Generate and save refresh token
   */
  private async generateRefreshToken(user: User): Promise<string> {
    // Create a new refresh token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60 * 60 * 24 * 7); // 7 days

    const refreshToken = this.refreshTokenRepository.create({
      token,
      user,
      expiresAt,
      userAgent: 'web', // You can extract this from the request
      ipAddress: '127.0.0.1', // You can extract this from the request
    });

    await this.refreshTokenRepository.save(refreshToken);

    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    // Find the refresh token in the database
    const token = await this.refreshTokenRepository.findOne({
      where: { 
        token: refreshToken,
        expiresAt: MoreThan(new Date()),
        revoked: false,
      },
      relations: ['user'],
    });

    if (!token) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(token.user);
    const newRefreshToken = await this.generateRefreshToken(token.user);

    // Revoke the old refresh token
    await this.revokeRefreshToken(refreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token: string) {
    await this.refreshTokenRepository.update(
      { token },
      { revoked: true, revokedAt: new Date() }
    );
  }

  /**
   * Verify user email with token
   */
  async verifyEmail(token: string) {
    try {
      const payload = verify(token, config.jwt.secret) as { sub: string };
      const user = await this.userRepository.findOne({ 
        where: { id: payload.sub } 
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        return { message: 'Email already verified' };
      }

      user.isVerified = true;
      await this.userRepository.save(user);

      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification error:', error);
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // For security, don't reveal if the email exists or not
      return { message: 'If an account exists with this email, a password reset link has been sent' };
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = sign(
      { sub: user.id },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepository.save(user);

    // Send email
    await this.emailService.sendPasswordReset(user, resetToken);

    return { message: 'Password reset email sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token
      const payload = verify(token, config.jwt.secret) as { sub: string };
      
      // Find user by ID from token
      const user = await this.userRepository.findOne({ 
        where: { 
          id: payload.sub,
          resetPasswordToken: token,
          resetPasswordExpires: MoreThan(new Date()),
        },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Update password
      user.password = await hash(newPassword, 12);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.userRepository.save(user);

      // Revoke all refresh tokens
      await this.revokeAllUserRefreshTokens(user.id);

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = await hash(newPassword, 12);
    await this.userRepository.save(user);

    // Revoke all refresh tokens
    await this.revokeAllUserRefreshTokens(user.id);

    return { message: 'Password changed successfully' };
  }

  /**
   * Send email verification
   */
  private async sendVerificationEmail(user: User) {
    const verificationToken = sign(
      { sub: user.id },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    await this.emailService.sendVerification(user, verificationToken);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  private async revokeAllUserRefreshTokens(userId: string) {
    await this.refreshTokenRepository.update(
      { user: { id: userId }, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );
  }

  /**
   * Sanitize user object before sending to client
   */
  private sanitizeUser(user: User): Partial<User> {
    const { password, resetPasswordToken, resetPasswordExpires, ...userData } = user;
    return userData;
  }
}
