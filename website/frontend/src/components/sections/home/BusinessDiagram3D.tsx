'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import './BusinessDiagram3D.css';

/* ── SVG Icons ─────────────────────────────────────────── */
const ico = {
  user: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  qr: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="15" y="15" width="2" height="2" />
      <path d="M21 15v2h-2M15 21h2v-2M21 19v2h-2" />
    </svg>
  ),
  charger: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  server: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  monitor: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  admin: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
};

/* ── Animated arrow flow dot ───────────────────────────── */
function FlowDot({ pathId, color, dur = '2s' }: { pathId: string; color: string; dur?: string }) {
  return (
    <circle r="4" fill={color} opacity="0.9">
      <animateMotion dur={dur} repeatCount="indefinite">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

/* ── SVG Arrow Markers (shared defs) ──────────────────── */
function ArrowDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <marker id={`${prefix}-ag`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,1 L10,5 L0,9z" fill="#10B981" />
      </marker>
      <marker id={`${prefix}-ab`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,1 L10,5 L0,9z" fill="#3B82F6" />
      </marker>
      <marker id={`${prefix}-ay`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,1 L10,5 L0,9z" fill="#9CA3AF" />
      </marker>
    </defs>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function BusinessDiagram3D() {
  const t = useTranslations('businessFlow');
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<'b2c' | 'b2b2c'>('b2c');

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  /* ── B2C Diagram ──────────────────────────────────────── */
  const b2cDiagram = (
    <div className="bf-canvas bf-canvas-b2c" key="b2c">
      {/* SVG arrows layer */}
      <svg className="bf-svg" viewBox="0 0 800 340" preserveAspectRatio="xMidYMid meet">
        <ArrowDefs prefix="c" />

        {/* Scan: User → QR Code */}
        <path id="c-s1" d="M 172,75 L 258,75" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#c-ay)" />
        <text x="215" y="63" textAnchor="middle" className="bf-arrow-label bf-arrow-label-gray">scan</text>

        {/* Scan: QR Code → EV Charger */}
        <path id="c-s2" d="M 378,75 L 468,75" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#c-ay)" />
        <text x="423" y="63" textAnchor="middle" className="bf-arrow-label bf-arrow-label-gray">scan</text>

        {/* Money (green): EV Charger → Server */}
        <path id="c-m1" d="M 510,122 Q 430,172 342,213" fill="none" stroke="#10B981" strokeWidth="2.5" markerEnd="url(#c-ag)" opacity="0.85" />
        <FlowDot pathId="c-m1" color="#10B981" dur="2s" />

        {/* Data (blue): EV Charger → Server */}
        <path id="c-d1" d="M 548,122 Q 460,172 360,213" fill="none" stroke="#3B82F6" strokeWidth="2.5" markerEnd="url(#c-ab)" opacity="0.85" />
        <FlowDot pathId="c-d1" color="#3B82F6" dur="2.2s" />

        {/* Data (blue): Server → User */}
        <path id="c-d2" d="M 250,258 Q 178,200 120,122" fill="none" stroke="#3B82F6" strokeWidth="2.5" markerEnd="url(#c-ab)" opacity="0.85" />
        <FlowDot pathId="c-d2" color="#3B82F6" dur="2s" />

        {/* Money (green): Server → CPO */}
        <path id="c-m2" d="M 395,252 L 518,252" fill="none" stroke="#10B981" strokeWidth="2.5" markerEnd="url(#c-ag)" opacity="0.85" />
        <FlowDot pathId="c-m2" color="#10B981" dur="1.5s" />

        {/* Data (blue): Server → CPO */}
        <path id="c-d3" d="M 395,272 L 518,272" fill="none" stroke="#3B82F6" strokeWidth="2.5" markerEnd="url(#c-ab)" opacity="0.85" />
        <FlowDot pathId="c-d3" color="#3B82F6" dur="1.7s" />
      </svg>

      {/* ── 3D Nodes ── */}

      {/* User / Driver */}
      <div className="bf-node bf-c-teal" style={{ left: 105, top: 75, animationDelay: '0s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.user}</div>
          <span className="bf-label">{t('driver')}</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="bf-node bf-c-gray" style={{ left: 320, top: 75, animationDelay: '0.08s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.qr}</div>
          <span className="bf-label">{t('qrCode')}</span>
        </div>
      </div>

      {/* EV Charger */}
      <div className="bf-node bf-c-blue" style={{ left: 535, top: 75, animationDelay: '0.16s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.charger}</div>
          <span className="bf-label">{t('charger')}</span>
        </div>
      </div>

      {/* Server */}
      <div className="bf-node bf-c-indigo" style={{ left: 320, top: 260, animationDelay: '0.24s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.server}</div>
          <span className="bf-label">{t('server')}</span>
        </div>
      </div>

      {/* CPO */}
      <div className="bf-node bf-c-purple" style={{ left: 590, top: 260, animationDelay: '0.32s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.monitor}</div>
          <span className="bf-label">CPO</span>
        </div>
      </div>
    </div>
  );

  /* ── B2B2C Diagram ────────────────────────────────────── */
  const b2b2cDiagram = (
    <div className="bf-canvas bf-canvas-b2b2c" key="b2b2c">
      <svg className="bf-svg" viewBox="0 0 800 590" preserveAspectRatio="xMidYMid meet">
        <ArrowDefs prefix="b" />

        {/* === SAME B2C FLOW ON TOP === */}

        {/* Scan: User → QR */}
        <path id="b-s1" d="M 172,75 L 258,75" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#b-ay)" />
        <text x="215" y="63" textAnchor="middle" className="bf-arrow-label bf-arrow-label-gray">scan</text>

        {/* Scan: QR → Charger */}
        <path id="b-s2" d="M 378,75 L 468,75" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#b-ay)" />
        <text x="423" y="63" textAnchor="middle" className="bf-arrow-label bf-arrow-label-gray">scan</text>

        {/* Money: Charger → Server */}
        <path id="b-m1" d="M 510,122 Q 430,172 342,213" fill="none" stroke="#10B981" strokeWidth="2.5" markerEnd="url(#b-ag)" opacity="0.85" />
        <FlowDot pathId="b-m1" color="#10B981" dur="2s" />

        {/* Data: Charger → Server */}
        <path id="b-d1" d="M 548,122 Q 460,172 360,213" fill="none" stroke="#3B82F6" strokeWidth="2.5" markerEnd="url(#b-ab)" opacity="0.85" />
        <FlowDot pathId="b-d1" color="#3B82F6" dur="2.2s" />

        {/* Data: Server → User */}
        <path id="b-d2" d="M 250,258 Q 178,200 120,122" fill="none" stroke="#3B82F6" strokeWidth="2.5" markerEnd="url(#b-ab)" opacity="0.85" />
        <FlowDot pathId="b-d2" color="#3B82F6" dur="2s" />

        {/* === B2B2C EXTENSION: Server → Multiple CPOs → Super Admin === */}

        {/* Divider */}
        <line x1="60" y1="338" x2="740" y2="338" stroke="var(--bf-divider, #CBD5E1)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

        {/* Money (green): Server → CPO 1 */}
        <path id="b-sc1g" d="M 288,305 L 112,378" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#b-ag)" opacity="0.8" />
        <FlowDot pathId="b-sc1g" color="#10B981" dur="1.8s" />

        {/* Data (blue): Server → CPO 1 */}
        <path id="b-sc1b" d="M 296,305 L 120,378" fill="none" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#b-ab)" opacity="0.8" />
        <FlowDot pathId="b-sc1b" color="#3B82F6" dur="2s" />

        {/* Money: Server → CPO 2 */}
        <path id="b-sc2g" d="M 335,305 L 395,378" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#b-ag)" opacity="0.8" />
        <FlowDot pathId="b-sc2g" color="#10B981" dur="1.5s" />

        {/* Data: Server → CPO 2 */}
        <path id="b-sc2b" d="M 345,305 L 405,378" fill="none" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#b-ab)" opacity="0.8" />
        <FlowDot pathId="b-sc2b" color="#3B82F6" dur="1.7s" />

        {/* Money: Server → CPO 3 */}
        <path id="b-sc3g" d="M 360,305 L 628,378" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#b-ag)" opacity="0.8" />
        <FlowDot pathId="b-sc3g" color="#10B981" dur="1.8s" />

        {/* Data: Server → CPO 3 */}
        <path id="b-sc3b" d="M 368,305 L 636,378" fill="none" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#b-ab)" opacity="0.8" />
        <FlowDot pathId="b-sc3b" color="#3B82F6" dur="2s" />

        {/* Money: CPO 1 → Super Admin */}
        <path id="b-ca1g" d="M 118,460 L 365,505" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#b-ag)" opacity="0.8" />
        <FlowDot pathId="b-ca1g" color="#10B981" dur="1.8s" />

        {/* Data: CPO 1 → Super Admin */}
        <path id="b-ca1b" d="M 126,465 L 373,510" fill="none" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#b-ab)" opacity="0.8" />
        <FlowDot pathId="b-ca1b" color="#3B82F6" dur="2s" />

        {/* Money: CPO 2 → Super Admin */}
        <path id="b-ca2g" d="M 395,460 L 395,505" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#b-ag)" opacity="0.8" />
        <FlowDot pathId="b-ca2g" color="#10B981" dur="1.2s" />

        {/* Data: CPO 2 → Super Admin */}
        <path id="b-ca2b" d="M 405,460 L 405,505" fill="none" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#b-ab)" opacity="0.8" />
        <FlowDot pathId="b-ca2b" color="#3B82F6" dur="1.4s" />

        {/* Money: CPO 3 → Super Admin */}
        <path id="b-ca3g" d="M 632,460 L 435,505" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#b-ag)" opacity="0.8" />
        <FlowDot pathId="b-ca3g" color="#10B981" dur="1.8s" />

        {/* Data: CPO 3 → Super Admin */}
        <path id="b-ca3b" d="M 640,465 L 443,510" fill="none" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#b-ab)" opacity="0.8" />
        <FlowDot pathId="b-ca3b" color="#3B82F6" dur="2s" />
      </svg>

      {/* ── 3D Nodes (B2C portion) ── */}

      {/* User / Driver */}
      <div className="bf-node bf-c-teal" style={{ left: 105, top: 75, animationDelay: '0s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.user}</div>
          <span className="bf-label">{t('driver')}</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="bf-node bf-c-gray" style={{ left: 320, top: 75, animationDelay: '0.08s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.qr}</div>
          <span className="bf-label">{t('qrCode')}</span>
        </div>
      </div>

      {/* EV Charger */}
      <div className="bf-node bf-c-blue" style={{ left: 535, top: 75, animationDelay: '0.16s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.charger}</div>
          <span className="bf-label">{t('charger')}</span>
        </div>
      </div>

      {/* Server */}
      <div className="bf-node bf-c-indigo" style={{ left: 320, top: 260, animationDelay: '0.24s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.server}</div>
          <span className="bf-label">{t('server')}</span>
        </div>
      </div>

      {/* ── B2B2C Extension Nodes ── */}

      {/* CPO 1 */}
      <div className="bf-node bf-c-purple" style={{ left: 100, top: 420, animationDelay: '0.32s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.monitor}</div>
          <span className="bf-label">CPO 1</span>
        </div>
      </div>

      {/* CPO 2 */}
      <div className="bf-node bf-c-purple" style={{ left: 400, top: 420, animationDelay: '0.38s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.monitor}</div>
          <span className="bf-label">CPO 2</span>
        </div>
      </div>

      {/* CPO 3 */}
      <div className="bf-node bf-c-purple" style={{ left: 650, top: 420, animationDelay: '0.44s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front">
          <div className="bf-icon">{ico.monitor}</div>
          <span className="bf-label">CPO 3</span>
        </div>
      </div>

      {/* Super Admin */}
      <div className="bf-node bf-c-orange" style={{ left: 400, top: 548, animationDelay: '0.52s' }}>
        <div className="bf-3d-top" />
        <div className="bf-3d-right" />
        <div className="bf-front bf-front-lg">
          <div className="bf-icon">{ico.admin}</div>
          <span className="bf-label">{t('superAdmin')}</span>
          <span className="bf-sub">GCSS Platform</span>
        </div>
      </div>
    </div>
  );

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div ref={ref} className={`bf-wrap ${visible ? 'bf-visible' : ''}`}>
      {/* Legend */}
      <div className="bf-legend">
        <span className="bf-legend-item">
          <span className="bf-legend-swatch bf-swatch-green" />
          <span>{t('money')}</span>
        </span>
        <span className="bf-legend-item">
          <span className="bf-legend-swatch bf-swatch-blue" />
          <span>{t('data')}</span>
        </span>
        <span className="bf-legend-item">
          <span className="bf-legend-swatch bf-swatch-gray" />
          <span>{t('scan')}</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="bf-tabs">
        <button
          className={`bf-tab ${tab === 'b2c' ? 'bf-tab-active' : ''}`}
          onClick={() => setTab('b2c')}
        >
          {t('b2cModel')}
        </button>
        <button
          className={`bf-tab ${tab === 'b2b2c' ? 'bf-tab-active' : ''}`}
          onClick={() => setTab('b2b2c')}
        >
          {t('b2b2cModel')}
        </button>
      </div>

      {/* Diagram Area */}
      <div className="bf-canvas-wrap">
        {tab === 'b2c' ? b2cDiagram : b2b2cDiagram}
      </div>
    </div>
  );
}
