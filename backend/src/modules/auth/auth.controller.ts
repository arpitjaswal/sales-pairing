import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { logger } from '../../common/logger';

export class AuthController {
  private authService = new AuthService();

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const registerDto = plainToInstance(RegisterDto, req.body);
      await validateOrReject(registerDto);

      // Register user
      const result = await this.authService.register({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        timezone: registerDto.timezone,
      });

      // Return success response
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (Array.isArray(error)) {
        // Validation errors
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      // Other errors
      return res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const loginDto = plainToInstance(LoginDto, req.body);
      await validateOrReject(loginDto);

      // Authenticate user
      const result = await this.authService.login(loginDto.email, loginDto.password);

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return success response
      return res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      
      if (Array.isArray(error)) {
        // Validation errors
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      // Authentication failed
      return res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed',
      });
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // Validate refresh token
      const refreshTokenDto = plainToInstance(RefreshTokenDto, { refreshToken });
      await validateOrReject(refreshTokenDto);

      // Refresh tokens
      const tokens = await this.authService.refreshToken(refreshToken);

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return new access token
      return res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      
      if (Array.isArray(error)) {
        // Validation errors
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      // Invalid refresh token
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid refresh token',
      });
    }
  };

  /**
   * Logout user (revoke refresh token)
   */
  logout = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        // Revoke the refresh token
        await this.authService.revokeRefreshToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  };

  /**
   * Verify email with token
   */
  verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
      }

      const result = await this.authService.verifyEmail(token);
      
      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Email verification failed',
      });
    }
  };

  /**
   * Request password reset email
   */
  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const result = await this.authService.sendPasswordResetEmail(email);
      
      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
      });
    }
  };

  /**
   * Reset password with token
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      const resetPasswordDto = plainToInstance(ResetPasswordDto, req.body);
      await validateOrReject(resetPasswordDto);

      const result = await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword
      );
      
      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      
      if (Array.isArray(error)) {
        // Validation errors
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed',
      });
    }
  };

  /**
   * Change password (authenticated)
   */
  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const changePasswordDto = plainToInstance(ChangePasswordDto, req.body);
      await validateOrReject(changePasswordDto);

      const result = await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );
      
      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Change password error:', error);
      
      if (Array.isArray(error)) {
        // Validation errors
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.map(e => ({
            property: e.property,
            constraints: e.constraints,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const authService = new AuthService();
      const user = await authService.getUserProfile(userId);
      
      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
      });
    }
  };
}
