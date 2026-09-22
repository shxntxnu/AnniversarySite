import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from './toast.js';

/**
 * Settings Modal: Customize Names, Dates, Birthday Letter, and Love Quotes
 */
export function openSettingsModal(onSaveSuccess) {
  let backdrop = document.getElementById('settings-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'settings-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }

  const { personalConfig } = state.get();

  const partnerName = personalConfig?.partnerName || 'My Love';
  const yourName = personalConfig?.yourName || 'Me';
  const startDate = personalConfig?.relationshipStartDate || '2026-03-21T00:00:00';
  const bMonth = personalConfig?.birthday?.month || 9;
  const bDay = personalConfig?.birthday?.day || 21;
  const greetingSplash = personalConfig?.greetingSplash || 'Hi love, welcome back ❤️';
  const birthdayTitle = personalConfig?.birthday?.title || 'A Special Birthday Letter Just For You 🎂';
  const birthdayLetter = personalConfig?.birthday?.letter || '';
  const birthdayQuote = personalConfig?.birthday?.quote || '';

  backdrop.innerHTML = `
    <div class="modal-card">
      <button class="modal-close-btn" id="btn-close-settings">✕</button>

      <div style="margin-bottom: 24px;">
        <span class="eyebrow">Personalization</span>
        <h2 style="font-family: var(--font-hand); font-size: 2.4rem; color: var(--rose-dark);">
          Customize Our Details
        </h2>
        <p style="font-size: 0.88rem; color: var(--ink-soft); margin-top: 4px;">
          Update names, relationship milestones, and special quotes anytime.
        </p>
      </div>

      <form id="settings-form">
        <!-- Names -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="cfg-partner">Partner's Name / Nickname</label>
            <input type="text" id="cfg-partner" class="form-input" required value="${partnerName}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="cfg-your">Your Name</label>
            <input type="text" id="cfg-your" class="form-input" required value="${yourName}" />
          </div>
        </div>

        <!-- Relationship Start Date -->
        <div class="form-group">
          <label class="form-label" for="cfg-start-date">Relationship Start Date (Live counter starts here)</label>
          <input type="datetime-local" id="cfg-start-date" class="form-input" value="${startDate.substring(0, 16)}" />
        </div>

        <!-- Birthday Date -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="cfg-bday-month">Partner's Birthday Month (1-12)</label>
            <input type="number" id="cfg-bday-month" min="1" max="12" class="form-input" required value="${bMonth}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="cfg-bday-day">Partner's Birthday Day (1-31)</label>
            <input type="number" id="cfg-bday-day" min="1" max="31" class="form-input" required value="${bDay}" />
          </div>
        </div>

        <!-- Greeting Splash -->
        <div class="form-group">
          <label class="form-label" for="cfg-splash">Login Welcome Splash Text</label>
          <input type="text" id="cfg-splash" class="form-input" value="${greetingSplash}" />
        </div>

        <!-- Birthday Letter -->
        <div class="form-group">
          <label class="form-label" for="cfg-bday-letter">Special Birthday Letter / Message</label>
          <textarea id="cfg-bday-letter" class="form-textarea" rows="4">${birthdayLetter}</textarea>
        </div>

        <!-- Birthday Quote -->
        <div class="form-group">
          <label class="form-label" for="cfg-bday-quote">Birthday Love Quote</label>
          <input type="text" id="cfg-bday-quote" class="form-input" value="${birthdayQuote}" />
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-settings">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-settings">Save Details</button>
        </div>
      </form>
    </div>
  `;

  function close() {
    backdrop.classList.remove('active');
  }

  backdrop.querySelector('#btn-close-settings')?.addEventListener('click', close);
  backdrop.querySelector('#btn-cancel-settings')?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  const form = backdrop.querySelector('#settings-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = form.querySelector('#btn-save-settings');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const updates = {
      partnerName: form.querySelector('#cfg-partner').value.trim(),
      yourName: form.querySelector('#cfg-your').value.trim(),
      relationshipStartDate: form.querySelector('#cfg-start-date').value,
      greetingSplash: form.querySelector('#cfg-splash').value.trim(),
      birthday: {
        month: parseInt(form.querySelector('#cfg-bday-month').value, 10),
        day: parseInt(form.querySelector('#cfg-bday-day').value, 10),
        title: birthdayTitle,
        letter: form.querySelector('#cfg-bday-letter').value.trim(),
        quote: form.querySelector('#cfg-bday-quote').value.trim()
      }
    };

    try {
      const res = await api.updateConfig(updates);
      state.set({ personalConfig: res.data });
      showToast('Personal details updated ✨', 'success');
      close();
      if (onSaveSuccess) onSaveSuccess(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Details';
    }
  });

  backdrop.classList.add('active');
}
