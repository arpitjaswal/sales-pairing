/**
 * Types and interfaces for the email service
 */

export interface EmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename?: string;
  content?: string | Buffer;
  path?: string;
  href?: string;
  contentType?: string;
  encoding?: string;
  raw?: string | Buffer;
  cid?: string;
}

export interface SendEmailResult {
  messageId: string;
  envelope: {
    from: string;
    to: string[];
  };
  accepted: string[];
  rejected: string[];
  pending?: string[];
  response: string;
  envelopeTime?: number;
  messageTime?: number;
  messageSize?: number;
}

export interface EmailTemplateData {
  name: string;
  [key: string]: any;
}

export interface VerificationEmailData extends EmailTemplateData {
  verificationUrl: string;
}

export interface PasswordResetEmailData extends EmailTemplateData {
  resetUrl: string;
  expiryHours: number;
}

export interface WelcomeEmailData extends EmailTemplateData {
  loginUrl: string;
  helpCenterUrl?: string;
}

export interface AccountLockedEmailData extends EmailTemplateData {
  unlockUrl: string;
}

export interface SessionReminderEmailData extends EmailTemplateData {
  sessionDetails: {
    title: string;
    date: string;
    time: string;
    timezone: string;
    duration: string;
    joinUrl: string;
  };
}

export interface MatchNotificationEmailData extends EmailTemplateData {
  matchDetails: {
    matchName: string;
    matchAvatar?: string;
    matchBio?: string;
    commonInterests?: string[];
    messagePreview?: string;
    profileUrl: string;
    startChatUrl: string;
  };
}
