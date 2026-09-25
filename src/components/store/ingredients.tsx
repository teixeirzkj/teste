// Ilustrações leves (SVG) dos ingredientes que flutuam no hero.

type P = { className?: string; style?: React.CSSProperties };

export function Basil({ className, style }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="bsl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5fae4a" />
          <stop offset="1" stopColor="#23612a" />
        </linearGradient>
      </defs>
      <path d="M8 56C8 30 26 8 56 8c0 30-22 48-48 48Z" fill="url(#bsl)" />
      <path d="M10 54 52 12" stroke="#bde3a4" strokeOpacity=".55" strokeWidth="1.6" fill="none" />
      <path d="M22 42c4-8 3-14 2-18M31 33c5-6 5-11 5-16M38 26l10-2M29 36l12 1M20 45l10 3" stroke="#bde3a4" strokeOpacity=".3" strokeWidth="1.1" fill="none" />
    </svg>
  );
}

export function Tomato({ className, style }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#c9281c" />
      <circle cx="32" cy="32" r="24" fill="#e8472f" />
      <g fill="#ffb199" opacity=".9">
        <ellipse cx="32" cy="18" rx="5" ry="7" />
        <ellipse cx="45" cy="36" rx="5" ry="7" transform="rotate(120 45 36)" />
        <ellipse cx="19" cy="36" rx="5" ry="7" transform="rotate(-120 19 36)" />
      </g>
      <circle cx="32" cy="32" r="5" fill="#f7806a" />
      <path d="M32 8v48M11 44l42-24M11 20l42 24" stroke="#b01f15" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  );
}

export function Pepperoni({ className, style }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#8f1d15" />
      <circle cx="32" cy="32" r="26" fill="#b3261b" />
      <g fill="#e0634f" opacity=".8">
        <circle cx="22" cy="24" r="3" />
        <circle cx="40" cy="20" r="2.2" />
        <circle cx="44" cy="38" r="3.2" />
        <circle cx="26" cy="42" r="2.6" />
        <circle cx="34" cy="31" r="1.8" />
      </g>
      <ellipse cx="24" cy="18" rx="10" ry="4" fill="#fff" opacity=".12" transform="rotate(-25 24 18)" />
    </svg>
  );
}

export function Olive({ className, style }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <circle cx="32" cy="32" r="22" fill="#1b1b1b" />
      <circle cx="32" cy="32" r="9" fill="#070707" />
      <ellipse cx="24" cy="22" rx="6" ry="3" fill="#fff" opacity=".18" transform="rotate(-35 24 22)" />
    </svg>
  );
}

export function Mushroom({ className, style }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path d="M8 30C8 16 19 8 32 8s24 8 24 22c0 3-3 4-6 4H14c-3 0-6-1-6-4Z" fill="#e9dcc6" />
      <path d="M24 34h16l-2 20c0 2-2 3-6 3s-6-1-6-3Z" fill="#d6c4a6" />
      <path d="M14 30c6-3 30-3 36 0" stroke="#bda886" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Silhueta simplificada do skyline paulistano (eco da logo). */
export function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M0 220V170h40v-30h30v40h25v-70h20v-20h10v20h20v100h30v-60l18-50 18 50v60h24V70l10-40 10 40v150h14V90h36v130h20v-80h40v80h18V60h12V20h6V0h4v20h6v40h12v160h20V110h50v110h22V80h44v140h16v-60h30v60h14l40-150 14 0 40 150h10v-40h40v40h30v-90h24v90h28V120h36v100h20v-50h40v50h24v-80h30v80h36v-40h30v40h40v-60h24v60h52v-30h40v30h50v-60h30v60Z"
      />
    </svg>
  );
}
