import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { UserRole } from './user.entity';

export const userRouter = Router();
const userController = new UserController();

// All user routes require authentication
userRouter.use(authenticate);

// User profile management
userRouter.get('/profile', userController.getProfile);
userRouter.put('/profile', userController.updateProfile);
userRouter.put('/profile/avatar', userController.updateAvatar);
userRouter.delete('/profile/avatar', userController.deleteAvatar);

// User preferences
userRouter.get('/preferences', userController.getPreferences);
userRouter.put('/preferences', userController.updatePreferences);

// Admin routes (require admin role)
userRouter.use(authorize([UserRole.ADMIN, UserRole.MANAGER]));

// User management
userRouter.get('/', userController.getAllUsers);
userRouter.get('/:id', userController.getUserById);
userRouter.put('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
userRouter.put('/:id/role', userController.updateUserRole);
userRouter.put('/:id/status', userController.updateUserStatus);

// User analytics (admin only)
userRouter.get('/analytics/overview', userController.getUserAnalytics);
userRouter.get('/analytics/activity', userController.getUserActivity);

export default userRouter;
