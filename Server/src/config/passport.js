import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const name = profile.displayName;
                const picture = profile.photos[0]?.value;
                const googleId = profile.id;

                // Check if user exists and is authorized
                let user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    // User not authorized - reject login
                    return done(null, false, { message: 'Usuário não autorizado. Entre em contato com o administrador.' });
                }

                if (!user.isActive) {
                    return done(null, false, { message: 'Usuário desativado. Entre em contato com o administrador.' });
                }

                // Update user info from Google (name, picture, googleId)
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        name,
                        picture,
                        googleId,
                    },
                });

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
