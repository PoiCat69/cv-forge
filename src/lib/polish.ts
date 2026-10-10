// Lightweight, offline "polish" helpers. No external API — these apply
// well-known resume-writing heuristics so the feature works with zero config.

const WEAK_OPENERS = [
  'responsible for',
  'worked on',
  'helped with',
  'in charge of',
  'tasked with',
  'duties included',
];

const STRONG_VERBS = [
  'Led', 'Built', 'Shipped', 'Drove', 'Launched', 'Scaled', 'Owned',
  'Delivered', 'Architected', 'Optimized', 'Automated', 'Spearheaded',
];

/** Tidy a professional summary: trim filler, enforce first-person-free voice. */
export function polishSummary(text: string): string {
  if (!text.trim()) return text;
  let out = text.trim();

  // Drop leading first-person framing.
  out = out.replace(/^(i am|i'm|i have|i've|my name is)\s+/i, '');

  // Replace weak phrases.
  WEAK_OPENERS.forEach((w) => {
    out = out.replace(new RegExp(w, 'gi'), 'drove');
  });

  // Collapse whitespace and ensure a terminal period.
  out = out.replace(/\s+/g, ' ').trim();
  if (!/[.!?]$/.test(out)) out += '.';

  // Capitalize first letter.
  out = out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

/** Suggest an XYZ-formula rewrite of a bullet: Accomplished [X] measured by [Y] by doing [Z]. */
export function suggestBullet(text: string): string {
  const t = text.trim();
  if (!t) return 'Accomplished [X] as measured by [Y%], by doing [Z].';

  let out = t;
  // Nudge a strong action verb to the front if it opens weakly.
  const firstWord = out.split(' ')[0]?.toLowerCase() ?? '';
  const weak = ['was', 'did', 'made', 'helped', 'worked'];
  if (weak.includes(firstWord)) {
    const verb = STRONG_VERBS[Math.floor(Math.random() * STRONG_VERBS.length)];
    out = `${verb} ${out.split(' ').slice(1).join(' ')}`;
  }
  // Hint for a metric if none present.
  if (!/\d/.test(out)) {
    out = out.replace(/[.?!]?\s*$/, '') + ' — add a metric (e.g. by 30%, to 10k users).';
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}
