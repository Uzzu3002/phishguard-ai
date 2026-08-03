import express from 'express';
import { listEmails, getEmail, scanInbox } from '../controllers/gmail.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all gmail routes
router.use(requireAuth);

router.get('/emails', listEmails);
router.get('/emails/:id', getEmail);
router.post('/scan', scanInbox);

export default router;
