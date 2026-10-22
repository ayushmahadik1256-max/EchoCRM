import React from 'react';

interface ConfidenceRingProps {
  /** 0 - 1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  caption?: string;
  className?: string;
}

/**
 * Radial progress ring in the theme blue ramp.
 * Pure SVG so it scales crisply and needs no chart library.
 */
export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  caption,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped * 100)}% ${caption || label || 'complete'}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`ring-grad-${Math.round(clamped * 1000)}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#AFD3FA" />
            <stop offset="55%" stopColor="#4BA3F5" />
            <stop offset="100%" stopColor="#1A73D9" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E4F1FF"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-grad-${Math.round(clamped * 1000)})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-extrabold text-[#0F172A] leading-none tabular-nums">
          {label ?? `${Math.round(clamped * 100)}%`}
        </span>
        {caption && (
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#5B6B7F]">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
};
