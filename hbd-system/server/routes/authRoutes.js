const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const store = require('../db/store');
const { requireAuth } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      if (res.recordFailedLogin) res.recordFailedLogin();
      return res.status(400).json({
        success: false,
        error: 'Incorrect username or password'
      });
    }

    const user = await store.getUserByUsername(username);

    if (!user) {
      if (res.recordFailedLogin) res.recordFailedLogin();
      return res.status(401).json({
        success: false,
        error: 'Incorrect username or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      if (res.recordFailedLogin) res.recordFailedLogin();
      return res.status(401).json({
        success: false,
        error: 'Incorrect username or password'
      });
    }

    if (res.recordSuccessfulLogin) res.recordSuccessfulLogin();

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set httpOnly cookie
    res.cookie(config.jwt.cookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'viewer',
        spotifyConnected: Boolean(user.spotifyRefreshTokenEncrypted)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    sameSite: 'lax'
  });
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await store.getUserById(req.user.id);
    const personalCfg = await store.getPersonalConfig();

    return res.json({
      success: true,
      user: {
        id: user?.id || req.user.id,
        username: user?.username || req.user.username,
        role: user?.role || req.user.role || 'viewer',
        spotifyConnected: Boolean(user?.spotifyRefreshTokenEncrypted)
      },
      personal: personalCfg
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
