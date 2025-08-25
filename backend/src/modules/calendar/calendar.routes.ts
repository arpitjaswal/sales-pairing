import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { authenticate } from '../../common/middleware/authenticate';

export const calendarRouter = Router();
const calendarController = new CalendarController();

// All calendar routes require authentication
calendarRouter.use(authenticate);

// Calendar events
calendarRouter.get('/events', calendarController.getEvents);
calendarRouter.get('/events/:id', calendarController.getEventById);
calendarRouter.post('/events', calendarController.createEvent);
calendarRouter.put('/events/:id', calendarController.updateEvent);
  calendarRouter.delete('/events/:id', calendarController.deleteEvent);

// Availability
calendarRouter.get('/availability', calendarController.getAvailability);
calendarRouter.post('/availability', calendarController.setAvailability);
calendarRouter.put('/availability/:id', calendarController.updateAvailability);
  calendarRouter.delete('/availability/:id', calendarController.deleteAvailability);

// Calendar integration
calendarRouter.get('/integrations', calendarController.getIntegrations);
calendarRouter.post('/integrations/google', calendarController.connectGoogleCalendar);
calendarController.delete('/integrations/google', calendarController.disconnectGoogleCalendar);

export default calendarRouter;
