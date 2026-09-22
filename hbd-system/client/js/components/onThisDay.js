import { formatDate } from '../utils/dateUtils.js';

/**
 * "On This Day" Flashback Card
 */
export function renderOnThisDay(container, memories, onSelectMemory) {
  if (!memories || memories.length === 0) {
    container.innerHTML = '';
    return;
  }

  const memory = memories[0]; // Featured flashback memory
  const photo = (memory.photos && memory.photos.length > 0)
    ? memory.photos[0]
    : '/uploads/PXL_20260616_202304977.jpg';

  container.innerHTML = `
    <div class="on-this-day-card">
      <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
        <div style="width: 90px; height: 90px; border-radius: 8px; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-sm);">
          <img src="${photo}" alt="${memory.title}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

        <div style="flex: 1; min-width: 240px;">
          <div class="on-this-day-badge">
            <span>✨ Flashback · On This Day</span>
          </div>
          <h3 style="font-family: var(--font-hand); font-size: 1.8rem; margin-bottom: 4px; color: var(--plum);">
            ${memory.title}
          </h3>
          <p style="font-size: 0.9rem; color: var(--ink-soft); line-height: 1.4;">
            ${memory.story ? memory.story.substring(0, 110) + '...' : ''}
          </p>
          <div style="margin-top: 8px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--rose-dark);">
            ${formatDate(memory.date)} ${memory.location ? `· 📍 ${memory.location}` : ''}
          </div>
        </div>

        <button class="btn btn-gold" id="btn-view-flashback" style="padding: 8px 18px; font-size: 0.85rem;">
          Relive Memory
        </button>
      </div>
    </div>
  `;

  container.querySelector('#btn-view-flashback')?.addEventListener('click', () => {
    onSelectMemory(memory);
  });
}
