const express = require('express');
const router = express.Router();
const config = require('../config/config');
const spotifyService = require('../services/spotifyService');
const cryptoService = require('../services/cryptoService');
const store = require('../db/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/spotify/login - Redirect to Spotify OAuth
router.get('/login', (req, res) => {
  if (!config.spotify.clientId) {
    return res.status(400).send('Spotify is not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.');
  }

  // Detect host to support both localhost and 127.0.0.1 seamlessly
  const host = req.get('host');
  const protocol = req.protocol || 'http';
  let redirectUri = config.spotify.redirectUri;
  if (host && (host.startsWith('localhost:') || host.startsWith('127.0.0.1:'))) {
    redirectUri = `${protocol}://${host}/api/spotify/callback`;
  }

  const state = Math.random().toString(36).substring(7);

  // Store the exact redirect URI used so the callback exchanges with the identical URI
  res.cookie('spotify_auth_redirect_uri', redirectUri, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
    sameSite: 'lax'
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.spotify.clientId,
    scope: config.spotify.scopes,
    redirect_uri: redirectUri,
    state
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// GET /api/spotify/callback - OAuth redirect handler
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const redirectUri = req.cookies?.spotify_auth_redirect_uri || config.spotify.redirectUri;
  res.clearCookie('spotify_auth_redirect_uri');

  if (error || !code) {
    console.error('Spotify auth error:', error);
    return res.redirect('/?spotify_error=' + encodeURIComponent(error || 'Access denied'));
  }

  try {
    const tokenData = await spotifyService.exchangeCodeForTokens(code, redirectUri);

    if (tokenData.refresh_token) {
      const encrypted = cryptoService.encrypt(tokenData.refresh_token);
      await store.updateUser({
        spotifyRefreshTokenEncrypted: encrypted,
        spotifyConnected: true,
        spotifyConnectedAt: new Date().toISOString()
      });
    }

    return res.redirect('/?spotify_connected=true');
  } catch (err) {
    console.error('Spotify callback exchange error:', err);
    return res.redirect('/?spotify_error=exchange_failed');
  }
});

// GET /api/spotify/token - Get fresh access token for Web Playback SDK
router.get('/token', requireAuth, async (req, res, next) => {
  try {
    const token = await spotifyService.refreshUserAccessToken();
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Spotify not connected or could not refresh token'
      });
    }

    return res.json({
      success: true,
      accessToken: token
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/spotify/search - Search tracks for memory attachment (admin only)
router.get('/search', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ success: true, tracks: [] });
    }

    const tracks = await spotifyService.searchTracks(query);
    return res.json({
      success: true,
      tracks
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/spotify/disconnect - Disconnect Spotify account (admin only)
router.post('/disconnect', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await store.updateUser({
      spotifyRefreshTokenEncrypted: null,
      spotifyConnected: false
    });

    return res.json({
      success: true,
      message: 'Spotify disconnected'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
