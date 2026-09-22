import { state } from '../state.js';
import { calculateTimeTogether, calculateYearProgress } from '../utils/dateUtils.js';

let counterInterval = null;

export function renderStatsHeader(container, { onAddMemory, onOpenSettings, onLogout }) {
  const { user, personalConfig } = state.get();
  const partner = personalConfig?.partnerName || 'My Love';
  const me = personalConfig?.yourName || 'Me';
  const startDate = personalConfig?.relationshipStartDate || '2026-03-21T00:00:00';

  const { percent, daysToNext } = calculateYearProgress(startDate);
  const spotifyConnected = user?.spotifyConnected;

  container.innerHTML = `
    <!-- Top Navigation -->
    <header class="top-nav">
      <div class="site-logo">
        <span>🌹</span>
        <span>${partner} & ${me}</span>
      </div>

      <div class="nav-actions">
        ${
          user?.role === 'admin'
            ? `<button id="btn-add-memory" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem;">
                + Add Memory
              </button>`
            : ''
        }

        <button id="btn-logout" class="btn-icon" title="Logout">
          🚪
        </button>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <span class="eyebrow">Our Living Story</span>
      <h1 class="hero-title">Every Moment <span>With You</span></h1>
      <p class="hero-sub">From the very first coffee to every laughter in between.</p>

      <!-- Ticket Stub Live Counter -->
      <div class="ticket-stub">
        <div class="stub-unit">
          <div class="stub-val" id="cnt-days">00</div>
          <div class="stub-lbl">Days</div>
        </div>
        <div class="stub-divider">:</div>
        <div class="stub-unit">
          <div class="stub-val" id="cnt-hours">00</div>
          <div class="stub-lbl">Hours</div>
        </div>
        <div class="stub-divider">:</div>
        <div class="stub-unit">
          <div class="stub-val" id="cnt-mins">00</div>
          <div class="stub-lbl">Mins</div>
        </div>
        <div class="stub-divider">:</div>
        <div class="stub-unit">
          <div class="stub-val" id="cnt-secs">00</div>
          <div class="stub-lbl">Secs</div>
        </div>
      </div>

      <!-- Year Progress Bar -->
      <div class="year-progress-wrapper">
        <div class="progress-labels">
          <span>This Year's Journey</span>
          <span>${percent}% · ${daysToNext} days to our milestone</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    </section>
  `;

  // Start live tick counter
  function updateTicks() {
    const { days, hours, mins, secs } = calculateTimeTogether(startDate);
    const dEl = container.querySelector('#cnt-days');
    const hEl = container.querySelector('#cnt-hours');
    const mEl = container.querySelector('#cnt-mins');
    const sEl = container.querySelector('#cnt-secs');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  updateTicks();
  if (counterInterval) clearInterval(counterInterval);
  counterInterval = setInterval(updateTicks, 1000);

  // Bind Buttons
  container.querySelector('#btn-add-memory')?.addEventListener('click', onAddMemory);
  container.querySelector('#btn-logout')?.addEventListener('click', onLogout);
}
