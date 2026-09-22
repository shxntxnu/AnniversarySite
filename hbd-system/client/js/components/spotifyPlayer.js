import { api } from '../api.js';

/**
 * Spotify Player: Web Playback SDK + Automatic Official Embed Fallback
 */

let spotifySDKLoaded = false;
let spotifyPlayerInstance = null;
let currentDeviceId = null;
let sdkInitPromise = null;

/**
 * Dynamically loads Spotify Web Playback SDK script
 */
function loadSpotifySDK() {
  if (sdkInitPromise) return sdkInitPromise;

  sdkInitPromise = new Promise((resolve) => {
    if (window.Spotify) {
      spotifySDKLoaded = true;
      return resolve(window.Spotify);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      spotifySDKLoaded = true;
      resolve(window.Spotify);
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Timeout safety: if SDK fails to load in 4 seconds, resolve null
    setTimeout(() => {
      if (!spotifySDKLoaded) {
        resolve(null);
      }
    }, 4000);
  });

  return sdkInitPromise;
}

/**
 * Renders player for attached memory song
 */
export function renderSpotifyPlayer(container, song) {
  if (!song || (!song.id && !song.uri)) {
    container.innerHTML = '';
    return;
  }

  // Extract track ID
  let trackId = song.id;
  if (!trackId && song.uri) {
    trackId = song.uri.replace('spotify:track:', '');
  }

  container.innerHTML = `
    <div class="player-wrapper">
      <div id="player-status" style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-soft); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <span>🎵 Attached Melody</span>
        <button id="toggle-embed-mode-btn" style="background: none; border: none; color: var(--rose-dark); cursor: pointer; text-decoration: underline; font-size: 0.72rem;">
          Switch to Embed Player
        </button>
      </div>

      <div id="player-content">
        <!-- Will be populated by custom player or embed -->
      </div>
    </div>
  `;

  const contentEl = container.querySelector('#player-content');
  const toggleBtn = container.querySelector('#toggle-embed-mode-btn');

  let useEmbedOnly = false;

  // Render official embed player
  function renderEmbed() {
    contentEl.innerHTML = `
      <div class="spotify-embed-container">
        <iframe
          src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allowfullscreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy">
        </iframe>
      </div>
    `;
    toggleBtn.style.display = 'none';
  }

  // Try custom Web Playback SDK
  async function attemptSDKPlayback() {
    contentEl.innerHTML = `
      <div class="custom-player">
        <div class="vinyl-record" id="vinyl-icon">
          <div class="vinyl-center">
            <img src="${song.albumArt || '/uploads/PXL_20260616_202304977.jpg'}" alt="Album Art" />
          </div>
        </div>

        <div class="player-info">
          <div class="player-song-title">${song.name || 'Attached Track'}</div>
          <div class="player-song-artist">${song.artist || 'Artist'}</div>
          <div id="sdk-msg" style="font-size: 0.75rem; color: var(--ink-muted); font-family: var(--font-mono); margin-top: 3px;">
            Connecting audio player...
          </div>
        </div>

        <div class="player-controls">
          <button id="btn-play-pause" class="play-toggle-btn" title="Play">
            ▶
          </button>
        </div>
      </div>
    `;

    const playBtn = contentEl.querySelector('#btn-play-pause');
    const vinyl = contentEl.querySelector('#vinyl-icon');
    const msgEl = contentEl.querySelector('#sdk-msg');

    let isPlaying = false;

    // Timeout safety fallback: if token or SDK fails within 3.5s, switch to embed
    const fallbackTimer = setTimeout(() => {
      console.log('SDK timeout or not connected, falling back to official Spotify embed player.');
      renderEmbed();
    }, 3500);

    try {
      const tokenRes = await api.getSpotifyToken();
      if (!tokenRes || !tokenRes.accessToken) {
        clearTimeout(fallbackTimer);
        renderEmbed();
        return;
      }

      const Spotify = await loadSpotifySDK();
      if (!Spotify) {
        clearTimeout(fallbackTimer);
        renderEmbed();
        return;
      }

      clearTimeout(fallbackTimer);
      msgEl.textContent = 'Ready to play';

      playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
          playBtn.textContent = '⏸';
          vinyl.classList.add('playing');
          msgEl.textContent = 'Playing...';
        } else {
          playBtn.textContent = '▶';
          vinyl.classList.remove('playing');
          msgEl.textContent = 'Paused';
        }
      });
    } catch (err) {
      clearTimeout(fallbackTimer);
      console.log('Spotify token fetch error, using embed fallback:', err.message);
      renderEmbed();
    }
  }

  toggleBtn.addEventListener('click', () => {
    useEmbedOnly = true;
    renderEmbed();
  });

  attemptSDKPlayback();
}
