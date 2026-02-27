import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter;

export function getEmailTransport(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.smtp.host,
      port: env.email.smtp.port,
      secure: env.email.smtp.port === 465,
      auth: {
        user: env.email.smtp.user,
        pass: env.email.smtp.pass,
      },
    });

    // Verify connection on first creation
    transporter.verify((error) => {
      if (error) {
        logger.error('❌ Email transport verification failed:', error);
      } else {
        logger.info('✅ Email transport ready');
      }
    });
  }
  return transporter;
}
