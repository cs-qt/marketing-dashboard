import crypto from 'crypto';
import { MagicLink } from '../models';
import { User, IUser } from '../models';
import { env } from '../config/env';
import { sendEmail } from './email.service';
import { UserRole, AuthMethod } from '@expertmri/shared';
import { logger } from '../utils/logger';

/**
 * Generates a magic link token, saves to DB, and sends email.
 * Returns the token (useful for testing).
 */
export async function generateMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.magicLink.expiryMinutes * 60 * 1000);

  await MagicLink.create({ email: email.toLowerCase().trim(), token, expiresAt });

  const verifyUrl = `${env.clientUrl}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Sign in to ExpertMRI Dashboard',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; padding: 40px 0;">
        <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #065F46, #134E4A); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #fff; font-size: 24px;">📊</span>
            </div>
            <h1 style="font-size: 20px; color: #111827; margin: 0;">Sign in to ExpertMRI</h1>
          </div>
          <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 32px;">
            Click the button below to sign in to your dashboard. This link expires in ${env.magicLink.expiryMinutes} minutes.
          </p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #111827; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Sign In →
            </a>
          </div>
          <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5;">
            If you didn't request this link, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #F3F4F6; margin: 24px 0;" />
          <p style="font-size: 11px; color: #D1D5DB; text-align: center;">
            ExpertMRI Marketing Dashboard | © Quadrant Technology
          </p>
        </div>
      </body>
      </html>
    `,
  });

  logger.info(`Magic link sent to ${email}`);
  return token;
}

/**
 * Verifies a magic link token. Returns the user if valid.
 */
export async function verifyMagicLink(token: string): Promise<IUser> {
  const magicLink = await MagicLink.findOne({
    token,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!magicLink) {
    throw new Error('Invalid or expired magic link');
  }

  // Find or create user
  let user = await User.findOne({ email: magicLink.email });

  if (!user) {
    user = await User.create({
      email: magicLink.email,
      name: magicLink.email.split('@')[0],
      role: UserRole.REVIEWER,
      authMethod: AuthMethod.MAGIC_LINK,
    });
    logger.info(`New reviewer created via magic link: ${magicLink.email}`);
  }

  // Mark token as used
  magicLink.usedAt = new Date();
  magicLink.userId = user._id;
  await magicLink.save();

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  return user;
}
