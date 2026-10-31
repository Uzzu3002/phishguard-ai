import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import aiRoutes from './routes/ai.routes.js';
import './config/googleAuth.js'; // Initialize Passport configuration

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// Interface to listen on: 127.0.0.1 keeps the server local; on the phone set it to the Tailscale IP
const HOST = process.env.HOST; // unset = all interfaces (Node default)

const isProduction = process.env.NODE_ENV === 'production';

// Self-hosted mode (e.g. phone server): Node terminates HTTPS itself and serves the built frontend,
// so the whole app lives on one origin.
const tlsCertFile = process.env.TLS_CERT_FILE;
const tlsKeyFile = process.env.TLS_KEY_FILE;
const useTls = Boolean(tlsCertFile && tlsKeyFile);
const serveFrontend = process.env.SERVE_FRONTEND === 'true';
const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend/dist');

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  console.error('SESSION_SECRET must be set to a random string of at least 32 characters in production.');
  process.exit(1);
}

if (serveFrontend && !fs.existsSync(path.join(frontendDist, 'index.html'))) {
  console.error(`SERVE_FRONTEND is on but ${frontendDist} has no build. Run "npm run build:phone" in frontend/ first.`);
  process.exit(1);
}

// Behind a hosting provider's reverse proxy, trust it so secure cookies work.
// When Node terminates TLS itself there is no proxy, and trusting forwarded headers would let clients spoof them.
app.set('trust proxy', !useTls);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'data:', 'https://*.googleusercontent.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com']
    }
  }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173',
  credentials: true
}));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Setup Session
app.use(session({
  name: 'phishguard.sid',
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction || useTls,
    // Same-origin (frontend served here) only needs 'lax'; a separately hosted frontend needs 'none'
    sameSite: isProduction && !serveFrontend ? 'none' : 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
if (!serveFrontend) {
  app.get('/', (req, res) => {
    res.json({ message: 'PhishGuard AI API is running' });
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);

if (serveFrontend) {
  app.use(express.static(frontendDist, { index: false, maxAge: '7d', immutable: true }));
  // Client-side routes (/dashboard, /email/:id, ...) all load the SPA shell
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const server = useTls
  ? https.createServer({ cert: fs.readFileSync(tlsCertFile), key: fs.readFileSync(tlsKeyFile) }, app)
  : app;

const onListening = () => {
  console.log(`Server running on ${useTls ? 'https' : 'http'}://${HOST || 'localhost'}:${PORT}${serveFrontend ? ' (serving frontend)' : ''}`);
};

if (HOST) server.listen(PORT, HOST, onListening);
else server.listen(PORT, onListening);
