import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

function VoiceCore() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.18;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.55}>
      <mesh ref={mesh} scale={1.15}>
        <icosahedronGeometry args={[1.05, 24]} />
        <MeshDistortMaterial
          color="#4BA3F5"
          emissive="#1A73D9"
          emissiveIntensity={0.35}
          roughness={0.18}
          metalness={0.22}
          distort={0.38}
          speed={1.8}
          envMapIntensity={0.9}
        />
      </mesh>
    </Float>
  );
}

function OrbitRing({
  radius,
  color,
  tilt,
  speed,
}: {
  radius: number;
  color: string;
  tilt: [number, number, number];
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.018, 16, 96]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        metalness={0.4}
        roughness={0.25}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function FloatingNodes() {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(
    () =>
      [
        [-2.4, 1.3, 0.4],
        [2.2, 0.8, -0.6],
        [-1.6, -1.4, 0.8],
        [1.8, -1.1, 0.5],
        [0.2, 1.9, -0.4],
      ] as [number, number, number][],
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.18;
  });

  return (
    <group ref={group}>
      {positions.map((pos, i) => (
        <Float key={i} speed={1 + i * 0.2} floatIntensity={0.6} rotationIntensity={0.4}>
          <mesh position={pos}>
            <sphereGeometry args={[0.12 + (i % 3) * 0.04, 24, 24]} />
            <meshPhysicalMaterial
              color={i % 2 === 0 ? '#7FB8F2' : '#1A73D9'}
              roughness={0.15}
              metalness={0.35}
              transmission={0.35}
              thickness={0.6}
              transparent
              opacity={0.92}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function MouseParallax() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const x = state.pointer.x * 0.35;
    const y = state.pointer.y * 0.22;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y, 0.06);
  });

  return (
    <group ref={group}>
      <VoiceCore />
      <OrbitRing radius={1.7} color="#7FB8F2" tilt={[Math.PI / 2.4, 0.2, 0]} speed={0.35} />
      <OrbitRing radius={2.05} color="#1A73D9" tilt={[0.4, Math.PI / 3, 0.3]} speed={-0.22} />
      <OrbitRing radius={2.35} color="#AFD3FA" tilt={[-0.55, 0.5, 0.2]} speed={0.16} />
      <FloatingNodes />
      <Sparkles
        count={48}
        scale={[6.5, 5, 3]}
        size={2.4}
        speed={0.45}
        opacity={0.55}
        color="#1A73D9"
      />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={1.35} color="#FFFFFF" />
      <pointLight position={[-3, -2, 3]} intensity={1.1} color="#7FB8F2" />
      <pointLight position={[3, 2, -2]} intensity={0.8} color="#1A73D9" />
    </>
  );
}

export const VoiceHeroScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none ${className}`}
      >
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CFE6FF]/70 blur-3xl" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 ${className}`}
    >
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <MouseParallax />
        </Suspense>
      </Canvas>
    </div>
  );
};
