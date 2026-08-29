import { useMemo } from 'react';

const COLORS = [
  'var(--color-saffron-500)',
  'var(--color-lotus-400)',
  'var(--color-purple-500)',
  'var(--color-gold-400)',
  'var(--color-saffron-400)',
];

interface Piece {
  left: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 0.3,
    duration: 1.6 + Math.random() * 1,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  }));
}

/**
 * A light, dependency-free celebration burst for reaching a target. Renders
 * nothing when the viewer prefers reduced motion — the completion message
 * alone still communicates the moment.
 */
export function Confetti({ count = 48 }: { count?: number }) {
  const pieces = useMemo(() => makePieces(count), [count]);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-full overflow-hidden"
    >
      {pieces.map((p, i) => {
        const style: React.CSSProperties &
          Record<'--confetti-drift' | '--confetti-rotate', string> = {
          left: `${p.left}%`,
          width: p.size,
          height: p.size * 0.4,
          backgroundColor: p.color,
          animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          '--confetti-drift': `${p.drift}px`,
          '--confetti-rotate': `${p.rotation}deg`,
        };
        return <span key={i} className="absolute top-[-5vh] block rounded-sm" style={style} />;
      })}
    </div>
  );
}
