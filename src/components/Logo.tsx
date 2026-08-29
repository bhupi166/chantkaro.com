import { useTranslation } from 'react-i18next';

interface LogoProps {
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  titleId?: string;
}

/**
 * Original Chant Karo mark: a circular repetition ring (evoking a counting
 * strand) wrapped around a simple three-petal lotus, with a soft light glow
 * above. Deliberately generic/inclusive — no tradition-specific symbol.
 */
export function Logo({
  className,
  withWordmark = false,
  wordmarkClassName,
  titleId = 'chantkaro-logo-title',
}: LogoProps) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg viewBox="0 0 64 64" width="40" height="40" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{t('common.logoAlt')}</title>
        <defs>
          <linearGradient id="ck-petal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0955C" />
            <stop offset="100%" stopColor="#D9628A" />
          </linearGradient>
          <radialGradient id="ck-glow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#F2D18A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F2D18A" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="32" cy="34" r="26" fill="url(#ck-glow)" />

        {/* repetition ring: evenly spaced beads tracing a circle */}
        <g fill="#472C62" opacity="0.85">
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
            const r = 27;
            const cx = 32 + r * Math.cos(angle);
            const cy = 34 + r * Math.sin(angle);
            return <circle key={i} cx={cx} cy={cy} r={i % 4 === 0 ? 2.1 : 1.3} />;
          })}
        </g>

        {/* three-petal lotus, simple and non-denominational */}
        <g>
          <path d="M32 44c-8-4-12-12-8-20 5 2 8 8 8 20z" fill="url(#ck-petal)" />
          <path d="M32 44c8-4 12-12 8-20-5 2-8 8-8 20z" fill="url(#ck-petal)" opacity="0.92" />
          <path d="M32 46c-5-8-4-17 0-23 4 6 5 15 0 23z" fill="#F0955C" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className={`font-display text-xl font-semibold leading-none text-[color:var(--fg)] ${wordmarkClassName ?? ''}`}
        >
          {t('common.brandName')}
        </span>
      )}
    </span>
  );
}
