import { api } from './api.js';
import { state } from './state.js';
import { renderLoginView } from './components/authView.js';
import { renderStatsHeader } from './components/statsHeader.js';
import { renderOnThisDay } from './components/onThisDay.js';
import { renderTimelineView } from './components/timelineView.js';
import { openMemoryDetail } from './components/memoryDetail.js';
import { openMemoryModal } from './components/memoryModal.js';
import { renderBirthdaySection } from './components/birthdayLock.js';
import { renderInteractiveExtras } from './components/interactiveExtras.js';
import { openSettingsModal } from './components/settingsModal.js';
import { showToast } from './components/toast.js';

const appEl = document.getElementById('app');

/**
 * Initialize application (100% Static Mode)
 */
async function initApp() {
  // Check for Spotify query params if redirected
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('spotify_connected')) {
    showToast('Spotify connected successfully! 🎶', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Verify active stored session
  try {
    const res = await api.getMe();
    if (res.success && res.user) {
      state.set({
        isAuthenticated: true,
        user: res.user,
        personalConfig: res.personal
      });
      await loadDashboard();
      return;
    }
  } catch (err) {
    // Not authenticated, show login form
  }

  showLogin();
}

/**
 * Render Login Screen
 */
function showLogin() {
  state.set({ isAuthenticated: false, user: null });
  renderLoginView(appEl, async () => {
    // On login success:
    const meRes = await api.getMe();
    state.set({
      isAuthenticated: true,
      user: meRes.user,
      personalConfig: meRes.personal
    });
    await loadDashboard();
  });
}

/**
 * Load Dashboard & Memory Data
 */
async function loadDashboard() {
  const user = state.get().user;
  const isAdmin = user?.role === 'admin';

  appEl.innerHTML = `
    <div class="container">
      <div id="stats-slot"></div>
      <div id="birthday-slot"></div>
      <div id="on-this-day-slot"></div>
      <div id="timeline-slot"></div>
      <div id="extras-slot"></div>
    </div>
    ${
      isAdmin
        ? `<button id="fab-add-btn" class="fab-add" title="Add Memory">
            <span>+</span> <span>Add Memory</span>
          </button>`
        : ''
    }
  `;

  // Bind floating add button if admin
  if (isAdmin) {
    appEl.querySelector('#fab-add-btn')?.addEventListener('click', handleAddMemory);
  }

  await refreshMemoriesAndStats();
}

/**
 * Refresh memory data and render components
 */
async function refreshMemoriesAndStats() {
  const statsSlot = document.getElementById('stats-slot');
  const birthdaySlot = document.getElementById('birthday-slot');
  const onThisDaySlot = document.getElementById('on-this-day-slot');
  const timelineSlot = document.getElementById('timeline-slot');
  const extrasSlot = document.getElementById('extras-slot');

  if (!statsSlot) return;

  // Render Header & Live Counters
  renderStatsHeader(statsSlot, {
    onAddMemory: handleAddMemory,
    onLogout: handleLogout
  });

  // Render Birthday Reveal Section (Date-gated to Rubina's birthday, Nov 13)
  renderBirthdaySection(birthdaySlot);

  try {
    // Fetch memories & flashback from static engine
    const [memoriesRes, otdRes] = await Promise.all([
      api.getMemories('asc'),
      api.getOnThisDay()
    ]);

    const memories = memoriesRes.data || [];
    const otdMemories = otdRes.data || [];

    state.set({ memories, onThisDayMemories: otdMemories });

    // Render "On this day" / featured flashback
    renderOnThisDay(onThisDaySlot, otdMemories, handleSelectMemory);

    // Render Timeline
    renderTimelineView(timelineSlot, memories, handleSelectMemory);

    // Render Interactive Keepsakes (Reasons, Coupons, Quiz)
    if (extrasSlot) {
      renderInteractiveExtras(extrasSlot);
    }
  } catch (err) {
    console.error('Error rendering dashboard:', err);
    timelineSlot.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--rose-dark);">
        <p>Could not load memories. Please refresh the page.</p>
      </div>
    `;
  }
}

/**
 * Handler: View memory details
 */
function handleSelectMemory(memory) {
  openMemoryDetail(memory, {
    onEdit: (mem) => openMemoryModal(mem, () => refreshMemoriesAndStats()),
    onDelete: async (id) => {
      try {
        await api.deleteMemory(id);
        showToast('Memory deleted', 'info');
        await refreshMemoriesAndStats();
      } catch (err) {
        showToast('Failed to delete memory', 'error');
      }
    }
  });
}

/**
 * Handler: Add memory
 */
function handleAddMemory() {
  openMemoryModal(null, () => refreshMemoriesAndStats());
}

/**
 * Handler: Open settings
 */
function handleOpenSettings() {
  openSettingsModal(() => refreshMemoriesAndStats());
}

/**
 * Handler: Logout
 */
async function handleLogout() {
  try {
    await api.logout();
    showToast('Signed out. See you soon ❤️');
  } catch (e) {
    // ignore
  }
  showLogin();
}

// Global Event: Re-calculate live elements on tab focus
window.addEventListener('focus', () => {
  if (state.get().isAuthenticated) {
    const statsSlot = document.getElementById('stats-slot');
    const birthdaySlot = document.getElementById('birthday-slot');
    if (statsSlot) {
      renderStatsHeader(statsSlot, {
        onAddMemory: handleAddMemory,
        onOpenSettings: handleOpenSettings,
        onLogout: handleLogout
      });
    }
    if (birthdaySlot) {
      renderBirthdaySection(birthdaySlot);
    }
  }
});

// Global Event: Session expired
window.addEventListener('session-expired', () => {
  showToast('Session expired, please sign in again', 'error');
  showLogin();
});

// Boot app
initApp();
