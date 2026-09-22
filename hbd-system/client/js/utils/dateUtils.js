/**
 * Date and time helper utilities
 */

export function calculateTimeTogether(startDateStr) {
  const start = new Date(startDateStr || '2026-03-21T00:00:00');
  const now = new Date();
  let diff = Math.max(0, now - start);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 1000 * 60 * 60 * 24;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;

  const mins = Math.floor(diff / (1000 * 60));
  diff -= mins * 1000 * 60;

  const secs = Math.floor(diff / 1000);

  return { days, hours, mins, secs };
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

export function isTodayBirthday(month, day) {
  const now = new Date();
  return (now.getMonth() + 1) === month && now.getDate() === day;
}

export function calculateYearProgress(startDateStr) {
  const start = new Date(startDateStr || '2026-03-21T00:00:00');
  const now = new Date();

  // Find the most recent anniversary date
  let lastAnniv = new Date(start);
  lastAnniv.setFullYear(now.getFullYear());
  if (lastAnniv > now) {
    lastAnniv.setFullYear(now.getFullYear() - 1);
  }

  // Next anniversary date
  let nextAnniv = new Date(lastAnniv);
  nextAnniv.setFullYear(lastAnniv.getFullYear() + 1);

  const total = nextAnniv - lastAnniv;
  const elapsed = now - lastAnniv;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));

  return {
    percent: Math.round(pct),
    daysToNext: Math.ceil((nextAnniv - now) / (1000 * 60 * 60 * 24))
  };
}
