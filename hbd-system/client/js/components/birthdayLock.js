import { state } from '../state.js';
import { isTodayBirthday } from '../utils/dateUtils.js';
import { launchConfetti } from '../utils/dom.js';

let forcedPreview = false;

/**
 * Date-Gated Birthday Celebration Section (Section 5, Step 3)
 */
export function renderBirthdaySection(container) {
  const { personalConfig } = state.get();
  const bMonth = personalConfig?.birthday?.month || 9;
  const bDay = personalConfig?.birthday?.day || 21;
  const partner = personalConfig?.partnerName || 'My Love';

  const isBday = isTodayBirthday(bMonth, bDay) || forcedPreview;

  if (!isBday) {
    // Render locked teaser with preview toggle
    container.innerHTML = `
      <div style="text-align: center; margin: 40px auto; padding: 24px; background: rgba(59, 31, 43, 0.04); border: 1px dashed var(--thread); border-radius: var(--radius-lg); max-width: 680px;">
        <div style="font-size: 2rem; margin-bottom: 6px;">🔒</div>
        <h4 style="font-family: var(--font-hand); font-size: 1.8rem; color: var(--plum);">A Birthday Surprise Is Waiting...</h4>
        <p style="font-size: 0.88rem; color: var(--ink-soft);">
          This secret celebration automatically unlocks on ${bMonth}/${bDay}!
        </p>
        ${
          state.get().user?.role === 'admin'
            ? `<button id="btn-preview-birthday" style="margin-top: 12px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--rose-dark); background: none; border: 1px solid rgba(180, 72, 91, 0.3); border-radius: var(--radius-pill); padding: 5px 14px; cursor: pointer;">
                🔓 Preview Birthday Reveal (Admin Test)
              </button>`
            : ''
        }
      </div>
    `;

    if (state.get().user?.role === 'admin') {
      container.querySelector('#btn-preview-birthday')?.addEventListener('click', () => {
        forcedPreview = true;
        launchConfetti();
        renderBirthdaySection(container);
      });
    }
    return;
  }

  // Unlocked Celebration Section!
  const bTitle = personalConfig?.birthday?.title || 'Happy Birthday, My Love! 🎂';
  const bLetter = personalConfig?.birthday?.letter || 'Happy Birthday to the most special person in the world!';
  const bQuote = personalConfig?.birthday?.quote || 'In all the world, there is no heart for me like yours.';

  container.innerHTML = `
    <div class="birthday-section">
      <div style="font-size: 3.5rem; margin-bottom: 8px;">🎂 ✨ 🌹</div>
      <span class="eyebrow" style="color: var(--rose-dark); font-size: 0.82rem;">Today Is Your Day</span>
      <h2 class="birthday-title">${bTitle}</h2>

      <div class="birthday-letter-box">
        <p style="margin-bottom: 16px;">Dear ${partner},</p>
        <p style="white-space: pre-wrap;">${bLetter}</p>
        <div class="birthday-quote">"${bQuote}"</div>
      </div>

      <div style="margin-top: 24px;">
        <button id="btn-retrigger-confetti" class="btn btn-primary">
          🎉 Throw More Confetti!
        </button>
      </div>
    </div>
  `;

  container.querySelector('#btn-retrigger-confetti')?.addEventListener('click', () => {
    launchConfetti();
  });
}
