import { getEmailTransport } from '../config/email';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getEmailTransport();
    await transport.sendMail({
      from: `"ExpertMRI Dashboard" <${env.email.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
}
