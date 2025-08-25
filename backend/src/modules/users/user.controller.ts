import { Request, Response } from 'express';
import { UserService } from './user.service';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { logger } from '../../common/logger';
import { UserRole } from './user.entity';

export class UserController {
  private userService = new UserService();

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const profile = await this.userService.getProfile(userId);
      
      return res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get profile',
      });
    }
  };

  /**
   * Update current user profile
   */
  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const updateDto = plainToInstance(UpdateProfileDto, req.body);
      await validateOrReject(updateDto);

      const updatedProfile = await this.userService.updateProfile(userId, updateDto);
      
      return res.json({
        success: true,
        data: updatedProfile,
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      
      if (Array.isArray(error)) {
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
        message: error.message || 'Failed to update profile',
      });
    }
  };

  /**
   * Update user avatar
   */
  updateAvatar = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const avatarUrl = await this.userService.updateAvatar(userId, file);
      
      return res.json({
        success: true,
        data: { avatarUrl },
      });
    } catch (error) {
      logger.error('Update avatar error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update avatar',
      });
    }
  };

  /**
   * Delete user avatar
   */
  deleteAvatar = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      await this.userService.deleteAvatar(userId);
      
      return res.json({
        success: true,
        message: 'Avatar deleted successfully',
      });
    } catch (error) {
      logger.error('Delete avatar error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete avatar',
      });
    }
  };

  /**
   * Get user preferences
   */
  getPreferences = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const preferences = await this.userService.getPreferences(userId);
      
      return res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      logger.error('Get preferences error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get preferences',
      });
    }
  };

  /**
   * Update user preferences
   */
  updatePreferences = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const updateDto = plainToInstance(UpdatePreferencesDto, req.body);
      await validateOrReject(updateDto);

      const updatedPreferences = await this.userService.updatePreferences(userId, updateDto);
      
      return res.json({
        success: true,
        data: updatedPreferences,
      });
    } catch (error) {
      logger.error('Update preferences error:', error);
      
      if (Array.isArray(error)) {
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
        message: error.message || 'Failed to update preferences',
      });
    }
  };

  /**
   * Get all users (admin only)
   */
  getAllUsers = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, role, status } = req.query;
      const users = await this.userService.getAllUsers({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as UserRole,
        status: status as string,
      });
      
      return res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get users',
      });
    }
  };

  /**
   * Get user by ID (admin only)
   */
  getUserById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
  };

  /**
   * Update user (admin only)
   */
  updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateDto = plainToInstance(UpdateUserDto, req.body);
      await validateOrReject(updateDto);

      const updatedUser = await this.userService.updateUser(id, updateDto);
      
      return res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Update user error:', error);
      
      if (Array.isArray(error)) {
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
        message: error.message || 'Failed to update user',
      });
    }
  };

  /**
   * Delete user (admin only)
   */
  deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      
      return res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
      });
    }
  };

  /**
   * Update user role (admin only)
   */
  updateUserRole = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }

      const updatedUser = await this.userService.updateUserRole(id, role);
      
      return res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user role',
      });
    }
  };

  /**
   * Update user status (admin only)
   */
  updateUserStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedUser = await this.userService.updateUserStatus(id, status);
      
      return res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Update user status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status',
      });
    }
  };

  /**
   * Get user analytics overview (admin only)
   */
  getUserAnalytics = async (req: Request, res: Response) => {
    try {
      const analytics = await this.userService.getUserAnalytics();
      
      return res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Get user analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user analytics',
      });
    }
  };

  /**
   * Get user activity (admin only)
   */
  getUserActivity = async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      const activity = await this.userService.getUserActivity(Number(days));
      
      return res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      logger.error('Get user activity error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user activity',
      });
    }
  };
}
