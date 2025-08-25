import { Router } from 'express';
import { GamificationController } from './gamification.controller';
import { authenticate } from '../../common/middleware/authenticate';

export const gamificationRouter = Router();
const gamificationController = new GamificationController();

// All gamification routes require authentication
gamificationRouter.use(authenticate);

// User achievements and badges
gamificationRouter.get('/badges', gamificationController.getUserBadges);
gamificationRouter.get('/badges/:id', gamificationController.getBadgeById);
gamificationRouter.get('/achievements', gamificationController.getUserAchievements);
gamificationRouter.get('/achievements/:id', gamificationController.getAchievementById);

// Leaderboards
gamificationRouter.get('/leaderboards', gamificationController.getLeaderboards);
gamificationRouter.get('/leaderboards/:type', gamificationController.getLeaderboardByType);
gamificationRouter.get('/leaderboards/:type/position', gamificationController.getUserLeaderboardPosition);

// Points and rewards
gamificationRouter.get('/points', gamificationController.getUserPoints);
gamificationRouter.get('/points/history', gamificationController.getPointsHistory);
gamificationRouter.get('/rewards', gamificationController.getAvailableRewards);
gamificationRouter.post('/rewards/:id/redeem', gamificationController.redeemReward);

// Progress tracking
gamificationRouter.get('/progress', gamificationController.getUserProgress);
gamificationRouter.get('/progress/:skillId', gamificationController.getSkillProgress);
gamificationRouter.get('/stats', gamificationController.getUserStats);

export default gamificationRouter;
