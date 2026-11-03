import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate } from '../utils/dateUtils.js';

/**
 * Authentication View: Login Form + Emotional Welcome Splash
 */

export function renderLoginView(container, onLoginSuccess) {
  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
      <div class="modal-card" style="max-width: 440px; text-align: center; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--paper-border);">
        <div style="font-size: 3rem; margin-bottom: 8px;">🌹</div>
        <p class="eyebrow" style="letter-spacing: 0.2em; color: var(--rose-dark);">A Private Romantic Keepsake</p>
        <h2 style="font-family: var(--font-hand); font-size: 2.8rem; color: var(--rose-dark); margin-bottom: 8px;">Welcome, Love</h2>
        <p style="font-size: 0.95rem; color: var(--ink-soft); margin-bottom: 24px; font-style: italic;">
          Please sign in to unlock our story and memories.
        </p>

        <!-- Sweet sign-in card hint -->
        <div style="background: rgba(180, 72, 91, 0.08); border: 1px dashed var(--rose); padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.82rem; color: var(--rose-dark); margin-bottom: 20px; font-family: var(--font-mono); text-align: left;">
          <div>🗝️ <strong>Quick Access:</strong></div>
          <div style="margin-top: 3px;">Username: <code>rubina</code> &middot; Password: <code>love123</code></div>
        </div>

        <form id="login-form">
          <div id="login-error" style="display: none; background: var(--rose-light); color: var(--rose-dark); padding: 10px; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 18px; border: 1px solid rgba(180, 72, 91, 0.2);"></div>

          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="login-username">Username</label>
            <input type="text" id="login-username" class="form-input" required autocomplete="username" value="rubina" placeholder="e.g. rubina" />
          </div>

          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" required autocomplete="current-password" value="love123" placeholder="Enter password (love123)" />
          </div>

          <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 14px; padding: 14px; font-size: 1.05rem;">
            Open Memories ✨
          </button>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');
  const submitBtn = container.querySelector('#login-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening memories...';

    const username = form.querySelector('#login-username').value;
    const password = form.querySelector('#login-password').value;

    try {
      const res = await api.login(username, password);
      if (res.success) {
        // Trigger welcome splash screen (Section 1 step 6)
        showWelcomeSplash(() => {
          onLoginSuccess(res.user);
        }, res.user);
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Incorrect username or password';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Open Memories ✨';
    }
  });
}

/**
 * Section 1, Step 6: Emotional welcome splash screen
 */
export function showWelcomeSplash(onFinish, user = null) {
  const currentConfig = state.get().personalConfig;
  const partner = currentConfig?.partnerName || 'Rubina';
  const me = currentConfig?.yourName || 'Shantanu';

  let greeting = currentConfig?.greetingSplash || 'Hi love, welcome back ❤️';
  if (user?.role === 'viewer' || user?.username?.toLowerCase() === 'rubina') {
    greeting = `Hi ${partner}, welcome back ❤️`;
  } else if (user?.role === 'admin') {
    greeting = `Hi ${me}, welcome back ❤️`;
  }
  const todayStr = formatDate(new Date().toISOString());

  const splash = document.createElement('div');
  splash.className = 'splash-screen';
  splash.innerHTML = `
    <div style="font-size: 3.5rem; margin-bottom: 12px; animation: splashScale 1s ease;">✨</div>
    <h1 class="splash-greeting">${greeting}</h1>
    <div class="splash-date">${todayStr}</div>
  `;

  document.body.appendChild(splash);

  // Hold for 2.2 seconds then fade out smoothly
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
      if (onFinish) onFinish();
    }, 800);
  }, 2200);
}
