import { Router } from 'express';
import { MatchingController } from './matching.controller';
import { authenticate } from '../../common/middleware/authenticate';

export const matchingRouter = Router();
const matchingController = new MatchingController();

// All routes require authentication
matchingRouter.use(authenticate);

// Get available users for matching
matchingRouter.get('/users/available', matchingController.getAvailableUsers.bind(matchingController));

// Update user availability
matchingRouter.put('/users/availability', matchingController.updateAvailability.bind(matchingController));

// Start random matching
matchingRouter.post('/random', matchingController.startRandomMatching.bind(matchingController));

// Invite specific user
matchingRouter.post('/invite', matchingController.inviteUser.bind(matchingController));

// Accept invitation
matchingRouter.post('/invitations/:requestId/accept', matchingController.acceptInvitation.bind(matchingController));

// Decline invitation
matchingRouter.post('/invitations/:requestId/decline', matchingController.declineInvitation.bind(matchingController));

// Get pending invitations
matchingRouter.get('/invitations/pending', matchingController.getPendingInvitations.bind(matchingController));

// End practice session
matchingRouter.put('/sessions/:sessionId/end', matchingController.endSession.bind(matchingController));

// Get leaderboard
matchingRouter.get('/leaderboard', matchingController.getLeaderboard.bind(matchingController));

// Get user statistics
matchingRouter.get('/users/stats', matchingController.getUserStats.bind(matchingController));

// Cancel match request
matchingRouter.delete('/requests/:requestId', matchingController.cancelMatchRequest.bind(matchingController));

export default matchingRouter;
