import express from 'express';
import passport from 'passport';
import { googleCallback, logout, getCurrentUser, revokeToken } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/login', passport.authenticate('google', { 
  scope: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/gmail.readonly'
  ],
  accessType: 'offline',
  prompt: 'consent'
}));

router.get('/callback', passport.authenticate('google', { 
  failureRedirect: 'http://localhost:5173/login?error=auth_failed' 
}), googleCallback);

router.post('/logout', logout);
router.post('/revoke', revokeToken);
router.get('/me', getCurrentUser);

export default router;
