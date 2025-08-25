import sgMail from '@sendgrid/mail';
import { config } from '../../config';
import { logger } from '../../common/logger';

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  constructor() {
    sgMail.setApiKey(config.email.sendgridApiKey);
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const template = await this.getEmailTemplate(emailData.template, emailData.context);
      
      const msg = {
        to: emailData.to,
        from: config.email.from,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await sgMail.send(msg);
      logger.info(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: { email: string; firstName: string; lastName: string }): Promise<void> {
    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Sales Pairing Platform',
      template: 'welcome',
      context: {
        firstName: user.firstName,
        lastName: user.lastName,
        loginUrl: `${config.app.frontendUrl}/login`,
      },
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(user: { email: string; firstName: string }, token: string): Promise<void> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;
    
    await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'verify-email',
      context: {
        firstName: user.firstName,
        verificationUrl,
        expiryHours: 24,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: { email: string; firstName: string }, token: string): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      template: 'reset-password',
      context: {
        firstName: user.firstName,
        resetUrl,
        expiryHours: 1,
      },
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChangedEmail(user: { email: string; firstName: string }): Promise<void> {
    await this.sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      template: 'password-changed',
      context: {
        firstName: user.firstName,
        loginUrl: `${config.app.frontendUrl}/login`,
        supportEmail: config.email.support,
      },
    });
  }

  /**
   * Send session invitation
   */
  async sendSessionInvitation(
    user: { email: string; firstName: string },
    session: { id: string; title: string; startTime: Date; duration: number }
  ): Promise<void> {
    const sessionUrl = `${config.app.frontendUrl}/sessions/${session.id}`;
    
    await this.sendEmail({
      to: user.email,
      subject: `Session Invitation: ${session.title}`,
      template: 'session-invitation',
      context: {
        firstName: user.firstName,
        sessionTitle: session.title,
        sessionUrl,
        startTime: session.startTime.toLocaleString(),
        duration: session.duration,
      },
    });
  }

  /**
   * Send session reminder
   */
  async sendSessionReminder(
    user: { email: string; firstName: string },
    session: { id: string; title: string; startTime: Date }
  ): Promise<void> {
    const sessionUrl = `${config.app.frontendUrl}/sessions/${session.id}`;
    
    await this.sendEmail({
      to: user.email,
      subject: `Reminder: ${session.title} starts soon`,
      template: 'session-reminder',
      context: {
        firstName: user.firstName,
        sessionTitle: session.title,
        sessionUrl,
        startTime: session.startTime.toLocaleString(),
      },
    });
  }

  /**
   * Get email template with context
   */
  private async getEmailTemplate(templateName: string, context: Record<string, any>): Promise<EmailTemplate> {
    // In a real implementation, you would load templates from files or a template engine
    // For now, we'll use simple string templates
    
    const templates: Record<string, EmailTemplate> = {
      welcome: {
        subject: 'Welcome to Sales Pairing Platform',
        html: `
          <h1>Welcome ${context.firstName}!</h1>
          <p>Thank you for joining the Sales Pairing Platform. We're excited to help you improve your sales skills through roleplay sessions.</p>
          <p><a href="${context.loginUrl}">Get Started</a></p>
        `,
        text: `Welcome ${context.firstName}! Thank you for joining the Sales Pairing Platform. Visit ${context.loginUrl} to get started.`,
      },
      'verify-email': {
        subject: 'Verify Your Email Address',
        html: `
          <h1>Verify Your Email</h1>
          <p>Hi ${context.firstName},</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${context.verificationUrl}">Verify Email</a></p>
          <p>This link will expire in ${context.expiryHours} hours.</p>
        `,
        text: `Hi ${context.firstName}, please verify your email by visiting: ${context.verificationUrl}`,
      },
      'reset-password': {
        subject: 'Reset Your Password',
        html: `
          <h1>Reset Your Password</h1>
          <p>Hi ${context.firstName},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${context.resetUrl}">Reset Password</a></p>
          <p>This link will expire in ${context.expiryHours} hour.</p>
        `,
        text: `Hi ${context.firstName}, reset your password by visiting: ${context.resetUrl}`,
      },
      'password-changed': {
        subject: 'Password Changed Successfully',
        html: `
          <h1>Password Changed</h1>
          <p>Hi ${context.firstName},</p>
          <p>Your password has been changed successfully. If you didn't make this change, please contact support immediately.</p>
          <p><a href="${context.loginUrl}">Login</a></p>
          <p>Support: ${context.supportEmail}</p>
        `,
        text: `Hi ${context.firstName}, your password has been changed. If you didn't make this change, contact support at ${context.supportEmail}`,
      },
      'session-invitation': {
        subject: `Session Invitation: ${context.sessionTitle}`,
        html: `
          <h1>Session Invitation</h1>
          <p>Hi ${context.firstName},</p>
          <p>You've been invited to join a roleplay session:</p>
          <h2>${context.sessionTitle}</h2>
          <p><strong>Start Time:</strong> ${context.startTime}</p>
          <p><strong>Duration:</strong> ${context.duration} minutes</p>
          <p><a href="${context.sessionUrl}">Join Session</a></p>
        `,
        text: `Hi ${context.firstName}, you've been invited to join "${context.sessionTitle}" at ${context.startTime}. Join at: ${context.sessionUrl}`,
      },
      'session-reminder': {
        subject: `Reminder: ${context.sessionTitle} starts soon`,
        html: `
          <h1>Session Reminder</h1>
          <p>Hi ${context.firstName},</p>
          <p>This is a reminder that your session starts soon:</p>
          <h2>${context.sessionTitle}</h2>
          <p><strong>Start Time:</strong> ${context.startTime}</p>
          <p><a href="${context.sessionUrl}">Join Session</a></p>
        `,
        text: `Hi ${context.firstName}, reminder: "${context.sessionTitle}" starts at ${context.startTime}. Join at: ${context.sessionUrl}`,
      },
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    return template;
  }
}
