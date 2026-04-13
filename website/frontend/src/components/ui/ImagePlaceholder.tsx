'use client';

import React, { useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Rich contextual placeholder illustration component.
 *
 * Two layers:
 *   1. A real stock photo from Unsplash (context-matched, hand-picked).
 *   2. A self-contained SVG scene underneath as a graceful fallback —
 *      rendered when the remote photo 404s / fails to load.
 */

type Variant =
  | 'ev-station'
  | 'dashboard'
  | 'phone'
  | 'office'
  | 'analytics'
  | 'team'
  | 'api'
  | 'security'
  | 'blog-article'
  | 'hero';

interface ImagePlaceholderProps {
  variant: Variant;
  aspectRatio?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
  rounded?: boolean;
  /**
   * When true, the placeholder absolutely fills its positioned parent
   * (no aspect-ratio, no border-radius, no shadow). Use this inside an
   * existing container like `.card-img-placeholder` that already has
   * fixed dimensions.
   */
  fill?: boolean;
  /** Hide the label chip (useful for small card images). */
  hideLabel?: boolean;
}

const GOLD = '#FEBF1D';
const GOLD_DEEP = '#C07F00';
const GOLD_LIGHT = '#FFE58A';
const AMBER = '#F59E0B';
const EMERALD = '#10B981';
const CREAM = '#FFF7D4';
const INK = '#1a1210';
const INK_SOFT = '#2a1f18';

const defaultLabels: Record<Variant, string> = {
  'ev-station': 'EV Charging',
  dashboard: 'Live Dashboard',
  phone: 'Mobile App',
  office: 'Global Office',
  analytics: 'Analytics',
  team: 'Our Team',
  api: 'API & Integrations',
  security: 'Enterprise Security',
  'blog-article': 'Insights',
  hero: 'GCSS Platform',
};

function EvStationScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-ev-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
        <linearGradient id="ph-ev-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.7" />
          <stop offset="1" stopColor={GOLD_DEEP} stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="ph-ev-spot" cx="50%" cy="40%" r="55%">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.32" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-ev-sky)" />
      <rect width="400" height="300" fill="url(#ph-ev-spot)" />
      {/* ground line */}
      <line x1="0" y1="230" x2="400" y2="230" stroke={GOLD} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 6" />
      {/* charging station column */}
      <rect x="120" y="90" width="60" height="140" rx="6" fill={INK_SOFT} stroke={GOLD} strokeWidth="2" strokeOpacity="0.75" />
      <rect x="128" y="100" width="44" height="36" rx="3" fill="url(#ph-ev-glow)" />
      <line x1="132" y1="110" x2="168" y2="110" stroke={CREAM} strokeOpacity="0.8" strokeWidth="1.5" />
      <line x1="132" y1="118" x2="160" y2="118" stroke={CREAM} strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="132" y1="126" x2="164" y2="126" stroke={CREAM} strokeOpacity="0.6" strokeWidth="1.5" />
      {/* lightning bolt */}
      <path d="M146 150 L156 150 L150 166 L162 166 L142 198 L148 174 L140 174 Z" fill={GOLD} />
      {/* plug + cable */}
      <path d="M180 140 Q220 160 235 140" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="232" y="130" width="16" height="20" rx="3" fill={GOLD_DEEP} stroke={GOLD} strokeWidth="1.5" />
      {/* car silhouette */}
      <path d="M250 190 Q258 168 280 168 L330 168 Q348 168 354 188 L360 210 L250 210 Z" fill={INK_SOFT} stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="270" cy="215" r="10" fill={INK} stroke={GOLD} strokeWidth="1.5" />
      <circle cx="335" cy="215" r="10" fill={INK} stroke={GOLD} strokeWidth="1.5" />
      {/* ambient particles */}
      <circle cx="60" cy="60" r="2" fill={GOLD} opacity="0.7" />
      <circle cx="320" cy="50" r="1.5" fill={GOLD_LIGHT} opacity="0.8" />
      <circle cx="380" cy="100" r="2" fill={GOLD} opacity="0.5" />
      <circle cx="30" cy="120" r="1.5" fill={GOLD_LIGHT} opacity="0.6" />
    </svg>
  );
}

function DashboardScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-dash-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
        <linearGradient id="ph-dash-chart" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={GOLD} stopOpacity="0" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-dash-bg)" />
      {/* window chrome */}
      <rect x="30" y="30" width="340" height="240" rx="12" fill={INK_SOFT} stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="4" fill="#EF4444" />
      <circle cx="66" cy="50" r="4" fill={AMBER} />
      <circle cx="82" cy="50" r="4" fill={EMERALD} />
      {/* sidebar */}
      <rect x="40" y="80" width="70" height="180" rx="6" fill={INK} stroke={GOLD} strokeWidth="1" strokeOpacity="0.25" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="48" y={92 + i * 22} width="54" height="10" rx="2" fill={GOLD} opacity={i === 0 ? 0.7 : 0.25} />
      ))}
      {/* KPI cards */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={125 + i * 82} y="80" width="72" height="52" rx="6" fill={INK} stroke={GOLD} strokeWidth="1" strokeOpacity="0.3" />
          <rect x={132 + i * 82} y="89" width="30" height="4" rx="1" fill={GOLD} opacity="0.5" />
          <rect x={132 + i * 82} y="99" width="42" height="10" rx="1" fill={CREAM} opacity="0.85" />
          <rect x={132 + i * 82} y="115" width="24" height="3" rx="1" fill={EMERALD} opacity="0.8" />
        </g>
      ))}
      {/* chart area */}
      <rect x="125" y="144" width="236" height="116" rx="6" fill={INK} stroke={GOLD} strokeWidth="1" strokeOpacity="0.3" />
      <path
        d="M135 235 L165 220 L195 195 L225 210 L255 175 L285 185 L315 150 L345 160 L345 255 L135 255 Z"
        fill="url(#ph-dash-chart)"
      />
      <path
        d="M135 235 L165 220 L195 195 L225 210 L255 175 L285 185 L315 150 L345 160"
        stroke={GOLD}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[135, 165, 195, 225, 255, 285, 315, 345].map((x, i) => (
        <circle key={x} cx={x} cy={[235, 220, 195, 210, 175, 185, 150, 160][i]} r="2.5" fill={GOLD_LIGHT} />
      ))}
    </svg>
  );
}

function PhoneScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-phone-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
        <linearGradient id="ph-phone-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-phone-bg)" />
      {/* phone frame */}
      <rect x="155" y="30" width="90" height="180" rx="16" fill={INK} stroke={GOLD} strokeWidth="2" />
      <rect x="163" y="40" width="74" height="158" rx="8" fill="url(#ph-phone-screen)" opacity="0.9" />
      {/* notch */}
      <rect x="185" y="36" width="30" height="5" rx="2.5" fill={INK} />
      {/* app UI elements */}
      <rect x="170" y="55" width="60" height="6" rx="3" fill={CREAM} opacity="0.9" />
      <rect x="170" y="66" width="40" height="4" rx="2" fill={CREAM} opacity="0.55" />
      {/* big metric */}
      <rect x="170" y="80" width="60" height="28" rx="4" fill={INK} opacity="0.6" />
      <rect x="178" y="88" width="24" height="4" rx="1" fill={GOLD_LIGHT} opacity="0.8" />
      <rect x="178" y="96" width="40" height="6" rx="1" fill={CREAM} />
      {/* list rows */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="170" y={116 + i * 18} width="60" height="14" rx="3" fill={INK} opacity="0.6" />
          <circle cx="178" cy={123 + i * 18} r="3" fill={GOLD_LIGHT} />
          <rect x="186" y={120 + i * 18} width="38" height="2.5" rx="1" fill={CREAM} opacity="0.75" />
          <rect x="186" y={124 + i * 18} width="22" height="2" rx="1" fill={CREAM} opacity="0.45" />
        </g>
      ))}
      {/* bottom bar */}
      <rect x="170" y="178" width="60" height="14" rx="4" fill={INK} opacity="0.8" />
      <circle cx="180" cy="185" r="3" fill={GOLD_LIGHT} />
      <circle cx="195" cy="185" r="3" fill={CREAM} opacity="0.4" />
      <circle cx="210" cy="185" r="3" fill={CREAM} opacity="0.4" />
      <circle cx="225" cy="185" r="3" fill={CREAM} opacity="0.4" />
      {/* background decor */}
      <circle cx="70" cy="80" r="40" fill={GOLD} opacity="0.08" />
      <circle cx="330" cy="220" r="50" fill={GOLD} opacity="0.06" />
    </svg>
  );
}

function OfficeScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-off-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD_DEEP} stopOpacity="0.3" />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-off-sky)" />
      {/* sun */}
      <circle cx="320" cy="80" r="36" fill={GOLD} opacity="0.55" />
      <circle cx="320" cy="80" r="22" fill={GOLD_LIGHT} opacity="0.75" />
      {/* skyscrapers */}
      <g fill={INK_SOFT} stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.6">
        <rect x="40" y="120" width="60" height="170" />
        <rect x="110" y="80" width="52" height="210" />
        <rect x="172" y="140" width="46" height="150" />
        <rect x="228" y="100" width="58" height="190" />
        <rect x="296" y="150" width="48" height="140" />
        <rect x="354" y="130" width="36" height="160" />
      </g>
      {/* building windows (small squares) */}
      {[
        [44, 130], [52, 130], [60, 130], [68, 130], [76, 130], [84, 130],
        [44, 150], [52, 150], [60, 150], [68, 150], [76, 150],
        [44, 170], [52, 170], [68, 170], [76, 170], [84, 170],
        [116, 95], [124, 95], [132, 95], [140, 95], [148, 95],
        [116, 115], [124, 115], [140, 115], [148, 115],
        [116, 135], [132, 135], [140, 135], [148, 135],
        [116, 155], [124, 155], [132, 155], [140, 155], [148, 155],
        [178, 155], [186, 155], [194, 155], [202, 155],
        [178, 175], [186, 175], [202, 175],
        [234, 115], [242, 115], [250, 115], [258, 115], [266, 115], [274, 115],
        [234, 135], [242, 135], [258, 135], [266, 135], [274, 135],
        [234, 155], [242, 155], [250, 155], [266, 155], [274, 155],
        [302, 165], [310, 165], [318, 165], [326, 165],
        [302, 185], [310, 185], [326, 185],
        [358, 145], [366, 145], [374, 145], [382, 145],
        [358, 165], [374, 165], [382, 165],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="4" height="4" fill={GOLD} opacity={0.6 + (i % 3) * 0.15} />
      ))}
      {/* ground */}
      <rect x="0" y="260" width="400" height="40" fill={INK} />
      <line x1="0" y1="260" x2="400" y2="260" stroke={GOLD} strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}

function AnalyticsScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-an-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
        <linearGradient id="ph-an-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={GOLD_DEEP} />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-an-bg)" />
      {/* axis */}
      <line x1="60" y1="50" x2="60" y2="250" stroke={GOLD} strokeOpacity="0.3" strokeWidth="1" />
      <line x1="60" y1="250" x2="370" y2="250" stroke={GOLD} strokeOpacity="0.3" strokeWidth="1" />
      {/* grid lines */}
      {[100, 150, 200].map((y) => (
        <line key={y} x1="60" y1={y} x2="370" y2={y} stroke={GOLD} strokeOpacity="0.08" strokeDasharray="2 4" />
      ))}
      {/* bars */}
      {[
        { x: 80, h: 110 }, { x: 120, h: 140 }, { x: 160, h: 80 }, { x: 200, h: 170 },
        { x: 240, h: 130 }, { x: 280, h: 195 }, { x: 320, h: 150 },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={250 - b.h} width="26" height={b.h} rx="3" fill="url(#ph-an-bar)" />
      ))}
      {/* donut */}
      <circle cx="330" cy="90" r="36" fill="none" stroke={INK_SOFT} strokeWidth="12" />
      <circle
        cx="330" cy="90" r="36"
        fill="none" stroke={GOLD} strokeWidth="12" strokeLinecap="round"
        strokeDasharray="150 226" transform="rotate(-90 330 90)"
      />
      <text x="330" y="96" textAnchor="middle" fill={CREAM} fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">78%</text>
    </svg>
  );
}

function TeamScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-team-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-team-bg)" />
      {/* table */}
      <ellipse cx="200" cy="210" rx="150" ry="30" fill={GOLD_DEEP} opacity="0.4" />
      <ellipse cx="200" cy="200" rx="150" ry="30" fill={INK_SOFT} stroke={GOLD} strokeOpacity="0.5" strokeWidth="1.5" />
      {/* figure positions around table */}
      {[
        { x: 80, y: 140, c: GOLD },
        { x: 150, y: 110, c: GOLD_LIGHT },
        { x: 230, y: 110, c: GOLD },
        { x: 300, y: 140, c: GOLD_DEEP },
        { x: 120, y: 180, c: AMBER },
        { x: 280, y: 180, c: GOLD },
      ].map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r="14" fill={f.c} opacity="0.85" />
          <circle cx={f.x} cy={f.y - 2} r="4" fill={INK} opacity="0.25" />
          <rect x={f.x - 14} y={f.y + 8} width="28" height="26" rx="10" fill={f.c} opacity="0.7" />
        </g>
      ))}
      {/* chat bubbles */}
      <rect x="100" y="60" width="60" height="22" rx="10" fill={GOLD} opacity="0.35" />
      <rect x="240" y="50" width="70" height="22" rx="10" fill={GOLD_LIGHT} opacity="0.45" />
      <circle cx="90" cy="78" r="3" fill={GOLD} opacity="0.35" />
      <circle cx="82" cy="85" r="2" fill={GOLD} opacity="0.35" />
    </svg>
  );
}

function ApiScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-api-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-api-bg)" />
      {/* central hub */}
      <circle cx="200" cy="150" r="40" fill={INK} stroke={GOLD} strokeWidth="2" />
      <path d="M185 140 l15 -10 l15 10 l-15 10 z M185 160 l15 -10 l15 10 l-15 10 z" fill={GOLD} />
      {/* satellites */}
      {[
        { x: 80, y: 80 }, { x: 320, y: 80 }, { x: 60, y: 220 }, { x: 340, y: 220 },
        { x: 200, y: 50 }, { x: 200, y: 250 },
      ].map((s, i) => (
        <g key={i}>
          <line x1="200" y1="150" x2={s.x} y2={s.y} stroke={GOLD} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx={s.x} cy={s.y} r="18" fill={INK_SOFT} stroke={GOLD_LIGHT} strokeWidth="1.5" />
          <rect x={s.x - 10} y={s.y - 3} width="20" height="6" rx="2" fill={GOLD} opacity="0.7" />
        </g>
      ))}
      {/* code blocks floating */}
      <g opacity="0.5">
        <rect x="20" y="20" width="70" height="40" rx="4" fill={INK} stroke={GOLD} strokeOpacity="0.4" />
        <rect x="26" y="26" width="40" height="3" rx="1" fill={GOLD} />
        <rect x="26" y="33" width="55" height="3" rx="1" fill={CREAM} opacity="0.6" />
        <rect x="26" y="40" width="30" height="3" rx="1" fill={CREAM} opacity="0.4" />
      </g>
      <g opacity="0.5">
        <rect x="310" y="240" width="70" height="40" rx="4" fill={INK} stroke={GOLD} strokeOpacity="0.4" />
        <rect x="316" y="246" width="40" height="3" rx="1" fill={GOLD} />
        <rect x="316" y="253" width="55" height="3" rx="1" fill={CREAM} opacity="0.6" />
        <rect x="316" y="260" width="30" height="3" rx="1" fill={CREAM} opacity="0.4" />
      </g>
    </svg>
  );
}

function SecurityScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-sec-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
        <linearGradient id="ph-sec-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-sec-bg)" />
      {/* ambient grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={40 * i + 20} x2="400" y2={40 * i + 20} stroke={GOLD} strokeOpacity="0.05" />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={40 * i + 20} y1="0" x2={40 * i + 20} y2="300" stroke={GOLD} strokeOpacity="0.05" />
      ))}
      {/* shield */}
      <path
        d="M200 50 L260 80 L260 160 Q260 220 200 250 Q140 220 140 160 L140 80 Z"
        fill="url(#ph-sec-shield)"
        stroke={GOLD_LIGHT}
        strokeWidth="2"
      />
      {/* checkmark */}
      <path d="M170 150 L190 170 L230 125" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* lock dots */}
      <circle cx="80" cy="80" r="3" fill={GOLD} opacity="0.8" />
      <circle cx="100" cy="120" r="2" fill={GOLD_LIGHT} opacity="0.7" />
      <circle cx="320" cy="90" r="2.5" fill={GOLD} opacity="0.7" />
      <circle cx="340" cy="180" r="2" fill={GOLD_LIGHT} opacity="0.6" />
    </svg>
  );
}

function HeroScene() {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ph-hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={INK_SOFT} />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
        <radialGradient id="ph-hero-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={GOLD_LIGHT} />
          <stop offset="0.6" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD_DEEP} />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-hero-bg)" />
      {/* orbital rings */}
      <g stroke={GOLD} strokeOpacity="0.35" fill="none">
        <ellipse cx="200" cy="150" rx="180" ry="40" />
        <ellipse cx="200" cy="150" rx="150" ry="90" />
        <ellipse cx="200" cy="150" rx="110" ry="120" />
      </g>
      {/* core */}
      <circle cx="200" cy="150" r="46" fill="url(#ph-hero-sun)" />
      <circle cx="200" cy="150" r="56" fill="none" stroke={GOLD_LIGHT} strokeWidth="1.5" strokeOpacity="0.6" />
      {/* satellites */}
      <circle cx="20" cy="150" r="6" fill={GOLD_LIGHT} />
      <circle cx="380" cy="150" r="6" fill={GOLD} />
      <circle cx="50" cy="60" r="4" fill={GOLD_LIGHT} />
      <circle cx="360" cy="240" r="4" fill={GOLD} />
      <circle cx="110" cy="250" r="3" fill={GOLD_LIGHT} opacity="0.7" />
      <circle cx="290" cy="40" r="3" fill={GOLD_LIGHT} opacity="0.7" />
    </svg>
  );
}

const sceneMap: Record<Variant, ReactNode> = {
  'ev-station': <EvStationScene />,
  dashboard: <DashboardScene />,
  phone: <PhoneScene />,
  office: <OfficeScene />,
  analytics: <AnalyticsScene />,
  team: <TeamScene />,
  api: <ApiScene />,
  security: <SecurityScene />,
  'blog-article': <HeroScene />,
  hero: <HeroScene />,
};

// Hand-picked Unsplash photos — one CANONICAL image per variant, mapped to
// the actual context of each section. These are specific popular Unsplash
// photo IDs (not search queries), so every instance of a given variant
// will render the same contextually-relevant photograph. Free to hotlink,
// no API key needed.
const photoIds: Record<Variant, string[]> = {
  // Yellow EV charging at a station (iconic Unsplash EV photo)
  'ev-station': [
    'photo-1593941707882-a5bba14938c7',
    'photo-1647500666543-4d88b5b7b1dd',
    'photo-1617886903355-9354bb57751f',
  ],
  // MacBook / dashboard analytics scenes
  dashboard: [
    'photo-1551288049-bebda4e38f71',
    'photo-1460925895917-afdab827c52f',
    'photo-1543286386-713bdd548da4',
  ],
  // Smartphone in hand / app screens
  phone: [
    'photo-1512941937669-90a1b58e7e9c',
    'photo-1556656793-08538906a9f8',
    'photo-1580910051074-3eb694886505',
  ],
  // Modern office / workspace
  office: [
    'photo-1497366216548-37526070297c',
    'photo-1497366811353-6870744d04b2',
    'photo-1600607687939-ce8a6c25118c',
  ],
  // Data visualization / charts
  analytics: [
    'photo-1460925895917-afdab827c52f',
    'photo-1543286386-713bdd548da4',
    'photo-1504868584819-f8e8b4b6d7e3',
  ],
  // Team / meeting scenes with people
  team: [
    'photo-1600880292089-90a7e086ee0c',
    'photo-1556761175-5973dc0f32e7',
    'photo-1552664730-d307ca884978',
  ],
  // Code / programming / tech
  api: [
    'photo-1555066931-4365d14bab8c',
    'photo-1542831371-29b0f74f9713',
    'photo-1526379095098-d400fd0bf935',
  ],
  // Cybersecurity / lock / shield
  security: [
    'photo-1563013544-824ae1b704d3',
    'photo-1550751827-4bd374c3f58b',
    'photo-1584433144859-1fc3ab64a957',
  ],
  // Tech / innovation / business (used for blog articles)
  'blog-article': [
    'photo-1450101499163-c8848c66ca85',
    'photo-1504868584819-f8e8b4b6d7e3',
    'photo-1519389950473-47ba0277781c',
  ],
  // Signature GCSS hero: premium EV + tech imagery
  hero: [
    'photo-1558449033-1a80d1d2de9a',
    'photo-1593941707882-a5bba14938c7',
    'photo-1647500666543-4d88b5b7b1dd',
  ],
};

// Simple deterministic string hash so the same seed always picks the
// same photo from the pool — keeps the 4 gallery tiles stable, and
// means distinct labels in the same variant rotate naturally.
function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function photoUrl(variant: Variant, seed: string, width = 1200, height = 800): string {
  const pool = photoIds[variant];
  const id = pool[hashSeed(seed) % pool.length];
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}

export default function ImagePlaceholder({
  variant,
  aspectRatio = '16/9',
  label,
  className,
  style,
  rounded = true,
  fill = false,
  hideLabel = false,
}: ImagePlaceholderProps) {
  const displayLabel = label ?? defaultLabels[variant];
  const src = photoUrl(variant, displayLabel);
  const srcLarge = photoUrl(variant, displayLabel, 1600, Math.round((1600 * 9) / 16));
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const containerStyle: CSSProperties = fill
    ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#1a1210',
        ...style,
      }
    : {
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius: rounded ? 'var(--radius-md, 14px)' : 0,
        overflow: 'hidden',
        background: '#1a1210',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(254, 191, 29, 0.15)',
        ...style,
      };

  return (
    <div
      className={`image-ph image-ph-${variant}${className ? ' ' + className : ''}`}
      style={containerStyle}
      role="img"
      aria-label={displayLabel}
    >
      {/* Layer 1: SVG fallback — always rendered underneath. Visible when
          the remote photo hasn't loaded yet or has failed. */}
      <div style={{ position: 'absolute', inset: 0 }}>{sceneMap[variant]}</div>

      {/* Layer 2: Real Unsplash photo. Hidden when errored. Fades in once
          loaded so there's no flicker between SVG and photo. */}
      {!imgError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          srcSet={`${src} 1x, ${srcLarge} 1.5x`}
          alt={displayLabel}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 0.95 : 0,
            transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 1,
          }}
        />
      )}

      {/* Layer 3: warm tint so the photo still reads on the site */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background:
            'linear-gradient(140deg, rgba(26, 18, 16, 0.35) 0%, rgba(26, 18, 16, 0.05) 50%, rgba(192, 127, 0, 0.2) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 4: label chip */}
      {!hideLabel && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            bottom: 12,
            zIndex: 3,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(26, 18, 16, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 217, 90, 0.3)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#FFF7D4',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {displayLabel}
        </div>
      )}
    </div>
  );
}
