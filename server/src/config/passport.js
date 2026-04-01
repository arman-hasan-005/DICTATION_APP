/**
 * passport.js — Single Google OAuth2 strategy
 *
 * DESIGN: One strategy, one callback URL (easy Google Console setup).
 * Intent (login vs signup) is passed via the OAuth `state` parameter:
 *   /api/auth/google/login  → state: 'login'
 *   /api/auth/google/signup → state: 'signup'
 *
 * The strategy just looks up the user and attaches profile data to req.user.
 * Branching (reject vs create) is handled in the controller based on state.
 *
 * What the strategy returns via done():
 *   Existing user (by googleId)     → the User document
 *   Existing local (by email)       → links googleId, returns User document
 *   New user                        → plain object { isNewGoogleUser, googleId, email, name }
 */

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const {
  googleClientId,
  googleClientSecret,
  clientUrl,
  port,
  isDev,
  backendUrl,
} = require("./env");
const User = require("../models/User");
const logger = require("./logger");

if (googleClientId && googleClientSecret) {
  const callbackURL = isDev
    ? `http://localhost:${port}/api/auth/google/callback`
    : `${backendUrl.replace(/\/$/, "")}/api/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL,
        // passReqToCallback lets us read req.query.state inside the verify fn
        // (not needed here since we read state in the controller, but good practice)
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email)
            return done(new Error("No email returned from Google"), null);

          // 1. Returning Google user
          const byGoogleId = await User.findOne({ googleId: profile.id });
          if (byGoogleId) return done(null, byGoogleId);

          // 2. Existing local-auth account with same email → link it
          const byEmail = await User.findOne({ email });
          if (byEmail) {
            byEmail.googleId = profile.id;
            byEmail.authProvider = "google";
            byEmail.isEmailVerified = true;
            await byEmail.save();
            return done(null, byEmail);
          }

          // 3. No existing account — return profile data; controller decides what to do
          return done(null, {
            isNewGoogleUser: true,
            googleId: profile.id,
            email,
            name: profile.displayName || email.split("@")[0],
          });
        } catch (err) {
          logger.error("Google OAuth strategy error", { error: err.message });
          return done(err, null);
        }
      },
    ),
  );

  logger.info("Google OAuth strategy registered");
} else {
  logger.warn(
    "Google OAuth not configured — GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing",
  );
}

module.exports = passport;
