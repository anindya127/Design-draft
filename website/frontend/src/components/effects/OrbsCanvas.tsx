'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type OrbSpec = {
    pos: [number, number, number];
    radius: number;
    speed: number;
    color: string;
    drift: [number, number, number];
};

function Orb({ spec }: { spec: OrbSpec }) {
    const ref = useRef<THREE.Mesh>(null);
    const seed = useMemo(() => Math.random() * 1000, []);

    useFrame((state) => {
        const mesh = ref.current;
        if (!mesh) return;
        const t = state.clock.elapsedTime * spec.speed + seed;
        // Organic Lissajous-style drift — each axis on its own period
        mesh.position.x = spec.pos[0] + Math.sin(t * 0.31) * spec.drift[0];
        mesh.position.y = spec.pos[1] + Math.cos(t * 0.23) * spec.drift[1];
        mesh.position.z = spec.pos[2] + Math.sin(t * 0.17) * spec.drift[2];
        // Gentle pulse of the emissive intensity so the orb "breathes"
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.4 + Math.sin(t * 0.9) * 0.45;
    });

    return (
        <mesh ref={ref} position={spec.pos}>
            <sphereGeometry args={[spec.radius, 48, 48]} />
            <meshStandardMaterial
                color={spec.color}
                emissive={spec.color}
                emissiveIntensity={1.5}
                roughness={0.25}
                metalness={0.65}
                toneMapped={false}
            />
        </mesh>
    );
}

export default function OrbsCanvas() {
    const orbs = useMemo<OrbSpec[]>(
        () => [
            { pos: [-3.4, 1.8, -1.5], radius: 0.95, speed: 0.32, color: '#FEBF1D', drift: [1.6, 1.1, 0.7] },
            { pos: [3.2, -1.2, -0.8], radius: 1.25, speed: 0.22, color: '#E6A817', drift: [1.3, 1.4, 0.9] },
            { pos: [-1.1, 2.4, -3.0], radius: 0.7, speed: 0.4, color: '#FFD166', drift: [1.8, 0.8, 1.2] },
            { pos: [2.8, 1.6, 0.4], radius: 0.85, speed: 0.27, color: '#F59E0B', drift: [1.1, 1.3, 0.6] },
            { pos: [-2.2, -2.1, -0.6], radius: 0.75, speed: 0.35, color: '#FEBF1D', drift: [1.5, 0.9, 1.0] },
            { pos: [0.6, -2.4, -2.2], radius: 0.55, speed: 0.48, color: '#FFE08A', drift: [1.4, 1.0, 0.8] },
        ],
        []
    );

    return (
        <Canvas
            camera={{ position: [0, 0, 6.5], fov: 55 }}
            dpr={[1, 1.6]}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
            frameloop="always"
        >
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#0b0906', 6, 16]} />
            <ambientLight intensity={0.35} />
            <pointLight position={[6, 5, 4]} intensity={2.2} color="#FEBF1D" />
            <pointLight position={[-6, -4, 3]} intensity={1.3} color="#FFD166" />
            {orbs.map((o, i) => (
                <Orb key={i} spec={o} />
            ))}
            <EffectComposer enableNormalPass={false}>
                <Bloom
                    intensity={1.35}
                    luminanceThreshold={0.28}
                    luminanceSmoothing={0.85}
                    mipmapBlur
                    kernelSize={KernelSize.LARGE}
                />
            </EffectComposer>
        </Canvas>
    );
}
