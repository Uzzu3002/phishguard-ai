import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/callback`,
    accessType: 'offline', // Request a refresh token
    prompt: 'consent' // Force to get refresh token on every login for development
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
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
      console.log("GOOGLE STRATEGY SUCCESS");
      console.log(user);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  console.log("SERIALIZE USER");
  console.log(user);
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  console.log("DESERIALIZE USER");
  console.log(user);
  done(null, user);
});
