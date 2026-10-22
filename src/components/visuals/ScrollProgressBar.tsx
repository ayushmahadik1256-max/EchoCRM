import React, { useEffect, useState } from 'react';

/**
 * Thin gradient scroll-progress rail. Rendered inside the sticky header.
 */
export const ScrollProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollHeight > 0 ? Math.min(1, scrollTop / scrollHeight) : 0);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 bottom-0 h-[2px] bg-transparent overflow-hidden"
    >
      <div
        className="h-full origin-left transition-[width] duration-75 ease-out"
        style={{
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #AFD3FA 0%, #4BA3F5 45%, #1A73D9 100%)',
          boxShadow: '0 0 12px rgba(26,115,217,0.55)',
        }}
      />
    </div>
  );
};
