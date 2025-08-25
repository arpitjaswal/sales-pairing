import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../../common/middleware/authenticate';

export const chatRouter = Router();
const chatController = new ChatController();

// All chat routes require authentication
chatRouter.use(authenticate);

// Chat rooms
chatRouter.get('/rooms', chatController.getChatRooms);
chatRouter.get('/rooms/:roomId', chatController.getChatRoom);
chatRouter.post('/rooms', chatController.createChatRoom);

// Messages
chatRouter.get('/rooms/:roomId/messages', chatController.getMessages);
chatRouter.post('/rooms/:roomId/messages', chatController.sendMessage);
chatRouter.put('/messages/:messageId', chatController.updateMessage);
chatRouter.delete('/messages/:messageId', chatController.deleteMessage);

// Message reactions
chatRouter.post('/messages/:messageId/reactions', chatController.addReaction);
chatRouter.delete('/messages/:messageId/reactions/:reactionType', chatController.removeReaction);

// Chat participants
chatRouter.get('/rooms/:roomId/participants', chatController.getParticipants);
chatRouter.post('/rooms/:roomId/participants', chatController.addParticipant);
chatRouter.delete('/rooms/:roomId/participants/:userId', chatController.removeParticipant);

export default chatRouter;
