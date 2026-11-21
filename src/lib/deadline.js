// Submission deadline shown to team leaders. The backend enforces the same
// moment (SUBMISSION_DEADLINE app setting on Azure); keep the two in sync.
export const SUBMISSION_DEADLINE = new Date('2026-11-22T05:30:00+05:30');

export const DEADLINE_LABEL = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(SUBMISSION_DEADLINE);

/** "1h 22m left", "12m left", "less than a minute left". */
export const formatTimeLeft = (ms) => {
  if (ms <= 0) return '';
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return 'less than a minute left';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h ? `${h}h ` : ''}${m}m left`;
};
