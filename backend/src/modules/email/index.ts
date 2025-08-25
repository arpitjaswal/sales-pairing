import { EmailService } from './email.service';

export { EmailService };

// Export any other email-related types or utilities here
export * from './email.types';

// Default export for easier imports
const emailService = new EmailService();
export default emailService;
