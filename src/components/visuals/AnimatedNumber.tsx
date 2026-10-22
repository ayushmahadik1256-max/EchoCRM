import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface AnimatedNumberProps {
  value: number;
  /** Optional suffix such as "%" or " days". */
  suffix?: string;
  prefix?: string;
  durationMs?: number;
  decimals?: number;
  className?: string;
}

/**
 * Counts up to `value` once the element scrolls into view.
 * Falls back to the final value immediately for reduced-motion users.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  suffix = '',
  prefix = '',
  durationMs = 900,
  decimals = 0,
  className = '',
}) => {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(reduced ? value : 0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasAnimated.current) return;
          hasAnimated.current = true;

          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / durationMs);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Number((value * eased).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs, decimals, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};
