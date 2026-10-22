import React from 'react';

interface WaveformBarsProps {
  /** When false the bars settle into a flat idle line. */
  active?: boolean;
  bars?: number;
  className?: string;
  /** 'blue' uses the theme ramp, 'rose' signals live recording. */
  tone?: 'blue' | 'rose';
}

const BLUE_RAMP = ['#AFD3FA', '#7FB8F2', '#4BA3F5', '#1A73D9'];
const ROSE_RAMP = ['#FDA4AF', '#FB7185', '#F43F5E', '#E11D48'];

/**
 * Animated frequency bar visualizer. Purely decorative — it mirrors the
 * "live audio stream" affordance used next to the microphone control.
 */
export const WaveformBars: React.FC<WaveformBarsProps> = ({
  active = true,
  bars = 34,
  className = '',
  tone = 'blue',
}) => {
  const ramp = tone === 'rose' ? ROSE_RAMP : BLUE_RAMP;

  // Deterministic pseudo-random heights keep the animation stable between renders.
  const heights = Array.from({ length: bars }, (_, i) => {
    const wave = Math.sin(i * 0.55) * 0.5 + 0.5;
    const detail = Math.sin(i * 1.7) * 0.22 + 0.5;
    return 22 + wave * 46 + detail * 30;
  });

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-[3px] h-full ${className}`}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full transition-[height,opacity] duration-300"
          style={{
            height: active ? `${h}%` : '10%',
            opacity: active ? (i % 3 === 0 ? 1 : 0.72) : 0.35,
            background: `linear-gradient(180deg, ${ramp[i % ramp.length]} 0%, ${
              ramp[(i + 1) % ramp.length]
            } 100%)`,
            animationDelay: `${(i % 11) * 0.09}s`,
            animationDuration: `${1 + (i % 5) * 0.14}s`,
            animationPlayState: active ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  );
};
