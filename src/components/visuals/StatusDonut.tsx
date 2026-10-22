import React, { useState } from 'react';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  const oStart = polarToCartesian(cx, cy, outerR, startAngle);
  const oEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const iEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const iStart = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${oStart.x.toFixed(2)} ${oStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oEnd.x.toFixed(2)} ${oEnd.y.toFixed(2)}`,
    `L ${iEnd.x.toFixed(2)} ${iEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${iStart.x.toFixed(2)} ${iStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/**
 * Hand-rolled SVG donut chart with hover emphasis and a centered total.
 */
export const StatusDonut: React.FC<StatusDonutProps> = ({
  data,
  size = 150,
  thickness = 22,
}) => {
  const [active, setActive] = useState<string | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR - thickness;

  let cursor = 0;
  const arcs = data.map((slice) => {
    const sweep = total > 0 ? (slice.value / total) * 360 : 0;
    const start = cursor;
    const end = cursor + Math.max(sweep, 0.01);
    cursor = end;
    return { slice, start, end };
  });

  const highlighted = active ? data.find((d) => d.name === active) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          role="img"
          aria-label={`Follow-up status breakdown across ${total} debriefs`}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={(outerR + innerR) / 2}
            fill="none"
            stroke="#E4F1FF"
            strokeWidth={thickness}
          />

          {arcs.map(({ slice, start, end }) => {
            const isActive = active === slice.name;
            const dim = active !== null && !isActive;
            return (
              <path
                key={slice.name}
                d={describeDonutArc(cx, cy, outerR, innerR, start, end)}
                fill={slice.color}
                opacity={dim ? 0.32 : 1}
                stroke="#FFFFFF"
                strokeWidth="2"
                style={{ transition: 'opacity 0.2s ease' }}
                onMouseEnter={() => setActive(slice.name)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>

        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold font-mono text-[#0F172A] tabular-nums leading-none">
            {highlighted ? highlighted.value : total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B7F] mt-1">
            {highlighted ? highlighted.name : 'total'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((slice) => (
          <button
            key={slice.name}
            type="button"
            onMouseEnter={() => setActive(slice.name)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(slice.name)}
            onBlur={() => setActive(null)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5B6B7F] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: slice.color }}
              aria-hidden="true"
            />
            {slice.name}
            <span className="font-mono text-[#0F172A] tabular-nums">{slice.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
