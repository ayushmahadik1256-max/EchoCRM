import React from 'react';

interface AuroraBackdropProps {
  /** 0 - 1 opacity multiplier for the whole layer. */
  intensity?: number;
  /** Show the faint blueprint lattice behind the gradients. */
  showGrid?: boolean;
  className?: string;
}

/**
 * Layered, slowly drifting blue "aurora" gradients.
 * Pure CSS so it stays cheap and does not compete with the WebGL scenes.
 */
export const AuroraBackdrop: React.FC<AuroraBackdropProps> = ({
  intensity = 1,
  showGrid = true,
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ opacity: intensity }}
    >
      {showGrid && (
        <div
          className="absolute inset-0 bg-dot-grid opacity-[0.55]"
          style={{
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, #000 55%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, #000 55%, transparent 100%)',
          }}
        />
      )}

      <div
        className="animate-aurora-a absolute -top-[18%] -left-[12%] w-[62%] h-[78%] rounded-full blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(175,211,250,0.55) 0%, rgba(207,230,255,0.28) 55%, transparent 78%)',
        }}
      />

      <div
        className="animate-aurora-b absolute top-[18%] -right-[16%] w-[58%] h-[72%] rounded-full blur-[130px]"
        style={{
          background:
            'radial-gradient(circle, rgba(127,184,242,0.5) 0%, rgba(207,230,255,0.26) 58%, transparent 80%)',
        }}
      />

      <div
        className="animate-aurora-c absolute bottom-[-20%] left-[22%] w-[54%] h-[68%] rounded-full blur-[140px]"
        style={{
          background:
            'radial-gradient(circle, rgba(26,115,217,0.28) 0%, rgba(207,230,255,0.22) 55%, transparent 78%)',
        }}
      />

      {/* Hairline horizon sweep */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#AFD3FA]/60 to-transparent" />
    </div>
  );
};
