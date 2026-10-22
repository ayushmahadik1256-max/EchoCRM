import React, { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Radius of the cursor glow in pixels. */
  radius?: number;
}

/**
 * Card with a cursor-tracked radial highlight, matching the glass theme.
 * Purely decorative — it does not intercept pointer events for children.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  radius = 340,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => {
        setVisible(false);
        setPos(null);
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}

      {visible && pos && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, rgba(26,115,217,0.09) 0%, rgba(127,184,242,0.05) 40%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};
