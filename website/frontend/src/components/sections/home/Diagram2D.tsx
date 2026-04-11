'use client';

import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import {
    User,
    QrCode,
    Zap,
    Server,
    Building2,
    ShieldCheck,
    Wallet,
    CreditCard,
} from 'lucide-react';
import './Diagram2D.css';

interface DiagramProps {
    type: 'B2C' | 'B2B';
}

// --- GCSS warm palette (matches site theme) ---
const GOLD_BRIGHT = '#FFD95A';
const GOLD_PRIMARY = '#FEBF1D';
const GOLD_AMBER = '#F59E0B';
const GOLD_DEEP = '#C07F00';
const CREAM = '#FFF7D4';

type Flow = 'data' | 'money' | 'revenue';

const flowColors: Record<Flow, string> = {
    data: GOLD_BRIGHT,
    money: GOLD_AMBER,
    revenue: GOLD_DEEP,
};

type NodeDef = {
    id: string;
    labelKey: string;
    icon: LucideIcon;
    x: number; // center x
    y: number; // center y
    accent: string;
};

type LinkDef = {
    from: string;
    to: string;
    flow: Flow;
    // indirect = the "scan / implicit" style (short dashes)
    // default = the "flowing" style (long dashes moving)
    indirect?: boolean;
    // perpendicular offset for curved separation of duplicate routes
    curveOffset?: number;
};

const NODE_W = 148;
const NODE_H = 64;

// =============================================================
// B2C — 5-column grid + payment loop below
// viewBox 1100 × 500
// =============================================================
const B2C_VIEWBOX = { w: 1100, h: 500 };

const b2cNodes: NodeDef[] = [
    // Main row (y=160)
    { id: 'user', labelKey: 'user', icon: User, x: 130, y: 160, accent: GOLD_BRIGHT },
    { id: 'qr', labelKey: 'qr', icon: QrCode, x: 340, y: 160, accent: GOLD_BRIGHT },
    { id: 'charger', labelKey: 'charger', icon: Zap, x: 550, y: 160, accent: GOLD_PRIMARY },
    { id: 'server', labelKey: 'server', icon: Server, x: 760, y: 160, accent: GOLD_PRIMARY },
    { id: 'cpo', labelKey: 'cpo', icon: Building2, x: 970, y: 160, accent: GOLD_DEEP },
    // Payment row (y=390)
    { id: 'wallet_user', labelKey: 'wallet', icon: Wallet, x: 130, y: 390, accent: GOLD_AMBER },
    { id: 'payment', labelKey: 'payment', icon: CreditCard, x: 340, y: 390, accent: GOLD_AMBER },
];

// B2C flows (per spec):
//   Data: user→qr→charger→server→cpo
//   Money: user→wallet→payment→server→cpo   (both data & money land on cpo)
const b2cLinks: LinkDef[] = [
    { from: 'user', to: 'qr', flow: 'data', indirect: true },
    { from: 'qr', to: 'charger', flow: 'data', indirect: true },
    { from: 'charger', to: 'server', flow: 'data' },
    // server→cpo has BOTH data and money flowing in parallel
    { from: 'server', to: 'cpo', flow: 'data', curveOffset: -24 },
    { from: 'server', to: 'cpo', flow: 'money', curveOffset: 24 },
    { from: 'user', to: 'wallet_user', flow: 'money', indirect: true },
    { from: 'wallet_user', to: 'payment', flow: 'money' },
    { from: 'payment', to: 'server', flow: 'money' },
];

// =============================================================
// B2B — main row + CPO fan + Fee/Admin + payment loop
// viewBox 1200 × 520
// =============================================================
const B2B_VIEWBOX = { w: 1200, h: 520 };

const b2bNodes: NodeDef[] = [
    // Main row (y=190)
    { id: 'user', labelKey: 'user', icon: User, x: 90, y: 190, accent: GOLD_BRIGHT },
    { id: 'qr', labelKey: 'qr', icon: QrCode, x: 260, y: 190, accent: GOLD_BRIGHT },
    { id: 'charger', labelKey: 'charger', icon: Zap, x: 430, y: 190, accent: GOLD_PRIMARY },
    { id: 'server', labelKey: 'server', icon: Server, x: 600, y: 190, accent: GOLD_PRIMARY },
    // CPO column (x=780)
    { id: 'cpo1', labelKey: 'cpo1', icon: Building2, x: 780, y: 70, accent: GOLD_DEEP },
    { id: 'cpo2', labelKey: 'cpo2', icon: Building2, x: 780, y: 190, accent: GOLD_DEEP },
    { id: 'cpo3', labelKey: 'cpo3', icon: Building2, x: 780, y: 310, accent: GOLD_DEEP },
    // Fee wallet (top-right, x=960)
    { id: 'wallet_cpo', labelKey: 'walletFee', icon: Wallet, x: 960, y: 70, accent: GOLD_AMBER },
    // Admin (far right)
    { id: 'admin', labelKey: 'admin', icon: ShieldCheck, x: 1110, y: 190, accent: GOLD_DEEP },
    // Payment row (y=440)
    { id: 'wallet_user', labelKey: 'wallet', icon: Wallet, x: 90, y: 440, accent: GOLD_AMBER },
    { id: 'payment', labelKey: 'payment', icon: CreditCard, x: 260, y: 440, accent: GOLD_AMBER },
];

// B2B flows (per spec):
//   Data:    user→qr→charger→server→cpo1→admin
//            cpo2→admin
//            cpo3→admin
//   Revenue: cpo1→wallet(fee)→admin
//            cpo2→admin
//            cpo3→admin
//   Money:   user→wallet→payment→server
const b2bLinks: LinkDef[] = [
    // Data flow
    { from: 'user', to: 'qr', flow: 'data', indirect: true },
    { from: 'qr', to: 'charger', flow: 'data', indirect: true },
    { from: 'charger', to: 'server', flow: 'data' },
    { from: 'server', to: 'cpo1', flow: 'data' },
    { from: 'cpo1', to: 'admin', flow: 'data' },
    { from: 'cpo2', to: 'admin', flow: 'data', curveOffset: -26 },
    { from: 'cpo3', to: 'admin', flow: 'data', curveOffset: -26 },
    // Revenue flow
    { from: 'cpo1', to: 'wallet_cpo', flow: 'revenue' },
    { from: 'wallet_cpo', to: 'admin', flow: 'revenue' },
    { from: 'cpo2', to: 'admin', flow: 'revenue', curveOffset: 26 },
    { from: 'cpo3', to: 'admin', flow: 'revenue', curveOffset: 26 },
    // Payment flow
    { from: 'user', to: 'wallet_user', flow: 'money', indirect: true },
    { from: 'wallet_user', to: 'payment', flow: 'money' },
    { from: 'payment', to: 'server', flow: 'money' },
];

// ---- Geometry helpers ----

/** Intersect a line from `center` toward `target` with the rect edge. */
function edgePoint(
    center: [number, number],
    target: [number, number],
    halfW: number,
    halfH: number
): [number, number] {
    const [cx, cy] = center;
    const [tx, ty] = target;
    const dx = tx - cx;
    const dy = ty - cy;
    if (dx === 0 && dy === 0) return center;
    const absDx = Math.abs(dx) || 1e-6;
    const absDy = Math.abs(dy) || 1e-6;
    const scaleX = halfW / absDx;
    const scaleY = halfH / absDy;
    const scale = Math.min(scaleX, scaleY);
    return [cx + dx * scale, cy + dy * scale];
}

/** Build an SVG path string between two points with optional perpendicular curve. */
function pathBetween(
    start: [number, number],
    end: [number, number],
    curveOffset: number = 0
): string {
    const [sx, sy] = start;
    const [ex, ey] = end;
    if (curveOffset === 0) {
        return `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len; // perpendicular x
    const py = dx / len;  // perpendicular y
    const mx = (sx + ex) / 2 + px * curveOffset;
    const my = (sy + ey) / 2 + py * curveOffset;
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

// ---- Main component ----

export default function Diagram2D({ type }: DiagramProps) {
    const t = useTranslations();
    const locale = useLocale();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const viewBox = type === 'B2C' ? B2C_VIEWBOX : B2B_VIEWBOX;
    const rawNodes = type === 'B2C' ? b2cNodes : b2bNodes;
    const links = type === 'B2C' ? b2cLinks : b2bLinks;

    // Localize labels keyed on stable locale string (avoids t-closure churn)
    const nodes = useMemo(
        () => rawNodes.map((n) => ({ ...n, label: t(`models.diagram.nodes.${n.labelKey}`) })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [rawNodes, locale]
    );

    // Fast lookup
    const nodeById = useMemo(() => {
        const map = new Map<string, (typeof nodes)[0]>();
        for (const n of nodes) map.set(n.id, n);
        return map;
    }, [nodes]);

    // Precompute link paths
    const linkPaths = useMemo(() => {
        const padW = NODE_W / 2 + 6; // 6px gap so arrow sits outside the card
        const padH = NODE_H / 2 + 6;
        return links
            .map((link, idx) => {
                const fromNode = nodeById.get(link.from);
                const toNode = nodeById.get(link.to);
                if (!fromNode || !toNode) return null;
                const start = edgePoint(
                    [fromNode.x, fromNode.y],
                    [toNode.x, toNode.y],
                    padW,
                    padH
                );
                const end = edgePoint(
                    [toNode.x, toNode.y],
                    [fromNode.x, fromNode.y],
                    padW,
                    padH
                );
                const d = pathBetween(start, end, link.curveOffset ?? 0);
                return { ...link, d, idx };
            })
            .filter((v): v is LinkDef & { d: string; idx: number } => v !== null);
    }, [links, nodeById]);

    return (
        <div className="diagram2d-root">
            <svg
                className="diagram2d-svg"
                viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Arrow-head markers, one per flow color */}
                    {(['data', 'money', 'revenue'] as Flow[]).map((flow) => (
                        <marker
                            key={flow}
                            id={`diagram2d-arrow-${flow}`}
                            viewBox="0 0 10 10"
                            refX="9"
                            refY="5"
                            markerWidth="7"
                            markerHeight="7"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 Z" fill={flowColors[flow]} />
                        </marker>
                    ))}
                    {/* Subtle glow filter for links */}
                    <filter id="diagram2d-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Background grid pattern */}
                    <pattern
                        id="diagram2d-grid"
                        x="0"
                        y="0"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke={GOLD_DEEP}
                            strokeOpacity="0.08"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>

                {/* Background grid */}
                <rect width={viewBox.w} height={viewBox.h} fill="url(#diagram2d-grid)" />

                {/* Links */}
                <g className="diagram2d-links">
                    {linkPaths.map((link) => {
                        const dimmed =
                            hoveredId !== null &&
                            hoveredId !== link.from &&
                            hoveredId !== link.to;
                        const dasharray = link.indirect ? '4 4' : '14 6';
                        return (
                            <path
                                key={link.idx}
                                d={link.d}
                                className={`diagram2d-link animate ${link.indirect ? 'dashed' : 'solid'}`}
                                stroke={flowColors[link.flow]}
                                strokeWidth={link.indirect ? 1.8 : 2.6}
                                strokeDasharray={dasharray}
                                markerEnd={`url(#diagram2d-arrow-${link.flow})`}
                                opacity={dimmed ? 0.18 : 1}
                                filter="url(#diagram2d-glow)"
                            />
                        );
                    })}
                </g>

                {/* Nodes */}
                <g className="diagram2d-nodes">
                    {nodes.map((node, i) => {
                        const isHovered = hoveredId === node.id;
                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x}, ${node.y})`}
                                className="diagram2d-node-entrance"
                                style={{ animationDelay: `${120 + i * 70}ms` }}
                            >
                                <g
                                    className={`diagram2d-node-inner ${isHovered ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredId(node.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <g transform={`translate(${-NODE_W / 2}, ${-NODE_H / 2})`}>
                                        {/* Hover outer glow */}
                                        {isHovered && (
                                            <rect
                                                x="-5"
                                                y="-5"
                                                width={NODE_W + 10}
                                                height={NODE_H + 10}
                                                rx="12"
                                                fill="none"
                                                stroke={node.accent}
                                                strokeWidth="2"
                                                strokeOpacity="0.45"
                                                style={{
                                                    filter: `drop-shadow(0 0 10px ${node.accent})`,
                                                }}
                                            />
                                        )}
                                        {/* Card background */}
                                        <rect
                                            className="diagram2d-node-card"
                                            x="0"
                                            y="0"
                                            width={NODE_W}
                                            height={NODE_H}
                                            rx="10"
                                            fill="#2a1f18"
                                            stroke={node.accent}
                                            strokeWidth="1.5"
                                            strokeOpacity={isHovered ? 1 : 0.55}
                                        />
                                        {/* Inner 1px highlight stroke */}
                                        <rect
                                            x="1"
                                            y="1"
                                            width={NODE_W - 2}
                                            height={NODE_H - 2}
                                            rx="9"
                                            fill="none"
                                            stroke={CREAM}
                                            strokeOpacity="0.04"
                                        />
                                        {/* Icon circle */}
                                        <circle
                                            cx="32"
                                            cy={NODE_H / 2}
                                            r="19"
                                            fill={node.accent}
                                            fillOpacity="0.14"
                                            stroke={node.accent}
                                            strokeOpacity="0.55"
                                        />
                                        {/* Lucide icon via foreignObject */}
                                        <foreignObject
                                            x="18"
                                            y={NODE_H / 2 - 14}
                                            width="28"
                                            height="28"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    height: '100%',
                                                }}
                                            >
                                                <node.icon
                                                    size={22}
                                                    color={node.accent}
                                                    strokeWidth={2}
                                                    style={{
                                                        filter: `drop-shadow(0 0 4px ${node.accent})`,
                                                    }}
                                                />
                                            </div>
                                        </foreignObject>
                                        {/* Label */}
                                        <text
                                            x="62"
                                            y={NODE_H / 2 + 5}
                                            fill={CREAM}
                                            fontSize="13"
                                            fontWeight="600"
                                            fontFamily='"Inter", "PingFang SC", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
                                            letterSpacing="0.02em"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {node.label}
                                        </text>
                                    </g>
                                </g>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Legend */}
            <div className="diagram2d-legend">
                <h4>{t('models.diagram.legend.title')}</h4>
                <div className="diagram2d-legend-row">
                    <div
                        className="diagram2d-legend-line"
                        style={{ background: GOLD_BRIGHT, boxShadow: `0 0 12px ${GOLD_BRIGHT}` }}
                    />
                    <span>{t('models.diagram.legend.data')}</span>
                </div>
                <div className="diagram2d-legend-row">
                    <div
                        className="diagram2d-legend-line"
                        style={{ background: GOLD_AMBER, boxShadow: `0 0 12px ${GOLD_AMBER}` }}
                    />
                    <span>{t('models.diagram.legend.money')}</span>
                </div>
                <div className="diagram2d-legend-row">
                    <div
                        className="diagram2d-legend-line"
                        style={{ background: GOLD_DEEP, boxShadow: `0 0 12px ${GOLD_DEEP}` }}
                    />
                    <span>{t('models.diagram.legend.revenue')}</span>
                </div>
                <div className="diagram2d-legend-row diagram2d-legend-divider">
                    <div className="diagram2d-legend-dashed" />
                    <span>{t('models.diagram.legend.indirect')}</span>
                </div>
                <div className="diagram2d-legend-hint">
                    {t('models.diagram.legend.hint')}
                </div>
            </div>
        </div>
    );
}
