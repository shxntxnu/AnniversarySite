// In-memory failed login tracking for brute-force deterrence
const failedAttempts = new Map();

const MAX_FREE_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // 1 minute window

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const record = failedAttempts.get(ip);
  const now = Date.now();

  if (record) {
    // Reset if cooldown has passed
    if (now - record.lastAttempt > COOLDOWN_MS) {
      failedAttempts.delete(ip);
    } else if (record.count >= MAX_FREE_ATTEMPTS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - record.lastAttempt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Please wait ${waitSeconds} seconds before trying again.`
      });
    }
  }

  // Attach helper to record failure
  res.recordFailedLogin = () => {
    const cur = failedAttempts.get(ip) || { count: 0, lastAttempt: now };
    cur.count += 1;
    cur.lastAttempt = Date.now();
    failedAttempts.set(ip, cur);
  };

  res.recordSuccessfulLogin = () => {
    failedAttempts.delete(ip);
  };

  next();
}

module.exports = {
  loginRateLimiter
};
