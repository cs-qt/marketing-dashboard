import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { User } from '../models/User';
import { UserRole, AuthMethod } from '@expertmri/shared';
import { logger } from '../utils/logger';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Check if user exists by googleId
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if user exists by email (could be magic link user upgrading)
            user = await User.findOne({ email });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.authMethod = AuthMethod.GOOGLE;
              user.picture = profile.photos?.[0]?.value;
              user.name = profile.displayName || user.name;
              await user.save();
            } else {
              // Create new user
              user = await User.create({
                googleId: profile.id,
                email,
                name: profile.displayName || email.split('@')[0],
                picture: profile.photos?.[0]?.value,
                role: UserRole.CREATOR,
                authMethod: AuthMethod.GOOGLE,
              });
              logger.info(`New user created via Google: ${email}`);
            }
          }

          // Update last login
          user.lastLoginAt = new Date();
          await user.save();

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error);
        }
      }
    )
  );

  // We use JWT, so no session serialization needed
  passport.serializeUser((user: any, done) => done(null, user._id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
