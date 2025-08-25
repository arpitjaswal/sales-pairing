import { Router } from 'express';
import { FeedbackController } from './feedback.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { UserRole } from '../users/user.entity';

export const feedbackRouter = Router();
const feedbackController = new FeedbackController();

// All feedback routes require authentication
feedbackRouter.use(authenticate);

// Feedback submission and retrieval
feedbackRouter.post('/', feedbackController.submitFeedback);
feedbackRouter.get('/my-feedback', feedbackController.getMyFeedback);
feedbackRouter.get('/:id', feedbackController.getFeedbackById);
feedbackRouter.put('/:id', feedbackController.updateFeedback);
  feedbackRouter.delete('/:id', feedbackController.deleteFeedback);

// Session feedback
feedbackRouter.get('/session/:sessionId', feedbackController.getSessionFeedback);
feedbackRouter.get('/session/:sessionId/average', feedbackController.getSessionAverageRating);

// User feedback
feedbackRouter.get('/user/:userId', feedbackController.getUserFeedback);
feedbackRouter.get('/user/:userId/average', feedbackController.getUserAverageRating);

// Admin routes (require admin role)
feedbackRouter.use(authorize([UserRole.ADMIN, UserRole.MANAGER]));

// Admin feedback management
feedbackRouter.get('/admin/all', feedbackController.getAllFeedback);
feedbackRouter.get('/admin/analytics', feedbackController.getFeedbackAnalytics);
feedbackRouter.put('/admin/:id/moderate', feedbackController.moderateFeedback);

export default feedbackRouter;
