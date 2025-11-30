const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Login page (public)
app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Login POST handler
app.post('/auth/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  try {
    const passwordHash = process.env.PASSWORD_HASH;
    const isValid = await bcrypt.compare(password, passwordHash);
    
    if (isValid) {
      req.session.authenticated = true;
      req.session.loginTime = new Date();
      return res.json({ success: true, redirect: '/' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout handler
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Serve static files ONLY if authenticated
app.use('/css', requireAuth, express.static(path.join(__dirname, '../public/css')));
app.use('/js', requireAuth, express.static(path.join(__dirname, '../public/js')));
app.use('/assets', requireAuth, express.static(path.join(__dirname, '../public/assets')));

// Protected routes
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/index.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/pages/:page', requireAuth, (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '../public/pages', page);
  
  // Prevent directory traversal
  if (!filePath.startsWith(path.join(__dirname, '../public/pages'))) {
    return res.status(403).send('Access denied');
  }
  
  res.sendFile(filePath);
});

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', authenticated: !!req.session.authenticated });
});

// 404 handler
app.use((req, res) => {
  if (req.session && req.session.authenticated) {
    res.status(404).send('<h1>404 - Page Not Found</h1><a href="/">Go to Home</a>');
  } else {
    res.redirect('/login');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔒 Secure Documentation Server running on http://localhost:${PORT}`);
  console.log(`📚 Access the documentation at http://localhost:${PORT}`);
  console.log(`🔐 Default password: admin123 (CHANGE THIS IN .env FILE!)`);
  console.log(`\n⚠️  IMPORTANT: Update SESSION_SECRET and PASSWORD_HASH in .env file before deployment!`);
});

module.exports = app;
