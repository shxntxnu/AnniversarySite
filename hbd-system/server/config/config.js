require('dotenv').config();
const path = require('path');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_development_mode_only_123',
    expiresIn: '7d',
    cookieName: 'hbd_token'
  },

  crypto: {
    // 32-byte key hex string
    keyHex: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  },

  admin: {
    username: process.env.ADMIN_USERNAME || 'love',
    password: process.env.ADMIN_PASSWORD || 'password123'
  },

  viewer: {
    username: process.env.VIEWER_USERNAME || 'rubina',
    password: process.env.VIEWER_PASSWORD || 'love123'
  },

  personal: {
    partnerName: process.env.PARTNER_NAME || 'My Love',
    yourName: process.env.YOUR_NAME || 'Me',
    relationshipStartDate: process.env.RELATIONSHIP_START_DATE || '2026-03-21T00:00:00',
    birthdayMonth: parseInt(process.env.PARTNER_BIRTHDAY_MONTH || '9', 10),
    birthdayDay: parseInt(process.env.PARTNER_BIRTHDAY_DAY || '21', 10),
    birthdayNote: process.env.BIRTHDAY_NOTE || 'Happy Birthday to the most special person! Every day with you is a gift.'
  },

  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback',
    scopes: [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-modify-playback-state',
      'user-read-playback-state'
    ].join(' ')
  },

  mongodb: {
    uri: process.env.MONGODB_URI || ''
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },

  paths: {
    uploadsDir: path.join(__dirname, '..', '..', 'uploads'),
    clientDir: path.join(__dirname, '..', '..', 'client'),
    dataDir: path.join(__dirname, '..', 'data')
  }
};

module.exports = config;
