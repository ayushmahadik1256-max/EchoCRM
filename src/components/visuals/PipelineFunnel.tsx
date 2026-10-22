import React from 'react';

export interface FunnelStage {
  label: string;
  value: number;
}

interface PipelineFunnelProps {
  stages: FunnelStage[];
  className?: string;
}

const BAND_RAMP = ['#CFE6FF', '#AFD3FA', '#7FB8F2', '#4BA3F5', '#1A73D9', '#155FB5'];
const TEXT_RAMP = ['#0F172A', '#0F172A', '#0F172A', '#0F172A', '#FFFFFF', '#FFFFFF'];

/**
 * SVG pipeline funnel for the deal-stage distribution.
 * Band width is scaled with a square-root curve so small stages stay legible.
 */
export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ stages, className = '' }) => {
  const width = 320;
  const bandHeight = 34;
  const gap = 9;
  const maxValue = Math.max(1, ...stages.map((s) => s.value));
  const total = stages.reduce((acc, s) => acc + s.value, 0);
  const height = stages.length * (bandHeight + gap) - gap;

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Deal pipeline across ${stages.length} stages, ${total} debriefs total`}
      >
        <defs>
          {stages.map((_, i) => (
            <linearGradient
              key={i}
              id={`funnel-band-${i}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={BAND_RAMP[i % BAND_RAMP.length]} stopOpacity="0.95" />
              <stop offset="100%" stopColor={BAND_RAMP[i % BAND_RAMP.length]} stopOpacity="0.72" />
            </linearGradient>
          ))}
        </defs>

        {stages.map((stage, i) => {
          const rel = Math.sqrt(stage.value / maxValue);
          const bandWidth = 26 + rel * (width - 52);
          const x = (width - bandWidth) / 2;
          const y = i * (bandHeight + gap);
          const bottomWidth = bandWidth * 0.93;
          const bottomX = (width - bottomWidth) / 2;
          const rampIndex = Math.min(i, TEXT_RAMP.length - 1);
          const share = total > 0 ? Math.round((stage.value / total) * 100) : 0;

          return (
            <g key={stage.label} className="animate-fadeIn">
              <path
                d={`M ${x} ${y} L ${x + bandWidth} ${y} L ${bottomX + bottomWidth} ${y + bandHeight} L ${bottomX} ${y + bandHeight} Z`}
                fill={`url(#funnel-band-${i})`}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                style={{ animationDelay: `${i * 60}ms` }}
              />
              <text
                x={width / 2}
                y={y + bandHeight / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="700"
                fill={TEXT_RAMP[rampIndex]}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {stage.label}
              </text>
              <text
                x={width / 2}
                y={y + bandHeight / 2 + 13}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="600"
                fill={TEXT_RAMP[rampIndex]}
                opacity="0.72"
                fontFamily="JetBrains Mono, monospace"
              >
                {stage.value} · {share}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
