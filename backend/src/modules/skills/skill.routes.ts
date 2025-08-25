import { Router } from 'express';
import { SkillController } from './skill.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { UserRole } from '../users/user.entity';

export const skillRouter = Router();
const skillController = new SkillController();

// All skill routes require authentication
skillRouter.use(authenticate);

// Skills management
skillRouter.get('/', skillController.getAllSkills);
skillRouter.get('/my-skills', skillController.getMySkills);
skillRouter.get('/:id', skillController.getSkillById);
skillRouter.post('/assess', skillController.assessSkill);
skillRouter.put('/:id/progress', skillController.updateSkillProgress);

// Skill categories
skillRouter.get('/categories', skillController.getSkillCategories);
skillRouter.get('/categories/:categoryId', skillController.getSkillsByCategory);

// Skill assessments
skillRouter.get('/assessments', skillController.getSkillAssessments);
skillRouter.get('/assessments/:id', skillController.getAssessmentById);
skillRouter.post('/assessments', skillController.createAssessment);
skillRouter.put('/assessments/:id', skillController.updateAssessment);

// Admin routes (require admin role)
skillRouter.use(authorize([UserRole.ADMIN, UserRole.MANAGER]));

// Admin skill management
skillRouter.post('/', skillController.createSkill);
skillRouter.put('/:id', skillController.updateSkill);
  skillRouter.delete('/:id', skillController.deleteSkill);
skillRouter.post('/categories', skillController.createSkillCategory);
skillRouter.put('/categories/:id', skillController.updateSkillCategory);
  skillRouter.delete('/categories/:id', skillController.deleteSkillCategory);

export default skillRouter;
