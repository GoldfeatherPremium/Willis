export function Icon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="1.2" />
      <path d="M8 21V13l8-5.5L24 13v8" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 21v-5h10v5" stroke="var(--color-warm)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="9.6" r="1.4" fill="var(--color-accent)" />
    </svg>
  );
}
