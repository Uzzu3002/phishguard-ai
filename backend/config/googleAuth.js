import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

// Optional comma-separated allow-list; when set, only these Google accounts can sign in
const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/callback`,
    accessType: 'offline', // Request a refresh token
    prompt: 'consent' // Force to get refresh token on every login for development
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        console.warn(`Blocked sign-in attempt from ${email || 'unknown account'} (not in ALLOWED_EMAILS)`);
        return done(null, false);
      }

      // Create user object to store in session
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value,
        tokens: {
          accessToken,
          refreshToken
        }
      };
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});
