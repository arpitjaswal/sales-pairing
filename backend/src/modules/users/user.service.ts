import { Repository } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserRole } from './user.entity';
import { NotFoundError } from '../../common/errors/not-found-error';
import { BadRequestError } from '../../common/errors/bad-request-error';
import { uploadToS3, deleteFromS3 } from '../../common/utils/file-upload';
import { logger } from '../../common/logger';

export interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: string;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
  usersByStatus: Record<string, number>;
}

export interface UserActivity {
  date: string;
  activeUsers: number;
  newUsers: number;
  sessionsCompleted: number;
}

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id', 'email', 'firstName', 'lastName', 'bio', 'title', 'company',
        'location', 'linkedinUrl', 'timezone', 'phone', 'avatarUrl',
        'isEmailVerified', 'createdAt', 'updatedAt'
      ]
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateDto.email }
      });

      if (existingUser) {
        throw new BadRequestError('Email already exists');
      }
    }

    // Update user fields
    Object.assign(user, updateDto);
    
    const updatedUser = await this.userRepository.save(user);
    
    return this.getProfile(userId);
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    try {
      // Upload new avatar to S3
      const avatarUrl = await uploadToS3(file, 'avatars');

      // Delete old avatar if it exists
      if (user.avatarUrl) {
        await deleteFromS3(user.avatarUrl);
      }

      // Update user avatar URL
      user.avatarUrl = avatarUrl;
      await this.userRepository.save(user);

      return avatarUrl;
    } catch (error) {
      logger.error('Avatar upload error:', error);
      throw new BadRequestError('Failed to upload avatar');
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.avatarUrl) {
      try {
        await deleteFromS3(user.avatarUrl);
        user.avatarUrl = null;
        await this.userRepository.save(user);
      } catch (error) {
        logger.error('Avatar deletion error:', error);
        throw new BadRequestError('Failed to delete avatar');
      }
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'preferences']
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.preferences || {};
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updateDto: UpdatePreferencesDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Merge existing preferences with new ones
    const currentPreferences = user.preferences || {};
    const updatedPreferences = { ...currentPreferences, ...updateDto };

    user.preferences = updatedPreferences;
    await this.userRepository.save(user);

    return updatedPreferences;
  }

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(filters: UserFilters): Promise<{ users: Partial<User>[]; total: number; page: number; limit: number }> {
    const { page, limit, search, role, status } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      if (status === 'active') {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
      } else if (status === 'inactive') {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
      } else if (status === 'verified') {
        queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', { isEmailVerified: true });
      }
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const users = await queryBuilder
      .select([
        'user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.role',
        'user.isActive', 'user.isEmailVerified', 'user.createdAt', 'user.avatarUrl'
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      users,
      total,
      page,
      limit
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user (admin only)
   */
  async updateUser(userId: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateDto.email }
      });

      if (existingUser) {
        throw new BadRequestError('Email already exists');
      }
    }

    Object.assign(user, updateDto);
    return await this.userRepository.save(user);
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete avatar if it exists
    if (user.avatarUrl) {
      try {
        await deleteFromS3(user.avatarUrl);
      } catch (error) {
        logger.error('Failed to delete avatar during user deletion:', error);
      }
    }

    await this.userRepository.remove(user);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.role = role;
    return await this.userRepository.save(user);
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, status: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    switch (status) {
      case 'active':
        user.isActive = true;
        break;
      case 'inactive':
        user.isActive = false;
        break;
      case 'verified':
        user.isEmailVerified = true;
        break;
      default:
        throw new BadRequestError('Invalid status');
    }

    return await this.userRepository.save(user);
  }

  /**
   * Get user analytics (admin only)
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    
    const newUsersThisMonth = await this.userRepository.count({
      where: {
        createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const usersByStatus = {
      active: await this.userRepository.count({ where: { isActive: true } }),
      inactive: await this.userRepository.count({ where: { isActive: false } }),
      verified: await this.userRepository.count({ where: { isEmailVerified: true } }),
      unverified: await this.userRepository.count({ where: { isEmailVerified: false } })
    };

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = parseInt(curr.count);
        return acc;
      }, {} as Record<UserRole, number>),
      usersByStatus
    };
  }

  /**
   * Get user activity (admin only)
   */
  async getUserActivity(days: number = 30): Promise<UserActivity[]> {
    const activities: UserActivity[] = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Generate activity data for each day
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const nextDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));

      const activeUsers = await this.userRepository.count({
        where: {
          lastActiveAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      const newUsers = await this.userRepository.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      // TODO: Add sessions completed count when session module is implemented
      const sessionsCompleted = 0;

      activities.push({
        date: date.toISOString().split('T')[0],
        activeUsers,
        newUsers,
        sessionsCompleted
      });
    }

    return activities;
  }
}
