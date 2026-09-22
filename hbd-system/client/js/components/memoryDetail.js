import { state } from '../state.js';
import { formatDate } from '../utils/dateUtils.js';
import { renderSpotifyPlayer } from './spotifyPlayer.js';

/**
 * Memory Detail Modal with Lightbox Photo Carousel & Spotify Player
 */
export function openMemoryDetail(memory, { onEdit, onDelete, onClose }) {
  const isAdmin = state.get().user?.role === 'admin';

  // Existing modal check
  let backdrop = document.getElementById('detail-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'detail-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }

  const photos = Array.isArray(memory.photos) && memory.photos.length > 0
    ? memory.photos
    : ['/uploads/PXL_20260616_202304977.jpg'];

  backdrop.innerHTML = `
    <div class="modal-card">
      <button class="modal-close-btn" id="btn-close-detail" title="Close">✕</button>

      <!-- Lightbox Photo Carousel -->
      <div class="carousel-container" id="carousel-box">
        ${photos.map((src, idx) => `
          <div class="carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <img src="${src}" alt="Memory photo ${idx + 1}" />
          </div>
        `).join('')}

        ${photos.length > 1 ? `
          <button class="carousel-btn prev" id="btn-prev-photo">‹</button>
          <button class="carousel-btn next" id="btn-next-photo">›</button>
          <div class="carousel-dots" id="carousel-dots">
            ${photos.map((_, idx) => `
              <div class="carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Memory Information -->
      <div style="margin-top: 18px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <span class="eyebrow" style="margin-bottom: 0;">${formatDate(memory.date)}</span>
          ${memory.location ? `<span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--rose-dark);">📍 ${memory.location}</span>` : ''}
        </div>

        <h2 style="font-family: var(--font-hand); font-size: 2.5rem; color: var(--plum); margin: 8px 0 16px;">
          ${memory.title}
        </h2>

        <div style="font-size: 1.05rem; line-height: 1.7; color: var(--ink); white-space: pre-wrap; font-style: italic; background: var(--paper); padding: 18px 20px; border-radius: var(--radius-md); border-left: 3px solid var(--rose);">
          ${memory.story || 'No story notes added.'}
        </div>

        <!-- Spotify Song Player Container -->
        <div id="memory-player-slot"></div>

        <!-- Action Buttons (Admin Only) -->
        ${
          isAdmin
            ? `<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 20px; border-top: 1px dashed var(--thread);">
                <button class="btn btn-secondary" id="btn-delete-mem" style="color: var(--rose-dark); border-color: rgba(180, 72, 91, 0.3);">
                  🗑 Delete Memory
                </button>

                <div style="display: flex; gap: 10px;">
                  <button class="btn btn-primary" id="btn-edit-mem">
                    ✏️ Edit Memory & Music
                  </button>
                </div>
              </div>`
            : ''
        }
      </div>
    </div>
  `;

  // Carousel controls
  let activeSlide = 0;
  const slides = backdrop.querySelectorAll('.carousel-slide');
  const dots = backdrop.querySelectorAll('.carousel-dot');

  function showSlide(index) {
    if (slides.length <= 1) return;
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === activeSlide));
    dots.forEach((d, i) => d.classList.toggle('active', i === activeSlide));
  }

  backdrop.querySelector('#btn-prev-photo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showSlide(activeSlide - 1);
  });

  backdrop.querySelector('#btn-next-photo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showSlide(activeSlide + 1);
  });

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      showSlide(parseInt(dot.dataset.index, 10));
    });
  });

  // Render song player if attached
  if (memory.song) {
    const playerSlot = backdrop.querySelector('#memory-player-slot');
    renderSpotifyPlayer(playerSlot, memory.song);
  }

  // Close logic
  function close() {
    backdrop.classList.remove('active');
    if (onClose) onClose();
  }

  backdrop.querySelector('#btn-close-detail')?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  // Edit / Delete logic
  backdrop.querySelector('#btn-edit-mem')?.addEventListener('click', () => {
    close();
    if (onEdit) onEdit(memory);
  });

  backdrop.querySelector('#btn-delete-mem')?.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete "${memory.title}"?`)) {
      close();
      if (onDelete) onDelete(memory.id);
    }
  });

  // Reveal modal
  backdrop.classList.add('active');
}
