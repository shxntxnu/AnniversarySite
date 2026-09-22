const config = require('../config/config');
const cryptoService = require('./cryptoService');
const store = require('../db/store');

let clientCredentialsToken = null;
let clientCredentialsTokenExpiry = 0;

/**
 * Get Spotify App-level token using Client Credentials Flow.
 * Used for catalog search without requiring user login.
 */
async function getAppAccessToken() {
  if (!config.spotify.clientId || !config.spotify.clientSecret) {
    return null;
  }

  const now = Date.now();
  if (clientCredentialsToken && now < clientCredentialsTokenExpiry) {
    return clientCredentialsToken;
  }

  const authHeader = Buffer.from(
    `${config.spotify.clientId}:${config.spotify.clientSecret}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify Client Credentials error:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  clientCredentialsToken = data.access_token;
  // Expire 60s early for safety
  clientCredentialsTokenExpiry = now + (data.expires_in - 60) * 1000;
  return clientCredentialsToken;
}

/**
 * Exchange authorization code for access and refresh tokens.
 */
async function exchangeCodeForTokens(code, redirectUri = config.spotify.redirectUri) {
  const authHeader = Buffer.from(
    `${config.spotify.clientId}:${config.spotify.clientSecret}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || config.spotify.redirectUri
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Spotify token exchange failed: ${err}`);
  }

  return response.json();
}

/**
 * Refresh user's access token using stored encrypted refresh token.
 */
async function refreshUserAccessToken() {
  const user = await store.getUser();
  if (!user || !user.spotifyRefreshTokenEncrypted) {
    return null;
  }

  let refreshToken;
  try {
    refreshToken = cryptoService.decrypt(user.spotifyRefreshTokenEncrypted);
  } catch (err) {
    console.error('Failed to decrypt Spotify refresh token:', err);
    return null;
  }

  const authHeader = Buffer.from(
    `${config.spotify.clientId}:${config.spotify.clientSecret}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    // If revoked, clear it
    if (response.status === 400 || response.status === 401) {
      console.warn('Spotify refresh token was revoked or invalid. Clearing...');
      await store.updateUser({
        spotifyRefreshTokenEncrypted: null,
        spotifyConnected: false
      });
    }
    return null;
  }

  const data = await response.json();

  // If a new refresh token was returned, update it
  if (data.refresh_token) {
    const encryptedNew = cryptoService.encrypt(data.refresh_token);
    await store.updateUser({
      spotifyRefreshTokenEncrypted: encryptedNew,
      spotifyConnected: true
    });
  }

  return data.access_token;
}

/**
 * Search Spotify catalog for tracks by query string.
 */
async function searchTracks(query) {
  if (!query || !query.trim()) return [];

  // Try app token first, fallback to user token
  let token = await getAppAccessToken();
  if (!token) {
    token = await refreshUserAccessToken();
  }

  if (!token) {
    console.warn('Spotify search: No valid access token available (check SPOTIFY_CLIENT_ID).');
    return [];
  }

  const searchUrl = `https://api.spotify.com/v1/search?${new URLSearchParams({
    q: query.trim(),
    type: 'track',
    limit: '8'
  })}`;

  const response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error('Spotify Search API error:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  const tracks = data.tracks?.items || [];

  return tracks.map(t => ({
    id: t.id,
    uri: t.uri,
    name: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album.name,
    albumArt: t.album.images?.[0]?.url || '',
    durationMs: t.duration_ms,
    previewUrl: t.preview_url
  }));
}

module.exports = {
  getAppAccessToken,
  exchangeCodeForTokens,
  refreshUserAccessToken,
  searchTracks
};
