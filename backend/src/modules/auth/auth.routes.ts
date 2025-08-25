import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../common/middleware/authenticate';

export const authRouter = Router();
const authController = new AuthController();

// Public routes
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.get('/verify-email', authController.verifyEmail);

// Protected routes (require authentication)
authRouter.use(authenticate);
authRouter.post('/logout', authController.logout);
authRouter.post('/change-password', authController.changePassword);
authRouter.get('/me', authController.getProfile);

export default authRouter;
