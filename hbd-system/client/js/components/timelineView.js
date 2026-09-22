import { createMemoryCard } from './memoryCard.js';
import { formatMonthYear } from '../utils/dateUtils.js';

/**
 * Timeline View: Month Grouped Stream + Quick Jump Bar
 */
export function renderTimelineView(container, memories, onSelectMemory) {
  if (!memories || memories.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--ink-soft);">
        <div style="font-size: 3rem; margin-bottom: 12px;">📷</div>
        <h3 style="font-family: var(--font-hand); font-size: 2.2rem; color: var(--rose-dark);">No memories added yet</h3>
        <p style="font-size: 1rem; margin-top: 8px;">Click "Add Memory" to create your very first moment.</p>
      </div>
    `;
    return;
  }

  // Group memories by Month-Year (e.g. "2026-03")
  const groups = new Map();

  for (const memory of memories) {
    if (!memory.date) continue;
    const date = new Date(memory.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = formatMonthYear(memory.date);

    if (!groups.has(key)) {
      groups.set(key, { label, list: [] });
    }
    groups.get(key).list.push(memory);
  }

  container.innerHTML = '';

  // Quick-Jump Month Pill Bar
  const jumpBar = document.createElement('div');
  jumpBar.className = 'month-jump-bar';

  // "All" pill
  const allPill = document.createElement('button');
  allPill.className = 'month-pill active';
  allPill.textContent = 'All Months';
  allPill.addEventListener('click', () => {
    jumpBar.querySelectorAll('.month-pill').forEach(p => p.classList.remove('active'));
    allPill.classList.add('active');
    window.scrollTo({ top: stream.offsetTop - 80, behavior: 'smooth' });
  });
  jumpBar.appendChild(allPill);

  for (const [key, group] of groups.entries()) {
    const pill = document.createElement('button');
    pill.className = 'month-pill';
    pill.textContent = group.label;
    pill.addEventListener('click', () => {
      jumpBar.querySelectorAll('.month-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const targetSec = container.querySelector(`#month-sec-${key}`);
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    jumpBar.appendChild(pill);
  }

  container.appendChild(jumpBar);

  // Timeline Stream
  const stream = document.createElement('div');
  stream.className = 'timeline-stream';

  for (const [key, group] of groups.entries()) {
    const section = document.createElement('div');
    section.id = `month-sec-${key}`;
    section.style.marginBottom = '50px';

    const header = document.createElement('div');
    header.className = 'month-divider';
    header.innerHTML = `<span class="month-divider-badge">${group.label}</span>`;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'timeline-grid';

    for (const memory of group.list) {
      const card = createMemoryCard(memory, onSelectMemory);
      grid.appendChild(card);
    }

    section.appendChild(grid);
    stream.appendChild(section);
  }

  container.appendChild(stream);
}
