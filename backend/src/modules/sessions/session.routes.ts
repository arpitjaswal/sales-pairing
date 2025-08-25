import { Router } from 'express';
import { SessionController } from './session.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { UserRole } from '../users/user.entity';
import { uploadSingleFile } from '../../common/utils/file-upload';

export const sessionRouter = Router();
const sessionController = new SessionController();

// All session routes require authentication
sessionRouter.use(authenticate);

// Session management
sessionRouter.get('/', sessionController.getAllSessions);
sessionRouter.get('/my-sessions', sessionController.getMySessions);
sessionRouter.get('/:id', sessionController.getSessionById);
sessionRouter.post('/', sessionController.createSession);
sessionRouter.put('/:id', sessionController.updateSession);
sessionRouter.delete('/:id', sessionController.deleteSession);

// Session participation
sessionRouter.post('/:id/join', sessionController.joinSession);
sessionRouter.post('/:id/leave', sessionController.leaveSession);
sessionRouter.post('/:id/start', sessionController.startSession);
sessionRouter.post('/:id/end', sessionController.endSession);

// Session recording
sessionRouter.post('/:id/recording/start', sessionController.startRecording);
sessionRouter.post('/:id/recording/stop', sessionController.stopRecording);
sessionRouter.post('/:id/recording/upload', uploadSingleFile('recording'), sessionController.uploadRecording);

// Session feedback
sessionRouter.post('/:id/feedback', sessionController.submitFeedback);
sessionRouter.get('/:id/feedback', sessionController.getSessionFeedback);

// Session analytics
sessionRouter.get('/:id/analytics', sessionController.getSessionAnalytics);

// Admin routes (require admin role)
sessionRouter.use(authorize([UserRole.ADMIN, UserRole.MANAGER]));

// Admin session management
sessionRouter.get('/admin/all', sessionController.getAllSessionsAdmin);
sessionRouter.put('/:id/status', sessionController.updateSessionStatus);
sessionRouter.post('/:id/assign-participants', sessionController.assignParticipants);

export default sessionRouter;
