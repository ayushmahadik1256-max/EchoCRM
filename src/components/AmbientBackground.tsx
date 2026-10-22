import React from 'react';
import { AmbientParticles } from './three/AmbientParticles';

export const AmbientBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-white select-none"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F8FBFF] to-[#EFF7FF]" />

      <div
        className="ambient-orb-1 absolute -top-[120px] right-[5%] w-[680px] h-[680px] rounded-full blur-[140px] opacity-75"
        style={{
          background: 'radial-gradient(circle, rgba(207,230,255,0.7) 0%, rgba(228,241,255,0.4) 60%, transparent 80%)',
        }}
      />

      <div
        className="ambient-orb-2 absolute top-[35%] -left-[140px] w-[620px] h-[620px] rounded-full blur-[130px] opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(175,211,250,0.55) 0%, rgba(228,241,255,0.3) 65%, transparent 80%)',
        }}
      />

      <div
        className="ambient-orb-3 absolute -bottom-[160px] right-[20%] w-[720px] h-[540px] rounded-full blur-[150px] opacity-55"
        style={{
          background: 'radial-gradient(circle, rgba(127,184,242,0.45) 0%, rgba(207,230,255,0.25) 60%, transparent 80%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.22] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(26,115,217,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,115,217,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <AmbientParticles />
    </div>
  );
};
