const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config/config');
const store = require('./db/store');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const spotifyRoutes = require('./routes/spotifyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();

// Basic Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Static Files: Uploaded photos & media
app.use('/uploads', express.static(config.paths.uploadsDir));

// Static Files: Client frontend
app.use(express.static(config.paths.clientDir));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv
  });
});

// Single-Page Application (SPA) HTML fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  res.sendFile(path.join(config.paths.clientDir, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Initialize DB and start server
async function startServer() {
  try {
    await store.initStore();
    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(` Birthday Memory Site System v1`);
      console.log(` Running at: http://localhost:${config.port}`);
      console.log(` Default credentials: username '${config.admin.username}'`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(`======================================================\n`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
