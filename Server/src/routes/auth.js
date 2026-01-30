import express from 'express';
import passport from '../config/passport.js';
import { generateToken, getCurrentUser } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', // Force account selection dialog
    accessType: 'offline', // Allow refresh tokens
    session: false,
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}?error=unauthorized`,
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user);

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/callback?token=${token}`);
        } catch (error) {
            console.error('Error generating token:', error);
            res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
        }
    }
);

// Get current user info (protected route)
router.get('/me', authMiddleware, getCurrentUser);

// Logout (client-side only, just for consistency)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout realizado. Remova o token do cliente.' });
});

export default router;
