import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface PageTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ viewKey, children }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, rotateX: 6, filter: 'blur(6px)' }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(4px)' }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: 1200, transformOrigin: '50% 8%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
