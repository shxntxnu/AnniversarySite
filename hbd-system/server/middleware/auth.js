const jwt = require('jsonwebtoken');
const config = require('../config/config');
const store = require('../db/store');

async function requireAuth(req, res, next) {
  // Check cookie first, then Authorization header as fallback
  const token = req.cookies[config.jwt.cookieName] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No session token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await store.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid user session'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role || 'viewer',
      spotifyConnected: Boolean(user.spotifyRefreshTokenEncrypted)
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired, please log in again'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid session token'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Admin access required to make changes.'
    });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
