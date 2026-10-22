import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface ArtifactNode {
  id: string;
  label: string;
  caption: string;
  color: string;
  position: [number, number, number];
}

const NODES: ArtifactNode[] = [
  {
    id: 'email',
    label: 'Follow-up Email',
    caption: 'Ready to send',
    color: '#1A73D9',
    position: [2.45, 0.55, 0.35],
  },
  {
    id: 'crm',
    label: 'CRM Record',
    caption: '10 structured fields',
    color: '#4BA3F5',
    position: [0.85, 1.35, -2.05],
  },
  {
    id: 'notes',
    label: 'Handoff Note',
    caption: '5–8 bullets',
    color: '#7FB8F2',
    position: [-2.35, 0.75, 0.6],
  },
  {
    id: 'nextStep',
    label: 'Next Step',
    caption: 'Calendar ready',
    color: '#AFD3FA',
    position: [-0.7, -1.25, -2.1],
  },
];

function VoiceCore() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.22;
    mesh.current.rotation.x = Math.sin(t * 0.38) * 0.14;
    // Gentle audio-style pulse
    const pulse = 1 + Math.sin(t * 1.9) * 0.045;
    mesh.current.scale.setScalar(pulse);
  });

  return (
    <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.4}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.92, 20]} />
        <MeshDistortMaterial
          color="#1A73D9"
          emissive="#4BA3F5"
          emissiveIntensity={0.45}
          roughness={0.16}
          metalness={0.3}
          distort={0.42}
          speed={2.1}
        />
      </mesh>
    </Float>
  );
}

function ArtifactNodes() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.16;
  });

  return (
    <group ref={group}>
      {NODES.map((node) => (
        <group key={node.id}>
          {/* Connection from core to node */}
          <Line
            points={[
              [0, 0, 0],
              node.position,
            ]}
            color={node.color}
            lineWidth={1}
            transparent
            opacity={0.45}
            dashed
            dashSize={0.16}
            gapSize={0.12}
          />

          <Float
            speed={1 + node.position[0] * 0.15}
            floatIntensity={0.7}
            rotationIntensity={0.35}
          >
            <mesh position={node.position}>
              <sphereGeometry args={[0.26, 26, 26]} />
              <meshPhysicalMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={0.35}
                roughness={0.12}
                metalness={0.35}
                transmission={0.35}
                thickness={0.7}
                transparent
                opacity={0.95}
              />
            </mesh>

            {/* Halo */}
            <mesh position={node.position}>
              <sphereGeometry args={[0.44, 20, 20]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.1} />
            </mesh>
          </Float>
        </group>
      ))}
    </group>
  );
}

function OrbitRings() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = state.clock.elapsedTime * 0.12;
  });

  const rings = useMemo(
    () => [
      { radius: 1.65, tilt: [Math.PI / 2.3, 0.2, 0] as [number, number, number], color: '#AFD3FA' },
      { radius: 2.15, tilt: [0.4, Math.PI / 3, 0.3] as [number, number, number], color: '#7FB8F2' },
      { radius: 2.75, tilt: [-0.5, 0.55, 0.2] as [number, number, number], color: '#CFE6FF' },
    ],
    [],
  );

  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={ring.tilt}>
          <torusGeometry args={[ring.radius, 0.012, 12, 80]} />
          <meshStandardMaterial
            color={ring.color}
            emissive={ring.color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[4, 6, 5]} intensity={1.25} color="#FFFFFF" />
      <pointLight position={[-3, -2, 3]} intensity={1.0} color="#7FB8F2" />
      <pointLight position={[3, 2, -2]} intensity={0.75} color="#1A73D9" />
    </>
  );
}

export const ArtifactConstellation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none ${className}`}
      >
        <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CFE6FF]/70 blur-3xl" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={`absolute inset-0 ${className}`}>
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 6.6], fov: 45 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <VoiceCore />
          <OrbitRings />
          <ArtifactNodes />
          <Sparkles
            count={40}
            scale={[7, 5.5, 3.5]}
            size={2.2}
            speed={0.4}
            opacity={0.45}
            color="#4BA3F5"
          />
        </Suspense>
      </Canvas>

      {/* HTML annotation overlay — crisp, selectable and independent of the WebGL layer */}
      <div className="absolute inset-0">
        <div className="absolute left-3 top-3 space-y-1.5">
          {NODES.slice(0, 2).map((node, i) => (
            <NodeChip key={node.id} node={node} delay={i * 140} align="left" />
          ))}
        </div>

        <div className="absolute right-3 top-3 space-y-1.5">
          {NODES.slice(2).map((node, i) => (
            <NodeChip key={node.id} node={node} delay={(i + 2) * 140} align="right" />
          ))}
        </div>
      </div>
    </div>
  );
};

const NodeChip: React.FC<{ node: ArtifactNode; delay: number; align: 'left' | 'right' }> = ({
  node,
  delay,
  align,
}) => (
  <div
    className="animate-fadeIn flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/88 backdrop-blur-md border border-[#CFE6FF] shadow-[0_6px_18px_rgba(26,115,217,0.16)]"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span
      className="w-2 h-2 rounded-full shrink-0 animate-glow-ring"
      style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
      aria-hidden="true"
    />
    <div className="leading-none">
      <div className="text-[10px] font-bold text-[#0F172A] whitespace-nowrap">{node.label}</div>
      <div className="text-[9px] font-mono text-[#5B6B7F] whitespace-nowrap mt-0.5">
        {node.caption}
      </div>
    </div>
  </div>
);
