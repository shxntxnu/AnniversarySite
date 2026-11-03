import { state } from '../state.js';
import { launchConfetti } from '../utils/dom.js';

/**
 * Interactive Romantic Keepsake Extras:
 * - 30 Reasons Why I Love You
 * - Redeemable Love Coupons
 * - Relationship Trivia Quiz
 */

export function renderInteractiveExtras(container) {
  const { personalConfig } = state.get();
  const partner = personalConfig?.partnerName || 'Rubina';
  const reasons = personalConfig?.reasonsToLove || [];
  const coupons = personalConfig?.coupons || [];
  const quiz = personalConfig?.quiz || [];

  container.innerHTML = `
    <div class="interactive-extras-section" style="margin: 60px auto 40px; max-width: 960px;">
      
      <!-- Section Divider -->
      <div style="text-align: center; margin-bottom: 40px;">
        <span class="eyebrow">Little Things That Mean Everything</span>
        <h2 style="font-family: var(--font-hand); font-size: clamp(2.6rem, 6vw, 3.8rem); color: var(--plum);">
          Reasons, Keepsakes & Fun
        </h2>
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
          <button id="tab-reasons" class="btn btn-secondary active-tab" style="padding: 7px 18px; font-size: 0.85rem;">
            💌 30 Reasons
          </button>
          <button id="tab-coupons" class="btn btn-secondary" style="padding: 7px 18px; font-size: 0.85rem;">
            🎟️ Love Coupons
          </button>
          <button id="tab-quiz" class="btn btn-secondary" style="padding: 7px 18px; font-size: 0.85rem;">
            ✨ Pop Quiz
          </button>
        </div>
      </div>

      <!-- Tab 1: 30 Reasons -->
      <div id="content-reasons" class="extra-tab-content">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          ${reasons.map((reason, i) => `
            <div class="reason-card" style="background: var(--paper-card); border: 1px solid var(--paper-border); border-radius: var(--radius-md); padding: 18px 20px; box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; position: relative;">
              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--rose-dark); margin-bottom: 8px; font-weight: 700;">
                #${String(i + 1).padStart(2, '0')} · REASON
              </div>
              <p style="font-size: 0.96rem; line-height: 1.5; color: var(--ink); margin: 0; font-family: var(--font-display);">
                "${reason}"
              </p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tab 2: Love Coupons -->
      <div id="content-coupons" class="extra-tab-content" style="display: none;">
        <p style="text-align: center; font-style: italic; color: var(--ink-soft); margin-bottom: 24px;">
          Click any voucher to redeem it anytime, no expiration date! 🌹
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 18px;">
          ${coupons.map((coupon) => `
            <div class="coupon-ticket" data-id="${coupon.id}" style="background: var(--paper); border: 2px dashed var(--thread); border-radius: 12px; padding: 22px 20px; position: relative; cursor: pointer; transition: all 0.2s ease; box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="background: var(--rose); color: #FFF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700;">
                  ${coupon.seal}
                </span>
                <span class="coupon-status" style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--gold-dark); text-transform: uppercase; font-weight: 600;">
                  Click to Redeem
                </span>
              </div>
              <h3 style="font-family: var(--font-display); font-size: 1.25rem; color: var(--ink); margin-bottom: 6px;">
                ${coupon.title}
              </h3>
              <p style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--ink-soft); margin: 0; text-transform: uppercase;">
                ${coupon.hint}
              </p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tab 3: Relationship Pop Quiz -->
      <div id="content-quiz" class="extra-tab-content" style="display: none;">
        <div style="max-width: 580px; margin: 0 auto; background: var(--paper); border: 1px solid var(--paper-border); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-md);">
          <div id="quiz-runner">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>

    </div>
  `;

  // Tab switching
  const tabReasons = container.querySelector('#tab-reasons');
  const tabCoupons = container.querySelector('#tab-coupons');
  const tabQuiz = container.querySelector('#tab-quiz');

  const contentReasons = container.querySelector('#content-reasons');
  const contentCoupons = container.querySelector('#content-coupons');
  const contentQuiz = container.querySelector('#content-quiz');

  function setTab(activeTab, activeContent) {
    [tabReasons, tabCoupons, tabQuiz].forEach((b) => {
      b.style.background = 'var(--paper-card)';
      b.style.color = 'var(--ink)';
      b.style.borderColor = 'var(--paper-border)';
    });
    activeTab.style.background = 'var(--plum)';
    activeTab.style.color = 'var(--paper)';
    activeTab.style.borderColor = 'var(--plum)';

    [contentReasons, contentCoupons, contentQuiz].forEach((c) => (c.style.display = 'none'));
    activeContent.style.display = 'block';
  }

  setTab(tabReasons, contentReasons);

  tabReasons.addEventListener('click', () => setTab(tabReasons, contentReasons));
  tabCoupons.addEventListener('click', () => setTab(tabCoupons, contentCoupons));
  tabQuiz.addEventListener('click', () => {
    setTab(tabQuiz, contentQuiz);
    startQuiz();
  });

  // Coupon redemption logic
  container.querySelectorAll('.coupon-ticket').forEach((ticket) => {
    ticket.addEventListener('click', () => {
      const isRedeemed = ticket.classList.toggle('redeemed');
      const statusEl = ticket.querySelector('.coupon-status');
      if (isRedeemed) {
        ticket.style.background = 'rgba(180, 72, 91, 0.08)';
        ticket.style.borderColor = 'var(--rose)';
        statusEl.textContent = '✓ Redeemed ❤️';
        statusEl.style.color = 'var(--rose-dark)';
        launchConfetti();
      } else {
        ticket.style.background = 'var(--paper)';
        ticket.style.borderColor = 'var(--thread)';
        statusEl.textContent = 'Click to Redeem';
        statusEl.style.color = 'var(--gold-dark)';
      }
    });
  });

  // Quiz logic
  let currentQIdx = 0;
  let score = 0;

  function startQuiz() {
    currentQIdx = 0;
    score = 0;
    renderQuestion();
  }

  function renderQuestion() {
    const quizRunner = container.querySelector('#quiz-runner');
    if (!quizRunner) return;

    if (currentQIdx >= quiz.length) {
      quizRunner.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 8px;">🎉 ✨</div>
          <h3 style="font-family: var(--font-hand); font-size: 2.2rem; color: var(--rose-dark); margin-bottom: 8px;">
            Quiz Completed!
          </h3>
          <p style="font-size: 1.1rem; color: var(--ink); margin-bottom: 18px;">
            You scored <strong>${score} / ${quiz.length}</strong>! You know our story so well, ${partner} ❤️
          </p>
          <button id="btn-restart-quiz" class="btn btn-primary" style="padding: 10px 22px;">
            Play Again 🔄
          </button>
        </div>
      `;
      launchConfetti();
      quizRunner.querySelector('#btn-restart-quiz')?.addEventListener('click', startQuiz);
      return;
    }

    const q = quiz[currentQIdx];
    quizRunner.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-muted); margin-bottom: 12px;">
          <span>QUESTION ${currentQIdx + 1} OF ${quiz.length}</span>
          <span>SCORE: ${score}</span>
        </div>

        <h3 style="font-size: 1.25rem; font-family: var(--font-display); color: var(--plum); margin-bottom: 20px; line-height: 1.4;">
          ${q.q}
        </h3>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${q.options.map((opt, i) => `
            <button class="quiz-opt-btn btn btn-secondary" data-opt="${i}" style="text-align: left; justify-content: flex-start; padding: 12px 18px; font-size: 0.95rem; border-radius: var(--radius-md);">
              ${opt}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    quizRunner.querySelectorAll('.quiz-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = parseInt(btn.dataset.opt, 10);
        if (chosen === q.correct) {
          score++;
          btn.style.background = '#234E35';
          btn.style.color = '#FFF';
          btn.style.borderColor = '#234E35';
        } else {
          btn.style.background = 'var(--rose-dark)';
          btn.style.color = '#FFF';
          btn.style.borderColor = 'var(--rose-dark)';
        }

        setTimeout(() => {
          currentQIdx++;
          renderQuestion();
        }, 600);
      });
    });
  }
}
