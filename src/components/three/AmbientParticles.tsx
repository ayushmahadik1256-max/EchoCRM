import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

function ParticleCloud({ count = 90 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.028;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#1A73D9"
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function SoftOrbs() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (a.current) {
      a.current.position.x = Math.sin(t * 0.22) * 2.4;
      a.current.position.y = Math.cos(t * 0.18) * 1.2;
    }
    if (b.current) {
      b.current.position.x = Math.cos(t * 0.16) * -2.8;
      b.current.position.y = Math.sin(t * 0.2) * 1.4;
    }
  });

  return (
    <>
      <mesh ref={a} position={[2.5, 0.6, -2]}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial color="#AFD3FA" transparent opacity={0.18} />
      </mesh>
      <mesh ref={b} position={[-2.8, -0.4, -2.4]}>
        <sphereGeometry args={[1.45, 32, 32]} />
        <meshBasicMaterial color="#7FB8F2" transparent opacity={0.14} />
      </mesh>
    </>
  );
}

export const AmbientParticles: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ParticleCloud />
          <SoftOrbs />
        </Suspense>
      </Canvas>
    </div>
  );
};
