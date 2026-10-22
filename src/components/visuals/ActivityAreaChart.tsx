import React, { useState } from 'react';

export interface AreaChartPoint {
  label: string;
  value: number;
}

interface ActivityAreaChartProps {
  data: AreaChartPoint[];
  height?: number;
}

const W = 620;
const H = 170;
const PAD_L = 26;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 24;

const GRID = '#E4F1FF';
const AXIS = '#5B6B7F';

/**
 * Hand-rolled SVG area chart. No chart library required, so the bundle
 * stays lean and the styling matches the EchoCRM blue theme exactly.
 */
export const ActivityAreaChart: React.FC<ActivityAreaChartProps> = ({
  data,
  height = 168,
}) => {
  const [active, setActive] = useState<number | null>(null);

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const xAt = (i: number) => PAD_L + i * stepX;
  const yAt = (v: number) => PAD_T + innerH * (1 - v / maxValue);

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(d.value).toFixed(2)}`)
    .join(' ');

  const areaPath =
    data.length > 0
      ? `${linePath} L ${xAt(data.length - 1).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${xAt(
          0,
        ).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`
      : '';

  // Show roughly every third label so they never collide.
  const labelStride = Math.max(1, Math.ceil(data.length / 5));

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label={`Debrief activity over the last ${data.length} days`}
      >
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4BA3F5" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#4BA3F5" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="activityStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#AFD3FA" />
            <stop offset="50%" stopColor="#1A73D9" />
            <stop offset="100%" stopColor="#155FB5" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD_T + innerH * ratio;
          return (
            <g key={ratio}>
              <line
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke={GRID}
                strokeWidth="1"
                strokeDasharray={ratio === 1 ? undefined : '3 3'}
              />
              <text
                x={PAD_L - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fill={AXIS}
                fontFamily="JetBrains Mono, monospace"
              >
                {Math.round(maxValue * (1 - ratio))}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        {areaPath && <path d={areaPath} fill="url(#activityFill)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="url(#activityStroke)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(d.value)}
            r={active === i ? 4 : 2.4}
            fill={active === i ? '#155FB5' : '#1A73D9'}
            stroke="#FFFFFF"
            strokeWidth="1.2"
            style={{ transition: 'r 0.15s ease' }}
          />
        ))}

        {/* X axis labels */}
        {data.map((d, i) =>
          i % labelStride === 0 || i === data.length - 1 ? (
            <text
              key={`lbl-${i}`}
              x={xAt(i)}
              y={H - 7}
              textAnchor="middle"
              fontSize="8"
              fill={AXIS}
              fontFamily="JetBrains Mono, monospace"
            >
              {d.label}
            </text>
          ) : null,
        )}

        {/* Hover guide */}
        {active !== null && data[active] && (
          <line
            x1={xAt(active)}
            y1={PAD_T}
            x2={xAt(active)}
            y2={PAD_T + innerH}
            stroke="#1A73D9"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        )}

        {/* Hit areas */}
        {data.map((d, i) => (
          <rect
            key={`hit-${i}`}
            x={xAt(i) - stepX / 2}
            y={PAD_T}
            width={Math.max(stepX, 12)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>

      {/* Floating tooltip */}
      {active !== null && data[active] && (
        <div
          className="pointer-events-none absolute z-10 px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#CFE6FF] shadow-[0_8px_20px_rgba(26,115,217,0.16)]"
          style={{
            left: `${(xAt(active) / W) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -118%)',
          }}
        >
          <div className="text-[10px] font-mono text-[#5B6B7F] whitespace-nowrap">
            {data[active].label}
          </div>
          <div className="text-xs font-extrabold font-mono text-[#1A73D9] tabular-nums whitespace-nowrap">
            {data[active].value} debrief{data[active].value === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
};
