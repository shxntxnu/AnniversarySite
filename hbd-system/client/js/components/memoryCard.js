import { formatDate } from '../utils/dateUtils.js';

/**
 * Polaroid Memory Card Component
 */
export function createMemoryCard(memory, onSelect) {
  const card = document.createElement('div');
  card.className = 'polaroid-card';
  card.dataset.id = memory.id;

  // Slight organic tilt for polaroid scrapbook feel
  const rot = (Math.random() * 3 - 1.5).toFixed(1);
  card.style.transform = `rotate(${rot}deg)`;

  const coverPhoto = (memory.photos && memory.photos.length > 0)
    ? memory.photos[0]
    : '/uploads/PXL_20260616_202304977.jpg';

  const hasSong = Boolean(memory.song);

  card.innerHTML = `
    <div class="tape-corner"></div>
    <div class="polaroid-frame">
      <img src="${coverPhoto}" alt="${memory.title}" loading="lazy" />
    </div>

    <div class="polaroid-caption">
      <div class="polaroid-date">${formatDate(memory.date)}</div>
      <h3 class="polaroid-title">${memory.title}</h3>
      <p class="polaroid-story-snippet">${memory.story || ''}</p>

      <div class="polaroid-footer">
        ${
          memory.location
            ? `<span class="badge-location">📍 ${memory.location}</span>`
            : `<span></span>`
        }

        ${
          hasSong
            ? `<span class="badge-song" title="Song attached: ${memory.song.name} - ${memory.song.artist}">
                🎵 ${memory.song.name}
              </span>`
            : ''
        }
      </div>
    </div>
  `;

  card.addEventListener('click', () => onSelect(memory));
  return card;
}
