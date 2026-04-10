'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, QuadraticBezierLine, RoundedBox, Float, Sparkles, Edges } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { User, QrCode, Zap, Server, Building2, ShieldCheck, Wallet, CreditCard } from 'lucide-react';
import * as THREE from 'three';

interface DiagramProps {
    type: 'B2C' | 'B2B';
}

const b2cNodes = [
    { id: 'user', label: 'User (车手)', icon: User, pos: [-10, 0, 4], color: '#00f0ff' },
    { id: 'qr', label: 'QR Code', icon: QrCode, pos: [-4, 4, 2], color: '#00f0ff' },
    { id: 'charger', label: 'EV Charger', icon: Zap, pos: [2, 4, 0], color: '#00f0ff' },
    { id: 'wallet_user', label: 'Wallet', icon: Wallet, pos: [-4, -4, 4], color: '#00ff66' },
    { id: 'payment', label: 'Payment Co.', icon: CreditCard, pos: [2, -4, 2], color: '#00ff66' },
    { id: 'server', label: 'Server', icon: Server, pos: [8, 0, -2], color: '#00f0ff' },
    { id: 'cpo', label: 'CPO', icon: Building2, pos: [14, 0, 0], color: '#b026ff' },
];

const b2bNodes = [
    { id: 'user', label: 'User (车手)', icon: User, pos: [-12, 0, 4], color: '#00f0ff' },
    { id: 'qr', label: 'QR Code', icon: QrCode, pos: [-6, 4, 2], color: '#00f0ff' },
    { id: 'charger', label: 'EV Charger', icon: Zap, pos: [0, 4, 0], color: '#00f0ff' },
    { id: 'wallet_user', label: 'Wallet', icon: Wallet, pos: [-6, -4, 4], color: '#00ff66' },
    { id: 'payment', label: 'Payment Co.', icon: CreditCard, pos: [0, -4, 2], color: '#00ff66' },
    { id: 'server', label: 'Server', icon: Server, pos: [6, 0, -2], color: '#00f0ff' },
    { id: 'cpo1', label: 'CPO 1', icon: Building2, pos: [12, 5, 0], color: '#b026ff' },
    { id: 'cpo2', label: 'CPO 2', icon: Building2, pos: [12, 0, 0], color: '#b026ff' },
    { id: 'cpo3', label: 'CPO 3', icon: Building2, pos: [12, -5, 0], color: '#b026ff' },
    { id: 'wallet_cpo', label: 'Wallet (Fee)', icon: Wallet, pos: [16, 8, 0], color: '#ffaa00' },
    { id: 'admin', label: 'GCSS Super Admin', icon: ShieldCheck, pos: [20, 0, -4], color: '#ff0055' },
];

type LinkType = {
    start: string;
    end: string;
    color: string;
    dashed: boolean;
    curveOffset?: [number, number, number];
};

const b2cLinks: LinkType[] = [
    { start: 'user', end: 'qr', color: 'blue', dashed: true },
    { start: 'qr', end: 'charger', color: 'blue', dashed: true },
    { start: 'charger', end: 'server', color: 'blue', dashed: false },
    { start: 'server', end: 'cpo', color: 'blue', dashed: false },
    { start: 'user', end: 'wallet_user', color: 'green', dashed: true },
    { start: 'wallet_user', end: 'payment', color: 'green', dashed: false },
    { start: 'payment', end: 'server', color: 'green', dashed: false },
];

const b2bLinks: LinkType[] = [
    { start: 'user', end: 'qr', color: 'blue', dashed: true },
    { start: 'qr', end: 'charger', color: 'blue', dashed: true },
    { start: 'charger', end: 'server', color: 'blue', dashed: false },
    { start: 'server', end: 'cpo1', color: 'blue', dashed: false },
    { start: 'user', end: 'wallet_user', color: 'green', dashed: true },
    { start: 'wallet_user', end: 'payment', color: 'green', dashed: false },
    { start: 'payment', end: 'server', color: 'green', dashed: false },
    { start: 'cpo1', end: 'wallet_cpo', color: 'golden', dashed: false },
    { start: 'wallet_cpo', end: 'admin', color: 'golden', dashed: false },
    { start: 'cpo1', end: 'admin', color: 'blue', dashed: false, curveOffset: [0, 0, -2] },
    { start: 'cpo2', end: 'admin', color: 'blue', dashed: false, curveOffset: [0, 3, -1] },
    { start: 'cpo2', end: 'admin', color: 'golden', dashed: false, curveOffset: [0, -3, -1] },
    { start: 'cpo3', end: 'admin', color: 'blue', dashed: false, curveOffset: [0, 3, -1] },
    { start: 'cpo3', end: 'admin', color: 'golden', dashed: false, curveOffset: [0, -3, -1] },
];

const ArrowHead = ({ mid, end, color }: { mid: [number, number, number], end: [number, number, number], color: string }) => {
    const hexColor = color === 'blue' ? '#00f0ff' : color === 'green' ? '#00ff66' : '#ffaa00';
    const midVec = new THREE.Vector3(...mid);
    const endVec = new THREE.Vector3(...end);

    const direction = new THREE.Vector3().subVectors(endVec, midVec).normalize();
    const arrowPos = endVec.clone().sub(direction.clone().multiplyScalar(2.2));

    if (direction.lengthSq() === 0) direction.set(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    return (
        <mesh position={arrowPos} quaternion={quaternion}>
            <coneGeometry args={[0.25, 0.8, 12]} />
            <meshBasicMaterial color={hexColor} />
        </mesh>
    );
};

interface EdgeProps {
    startPos: [number, number, number];
    endPos: [number, number, number];
    color: string;
    dashed: boolean;
    curveOffset?: [number, number, number];
}

const Edge = ({ startPos, endPos, color, dashed, curveOffset = [0, 0, 0] }: EdgeProps) => {
    const lineRef = useRef<any>(null);

    const midPos: [number, number, number] = [
        (startPos[0] + endPos[0]) / 2 + curveOffset[0],
        (startPos[1] + endPos[1]) / 2 + curveOffset[1],
        (startPos[2] + endPos[2]) / 2 + curveOffset[2],
    ];

    const hexColor = color === 'blue' ? '#00f0ff' : color === 'green' ? '#00ff66' : '#ffaa00';

    useFrame((_, delta) => {
        if (lineRef.current && lineRef.current.material) {
            // Animate the dash offset to create a flowing effect
            lineRef.current.material.dashOffset -= delta * (dashed ? 2 : 4);
        }
    });

    return (
        <group>
            <QuadraticBezierLine
                ref={lineRef}
                start={startPos}
                end={endPos}
                mid={midPos}
                color={hexColor}
                lineWidth={3}
                dashed={true} // Always dashed to show flow animation
                dashScale={5}
                dashSize={dashed ? 0.5 : 2}
                gapSize={dashed ? 0.5 : 0.2}
            />
            <ArrowHead mid={midPos} end={endPos} color={color} />
        </group>
    );
};

const NodeCard = ({ node }: { node: any }) => {
    return (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            <group position={node.pos}>
                {/* 3D Glass Box */}
                <RoundedBox args={[4, 2, 0.2]} radius={0.1} smoothness={4}>
                    <meshPhysicalMaterial
                        color="#0f172a"
                        metalness={0.8}
                        roughness={0.2}
                        transmission={0.9}
                        opacity={1}
                        transparent
                    />
                    <Edges scale={1.01} threshold={15} color={node.color} />
                </RoundedBox>

                {/* HTML Overlay */}
                <Html transform distanceFactor={10} position={[0, 0, 0.11]} center zIndexRange={[100, 0]}>
                    <div
                        className="flex flex-col items-center justify-center w-40 text-white pointer-events-none"
                        style={{ textShadow: `0 0 10px ${node.color}` }}
                    >
                        <node.icon
                            size={32}
                            color={node.color}
                            className="mb-2"
                            style={{ filter: `drop-shadow(0 0 8px ${node.color})` }}
                        />
                        <span className="text-sm font-bold tracking-wider uppercase">
                            {node.label}
                        </span>
                    </div>
                </Html>
            </group>
        </Float>
    );
};

const Scene = ({ type }: DiagramProps) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
            groupRef.current.rotation.x = Math.cos(state.clock.getElapsedTime() * 0.1) * 0.02;
        }
    });

    const nodes = type === 'B2C' ? b2cNodes : b2bNodes;
    const links = type === 'B2C' ? b2cLinks : b2bLinks;

    const getNodePos = (id: string): [number, number, number] => {
        const node = nodes.find(n => n.id === id);
        if (node && node.pos.length === 3) {
            return [node.pos[0], node.pos[1], node.pos[2]];
        }
        return [0, 0, 0];
    };

    return (
        <group ref={groupRef} position={[type === 'B2B' ? -2 : 0, 0, 0]}>
            {links.map((link, i) => (
                <Edge
                    key={i}
                    startPos={getNodePos(link.start)}
                    endPos={getNodePos(link.end)}
                    color={link.color}
                    dashed={link.dashed}
                    curveOffset={link.curveOffset}
                />
            ))}
            {nodes.map(node => (
                <NodeCard key={node.id} node={node} />
            ))}
            <Sparkles count={200} scale={30} size={2} speed={0.4} opacity={0.2} color="#ffffff" />
        </group>
    );
};

export default function Diagram3D({ type }: DiagramProps) {
    return (
        <div className="w-full h-full relative bg-[#020617] cursor-move">
            <Canvas camera={{ position: [4, 0, 28], fov: 45 }}>
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.2} />
                <directionalLight position={[10, 20, 15]} intensity={1.5} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <Scene type={type} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
                </EffectComposer>

                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={10}
                    maxDistance={50}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 4}
                />
            </Canvas>

            {/* Legend */}
            <div className="absolute bottom-6 right-6 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl flex flex-col gap-3 pointer-events-none">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Flow Legend</h4>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-1 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"></div>
                    <span className="text-xs font-medium text-slate-300">Data Flow</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-1 bg-[#00ff66] rounded-full shadow-[0_0_8px_#00ff66]"></div>
                    <span className="text-xs font-medium text-slate-300">Money Flow</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-1 bg-[#ffaa00] rounded-full shadow-[0_0_8px_#ffaa00]"></div>
                    <span className="text-xs font-medium text-slate-300">Revenue Flow</span>
                </div>
                <div className="flex items-center gap-3 mt-1 pt-3 border-t border-slate-700">
                    <div className="w-6 h-0 border-t-2 border-dashed border-slate-500"></div>
                    <span className="text-xs font-medium text-slate-400">Indirect / Scan</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-medium text-center">
                    Drag to rotate • Scroll to zoom
                </div>
            </div>
        </div>
    );
}
