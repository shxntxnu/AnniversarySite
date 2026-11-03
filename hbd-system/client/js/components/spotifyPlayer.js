/**
 * Spotify Player: 100% Static Responsive Player
 * Uses Spotify's official interactive embed iframe + direct Spotify app linking.
 * Works natively in any static hosting environment without requiring backend server tokens.
 */

export function renderSpotifyPlayer(container, song) {
  if (!song || (!song.id && !song.uri)) {
    container.innerHTML = '';
    return;
  }

  // Extract clean track ID
  let trackId = song.id;
  if (!trackId && song.uri) {
    trackId = song.uri.replace('spotify:track:', '');
  }

  const spotifyDirectUrl = `https://open.spotify.com/track/${trackId}`;

  container.innerHTML = `
    <div class="player-wrapper" style="margin-top: 18px; background: rgba(59, 31, 43, 0.04); border: 1px solid var(--paper-border); border-radius: var(--radius-md); padding: 14px;">
      <div id="player-status" style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-soft); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          <span style="color: #1DB954; font-size: 1rem;">●</span>
          <strong>Attached Melody:</strong> ${song.name || 'Song'} — ${song.artist || 'Artist'}
        </span>
        <a href="${spotifyDirectUrl}" target="_blank" rel="noopener noreferrer" class="btn-spotify" style="text-decoration: none; padding: 4px 12px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 6px;">
          <span>Open in Spotify ↗</span>
        </a>
      </div>

      <div class="spotify-embed-container" style="border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm);">
        <iframe
          src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allowfullscreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style="border-radius: 12px; display: block; border: none;">
        </iframe>
      </div>
    </div>
  `;
}
