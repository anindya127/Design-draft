'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Html,
    QuadraticBezierLine,
    RoundedBox,
    Float,
    Sparkles,
    Edges,
    Grid,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useTranslations } from 'next-intl';
import { User, QrCode, Zap, Server, Building2, ShieldCheck, Wallet, CreditCard } from 'lucide-react';
import * as THREE from 'three';

interface DiagramProps {
    type: 'B2C' | 'B2B';
}

// GCSS warm palette — every glow stays in the gold/amber family.
const GOLD_BRIGHT = '#FFD95A';
const GOLD_PRIMARY = '#FEBF1D';
const GOLD_AMBER = '#F59E0B';
const GOLD_DEEP = '#C07F00';
const CREAM = '#FFF7D4';
const BG_DEEP = '#120a08';

type NodeData = {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
    pos: [number, number, number];
    color: string;
};

type LinkType = {
    start: string;
    end: string;
    color: string;
    dashed: boolean;
    // Parallel Y-shift for duplicate routes (same endpoints, different flow
    // type) so the two straight lines don't collide.
    offsetY?: number;
};

const b2cLinks: LinkType[] = [
    { start: 'user', end: 'qr', color: 'data', dashed: true },
    { start: 'qr', end: 'charger', color: 'data', dashed: true },
    { start: 'charger', end: 'server', color: 'data', dashed: false },
    { start: 'server', end: 'cpo', color: 'data', dashed: false },
    { start: 'user', end: 'wallet_user', color: 'money', dashed: true },
    { start: 'wallet_user', end: 'payment', color: 'money', dashed: false },
    { start: 'payment', end: 'server', color: 'money', dashed: false },
];

const b2bLinks: LinkType[] = [
    { start: 'user', end: 'qr', color: 'data', dashed: true },
    { start: 'qr', end: 'charger', color: 'data', dashed: true },
    { start: 'charger', end: 'server', color: 'data', dashed: false },
    { start: 'server', end: 'cpo1', color: 'data', dashed: false },
    { start: 'user', end: 'wallet_user', color: 'money', dashed: true },
    { start: 'wallet_user', end: 'payment', color: 'money', dashed: false },
    { start: 'payment', end: 'server', color: 'money', dashed: false },
    { start: 'cpo1', end: 'wallet_cpo', color: 'revenue', dashed: false },
    { start: 'wallet_cpo', end: 'admin', color: 'revenue', dashed: false },
    { start: 'cpo1', end: 'admin', color: 'data', dashed: false },
    // cpo2 → admin has two flow types, offset in Y so both stay straight & visible
    { start: 'cpo2', end: 'admin', color: 'data', dashed: false, offsetY: 0.55 },
    { start: 'cpo2', end: 'admin', color: 'revenue', dashed: false, offsetY: -0.55 },
    // cpo3 → admin same treatment
    { start: 'cpo3', end: 'admin', color: 'data', dashed: false, offsetY: 0.55 },
    { start: 'cpo3', end: 'admin', color: 'revenue', dashed: false, offsetY: -0.55 },
];

const flowColor = (role: string) => {
    if (role === 'data') return GOLD_BRIGHT;
    if (role === 'money') return GOLD_AMBER;
    if (role === 'revenue') return GOLD_DEEP;
    return GOLD_BRIGHT;
};

// ---- Ambient background glow blobs ----
interface BlobLightProps {
    position: [number, number, number];
    color: string;
    scale: number;
    speed: number;
    amplitude: number;
    reducedMotion: boolean;
}
const BlobLight: React.FC<BlobLightProps> = ({ position, color, scale, speed, amplitude, reducedMotion }) => {
    const ref = useRef<THREE.Mesh>(null);
    const base = useRef(position);

    useFrame((state) => {
        if (!ref.current || reducedMotion) return;
        const t = state.clock.getElapsedTime() * speed;
        ref.current.position.x = base.current[0] + Math.sin(t) * amplitude;
        ref.current.position.y = base.current[1] + Math.cos(t * 0.7) * amplitude * 0.6;
    });

    return (
        <mesh ref={ref} position={position}>
            <sphereGeometry args={[scale, 32, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
    );
};

// ---- Arrow head ----
const ArrowHead = ({
    start,
    end,
    color,
}: {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
}) => {
    const hex = flowColor(color);
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);

    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    const arrowPos = endVec.clone().sub(direction.clone().multiplyScalar(2.2));

    if (direction.lengthSq() === 0) direction.set(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
    );

    return (
        <mesh position={arrowPos} quaternion={quaternion}>
            <coneGeometry args={[0.3, 0.95, 16]} />
            <meshBasicMaterial color={hex} />
        </mesh>
    );
};

// ---- Animated straight edge ----
interface EdgeProps {
    startPos: [number, number, number];
    endPos: [number, number, number];
    color: string;
    dashed: boolean;
    offsetY?: number;
    reducedMotion: boolean;
}
const Edge = ({ startPos, endPos, color, dashed, offsetY = 0, reducedMotion }: EdgeProps) => {
    const lineRef = useRef<any>(null);

    // Apply Y offset to both endpoints so the line stays perfectly straight
    const s: [number, number, number] = [startPos[0], startPos[1] + offsetY, startPos[2]];
    const e: [number, number, number] = [endPos[0], endPos[1] + offsetY, endPos[2]];

    // Exact midpoint → QuadraticBezierLine degenerates to a straight line
    const mid: [number, number, number] = [
        (s[0] + e[0]) / 2,
        (s[1] + e[1]) / 2,
        (s[2] + e[2]) / 2,
    ];

    const hex = flowColor(color);

    useFrame((_, delta) => {
        if (lineRef.current && lineRef.current.material && !reducedMotion) {
            lineRef.current.material.dashOffset -= delta * (dashed ? 2 : 4);
        }
    });

    return (
        <group>
            <QuadraticBezierLine
                ref={lineRef}
                start={s}
                end={e}
                mid={mid}
                color={hex}
                lineWidth={3}
                dashed={true}
                dashScale={5}
                dashSize={dashed ? 0.5 : 2}
                gapSize={dashed ? 0.5 : 0.2}
            />
            <ArrowHead start={s} end={e} color={color} />
        </group>
    );
};

// ---- 3D node card ----
interface NodeCardProps {
    node: NodeData;
    index: number;
    reducedMotion: boolean;
}
const NodeCard = ({ node, index, reducedMotion }: NodeCardProps) => {
    const [hovered, setHovered] = useState(false);
    const groupRef = useRef<THREE.Group>(null);
    const scaleRef = useRef(reducedMotion ? 1 : 0);
    const targetScale = useRef(1);

    const entranceDelay = useRef(reducedMotion ? 0 : 0.12 + index * 0.08);
    const elapsedRef = useRef(0);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        elapsedRef.current += delta;

        if (elapsedRef.current > entranceDelay.current && scaleRef.current < 1) {
            const t = Math.min(1, (elapsedRef.current - entranceDelay.current) / 0.6);
            scaleRef.current = 1 - Math.pow(1 - t, 3);
        }

        const desiredHover = hovered ? 1.08 : 1;
        targetScale.current = THREE.MathUtils.lerp(targetScale.current, desiredHover, 0.15);

        const finalScale = scaleRef.current * targetScale.current;
        groupRef.current.scale.set(finalScale, finalScale, finalScale);
    });

    return (
        <Float speed={1.6} rotationIntensity={0.08} floatIntensity={0.18}>
            <group
                ref={groupRef}
                position={node.pos}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = '';
                }}
            >
                <mesh position={[0, 0, -0.3]}>
                    <planeGeometry args={[5.5, 3.5]} />
                    <meshBasicMaterial
                        color={node.color}
                        transparent
                        opacity={hovered ? 0.22 : 0.1}
                    />
                </mesh>

                <RoundedBox args={[4, 2, 0.22]} radius={0.14} smoothness={4}>
                    <meshPhysicalMaterial
                        color="#2a1f18"
                        metalness={0.82}
                        roughness={0.22}
                        transmission={0.38}
                        opacity={0.96}
                        transparent
                        clearcoat={0.75}
                        clearcoatRoughness={0.18}
                        reflectivity={0.6}
                    />
                    <Edges scale={1.01} threshold={15} color={hovered ? CREAM : node.color} />
                </RoundedBox>

                <Html transform distanceFactor={10} position={[0, 0, 0.12]} center zIndexRange={[100, 0]}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '168px',
                            color: CREAM,
                            pointerEvents: 'none',
                            fontFamily: '"Inter", "PingFang SC", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                            textShadow: `0 0 14px ${node.color}`,
                            transition: 'text-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <node.icon
                            size={34}
                            color={node.color}
                            style={{
                                marginBottom: '8px',
                                filter: `drop-shadow(0 0 ${hovered ? '14px' : '10px'} ${node.color})`,
                                transition: 'filter 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        />
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                            }}
                        >
                            {node.label}
                        </span>
                    </div>
                </Html>
            </group>
        </Float>
    );
};

// ---- Scene ----
interface SceneProps {
    nodes: NodeData[];
    links: LinkType[];
    type: 'B2C' | 'B2B';
    reducedMotion: boolean;
}
const Scene = ({ nodes, links, type, reducedMotion }: SceneProps) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current || reducedMotion) return;
        groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.04;
        groupRef.current.rotation.x = Math.cos(state.clock.getElapsedTime() * 0.1) * 0.015;
    });

    const getNodePos = (id: string): [number, number, number] => {
        const node = nodes.find((n) => n.id === id);
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
                    offsetY={link.offsetY}
                    reducedMotion={reducedMotion}
                />
            ))}
            {nodes.map((node, i) => (
                <NodeCard key={node.id} node={node} index={i} reducedMotion={reducedMotion} />
            ))}
            <Sparkles count={220} scale={34} size={2.5} speed={reducedMotion ? 0 : 0.35} opacity={0.42} color={GOLD_BRIGHT} />
        </group>
    );
};

const legendRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
};
const legendLineStyle = (color: string): React.CSSProperties => ({
    width: '28px',
    height: '3px',
    borderRadius: '999px',
    background: color,
    boxShadow: `0 0 12px ${color}`,
});

// ---- Root component ----
export default function Diagram3D({ type }: DiagramProps) {
    const t = useTranslations();
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Localized node arrays — recomputed only when translation function changes
    const b2cNodes = useMemo<NodeData[]>(
        () => [
            { id: 'user', label: t('models.diagram.nodes.user'), icon: User, pos: [-10, 0, 4], color: GOLD_BRIGHT },
            { id: 'qr', label: t('models.diagram.nodes.qr'), icon: QrCode, pos: [-4, 4, 2], color: GOLD_BRIGHT },
            { id: 'charger', label: t('models.diagram.nodes.charger'), icon: Zap, pos: [2, 4, 0], color: GOLD_PRIMARY },
            { id: 'wallet_user', label: t('models.diagram.nodes.wallet'), icon: Wallet, pos: [-4, -4, 4], color: GOLD_AMBER },
            { id: 'payment', label: t('models.diagram.nodes.payment'), icon: CreditCard, pos: [2, -4, 2], color: GOLD_AMBER },
            { id: 'server', label: t('models.diagram.nodes.server'), icon: Server, pos: [8, 0, -2], color: GOLD_PRIMARY },
            { id: 'cpo', label: t('models.diagram.nodes.cpo'), icon: Building2, pos: [14, 0, 0], color: GOLD_DEEP },
        ],
        [t]
    );

    const b2bNodes = useMemo<NodeData[]>(
        () => [
            { id: 'user', label: t('models.diagram.nodes.user'), icon: User, pos: [-12, 0, 4], color: GOLD_BRIGHT },
            { id: 'qr', label: t('models.diagram.nodes.qr'), icon: QrCode, pos: [-6, 4, 2], color: GOLD_BRIGHT },
            { id: 'charger', label: t('models.diagram.nodes.charger'), icon: Zap, pos: [0, 4, 0], color: GOLD_PRIMARY },
            { id: 'wallet_user', label: t('models.diagram.nodes.wallet'), icon: Wallet, pos: [-6, -4, 4], color: GOLD_AMBER },
            { id: 'payment', label: t('models.diagram.nodes.payment'), icon: CreditCard, pos: [0, -4, 2], color: GOLD_AMBER },
            { id: 'server', label: t('models.diagram.nodes.server'), icon: Server, pos: [6, 0, -2], color: GOLD_PRIMARY },
            { id: 'cpo1', label: t('models.diagram.nodes.cpo1'), icon: Building2, pos: [12, 5, 0], color: GOLD_DEEP },
            { id: 'cpo2', label: t('models.diagram.nodes.cpo2'), icon: Building2, pos: [12, 0, 0], color: GOLD_DEEP },
            { id: 'cpo3', label: t('models.diagram.nodes.cpo3'), icon: Building2, pos: [12, -5, 0], color: GOLD_DEEP },
            { id: 'wallet_cpo', label: t('models.diagram.nodes.walletFee'), icon: Wallet, pos: [16, 8, 0], color: GOLD_AMBER },
            { id: 'admin', label: t('models.diagram.nodes.admin'), icon: ShieldCheck, pos: [20, 0, -4], color: GOLD_DEEP },
        ],
        [t]
    );

    const nodes = type === 'B2C' ? b2cNodes : b2bNodes;
    const links = type === 'B2C' ? b2cLinks : b2bLinks;

    const blobs = useMemo(
        () => [
            { position: [-18, 8, -12] as [number, number, number], color: GOLD_PRIMARY, scale: 9, speed: 0.08, amplitude: 2.2 },
            { position: [20, -6, -14] as [number, number, number], color: GOLD_DEEP, scale: 11, speed: 0.06, amplitude: 2.6 },
            { position: [0, -14, -10] as [number, number, number], color: GOLD_AMBER, scale: 8, speed: 0.09, amplitude: 2.0 },
        ],
        []
    );

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: `radial-gradient(ellipse at 50% 45%, #2a1f18 0%, #1a1210 55%, ${BG_DEEP} 100%)`,
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'move',
            }}
        >
            <Canvas camera={{ position: [4, 2, 28], fov: 48 }} dpr={[1, 2]}>
                <color attach="background" args={[BG_DEEP]} />
                <fog attach="fog" args={[BG_DEEP, 30, 70]} />

                <ambientLight intensity={0.32} />
                <directionalLight position={[10, 20, 15]} intensity={1.5} color="#fff5d6" />
                <pointLight position={[-10, -10, -10]} intensity={0.45} color={GOLD_DEEP} distance={45} decay={1.5} />
                <pointLight position={[0, 0, 12]} intensity={0.35} color={GOLD_BRIGHT} distance={40} decay={1.5} />
                <pointLight position={[18, 10, -6]} intensity={0.3} color={GOLD_AMBER} distance={35} decay={1.5} />

                {blobs.map((b, i) => (
                    <BlobLight key={i} {...b} reducedMotion={reducedMotion} />
                ))}

                <Grid
                    position={[0, -8, 0]}
                    args={[80, 80]}
                    cellSize={2}
                    cellThickness={0.5}
                    cellColor={GOLD_DEEP}
                    sectionSize={10}
                    sectionThickness={1}
                    sectionColor={GOLD_PRIMARY}
                    fadeDistance={50}
                    fadeStrength={1.2}
                    infiniteGrid={false}
                />

                <Scene nodes={nodes} links={links} type={type} reducedMotion={reducedMotion} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.8} radius={0.85} />
                    <Vignette offset={0.3} darkness={0.55} />
                </EffectComposer>

                <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    minDistance={10}
                    maxDistance={55}
                    maxPolarAngle={Math.PI / 1.45}
                    minPolarAngle={Math.PI / 4}
                    enableDamping
                    dampingFactor={0.08}
                />
            </Canvas>

            {/* Legend */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'rgba(26, 18, 16, 0.78)',
                    WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
                    backdropFilter: 'blur(14px) saturate(1.2)',
                    padding: '16px 18px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 217, 90, 0.22)',
                    boxShadow:
                        '0 12px 40px rgba(0, 0, 0, 0.55), 0 0 28px rgba(192, 127, 0, 0.18), inset 0 1px 0 rgba(255, 247, 212, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px',
                    pointerEvents: 'none',
                    minWidth: '188px',
                    fontFamily: '"Inter", "PingFang SC", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <h4
                    style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: GOLD_BRIGHT,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        margin: 0,
                        marginBottom: '3px',
                        textShadow: `0 0 10px ${GOLD_BRIGHT}`,
                    }}
                >
                    {t('models.diagram.legend.title')}
                </h4>
                <div style={legendRowStyle}>
                    <div style={legendLineStyle(GOLD_BRIGHT)} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: CREAM }}>
                        {t('models.diagram.legend.data')}
                    </span>
                </div>
                <div style={legendRowStyle}>
                    <div style={legendLineStyle(GOLD_AMBER)} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: CREAM }}>
                        {t('models.diagram.legend.money')}
                    </span>
                </div>
                <div style={legendRowStyle}>
                    <div style={legendLineStyle(GOLD_DEEP)} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: CREAM }}>
                        {t('models.diagram.legend.revenue')}
                    </span>
                </div>
                <div
                    style={{
                        ...legendRowStyle,
                        marginTop: '4px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255, 217, 90, 0.16)',
                    }}
                >
                    <div
                        style={{
                            width: '28px',
                            borderTop: `2px dashed ${GOLD_BRIGHT}`,
                            opacity: 0.7,
                        }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255, 247, 212, 0.7)' }}>
                        {t('models.diagram.legend.indirect')}
                    </span>
                </div>
                <div
                    style={{
                        marginTop: '6px',
                        fontSize: '9px',
                        color: 'rgba(255, 247, 212, 0.5)',
                        fontWeight: 500,
                        textAlign: 'center',
                        letterSpacing: '0.05em',
                    }}
                >
                    {t('models.diagram.legend.hint')}
                </div>
            </div>
        </div>
    );
}
