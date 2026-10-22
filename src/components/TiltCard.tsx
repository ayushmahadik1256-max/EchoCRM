import React, { useRef, useState, useEffect } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees (default 6)
  perspective?: number;
  scale?: number;
  showSheen?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 6,
  perspective = 1000,
  scale = 1.015,
  showSheen = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [sheenPosition, setSheenPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsDisabled(isTouch || prefersReducedMotion);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(
      `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
        2,
      )}deg) translateZ(8px) scale3d(${scale}, ${scale}, 1)`,
    );

    if (showSheen) {
      const px = Math.round((x / rect.width) * 100);
      const py = Math.round((y / rect.height) * 100);
      setSheenPosition({ x: px, y: py });
    }
  };

  const handleMouseEnter = () => {
    if (isDisabled) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isDisabled) return;
    setIsHovered(false);
    setSheenPosition(null);
    // Smooth return to neutral
    setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transform || undefined,
        transition: isHovered
          ? 'transform 0.08s ease-out'
          : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${
        isHovered ? 'shadow-[0_20px_48px_rgba(26,115,217,0.14)]' : ''
      } ${className}`}
    >
      {children}

      {/* Subtle Moving Pointer Light-Reflection Sheen */}
      {showSheen && isHovered && sheenPosition && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle 280px at ${sheenPosition.x}% ${sheenPosition.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`,
          }}
        />
      )}
    </div>
  );
};
