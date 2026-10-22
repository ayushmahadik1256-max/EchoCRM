import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

function PulseOrb() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    mesh.current.scale.setScalar(pulse);
    mesh.current.rotation.y = state.clock.elapsedTime * 0.55;
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, 18]} />
      <MeshDistortMaterial
        color="#1A73D9"
        emissive="#4BA3F5"
        emissiveIntensity={0.55}
        roughness={0.2}
        metalness={0.28}
        distort={0.46}
        speed={3.2}
      />
    </mesh>
  );
}

export const GeneratingOrb: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 rounded-full bg-[#CFE6FF] blur-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <pointLight position={[2, 2, 3]} intensity={1.4} color="#FFFFFF" />
          <pointLight position={[-2, -1, 2]} intensity={0.9} color="#7FB8F2" />
          <PulseOrb />
        </Suspense>
      </Canvas>
    </div>
  );
};
