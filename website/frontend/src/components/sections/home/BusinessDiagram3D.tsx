'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import './BusinessDiagram3D.css';

/* ── Types ─────────────────────────────────────────── */
interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'user' | 'qr' | 'hardware' | 'server' | 'operator' | 'admin';
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: 'flow' | 'interaction';
  color?: string;
}

/* ── SVG Icons ────────────────────────────── */
const nodeIcons: Record<string, string> = {
  user: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  qr: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><path d="M21 14v3h-3M21 19v2h-2M14 21h3"/></svg>',
  hardware: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2L3 14h9l-1 8 8-12h-9l1-8z"/></svg>',
  server: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  operator: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  admin: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
};

const nodeColors: Record<string, string> = {
  user: '#3b82f6', qr: '#475569', hardware: '#fbbf24',
  server: '#10b981', operator: '#a78bfa', admin: '#f59e0b',
};

/* ── i18n labels/descs passed as props ──── */
interface I18nStrings {
  labels: Record<string, string>;
  descs: Record<string, string>;
  dataFlow: string;
  revenueFlow: string;
  sysViz: string;
}

/* ── Theme detection ──────────────────────── */
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ── Window width ─────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(900);
  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return w;
}

/* ── D3 Diagram ────────────────────────────── */
function DiagramCanvas({ type, i18n }: { type: 'B2C' | 'B2B'; i18n: I18nStrings }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const isDark = useIsDark();
  const winW = useWindowWidth();
  const isMobile = winW < 768;
  const isSmall = winW < 480;

  useEffect(() => {
    if (!svgRef.current) return;

    const width = isSmall ? 400 : isMobile ? 600 : 900;
    const height = isSmall ? 500 : isMobile ? 450 : 550;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();
    const defs = svg.append('defs');

    // Glow
    const filter = defs.append('filter')
      .attr('id', 'dia-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Theme colors
    const nodeFill = isDark ? '#272320' : '#ffffff';
    const labelFill = isDark ? '#a8a29e' : '#666666';
    const shadowFilter = isDark ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))';

    // Nodes
    const L = i18n.labels;
    const nodes: Node[] = type === 'B2C' ? [
      { id: 'user', label: L.user, type: 'user' },
      { id: 'qr', label: L.qr, type: 'qr' },
      { id: 'charger', label: L.charger, type: 'hardware' },
      { id: 'server', label: L.server, type: 'server' },
      { id: 'cpo', label: 'CPO', type: 'operator' },
    ] : [
      { id: 'user', label: L.user, type: 'user' },
      { id: 'qr', label: L.qr, type: 'qr' },
      { id: 'charger', label: L.charger, type: 'hardware' },
      { id: 'server', label: L.server, type: 'server' },
      { id: 'cpo1', label: 'CPO 1', type: 'operator' },
      { id: 'cpo2', label: 'CPO 2', type: 'operator' },
      { id: 'cpo3', label: 'CPO 3', type: 'operator' },
      { id: 'admin', label: L.admin, type: 'admin' },
    ];

    const links: Link[] = type === 'B2C' ? [
      { source: 'user', target: 'qr', type: 'interaction' },
      { source: 'qr', target: 'charger', type: 'interaction' },
      { source: 'charger', target: 'server', type: 'flow', color: '#3b82f6' },
      { source: 'charger', target: 'server', type: 'flow', color: '#10b981' },
      { source: 'server', target: 'user', type: 'flow', color: '#3b82f6' },
      { source: 'server', target: 'cpo', type: 'flow', color: '#10b981' },
      { source: 'server', target: 'cpo', type: 'flow', color: '#3b82f6' },
    ] : [
      { source: 'user', target: 'qr', type: 'interaction' },
      { source: 'qr', target: 'charger', type: 'interaction' },
      { source: 'charger', target: 'server', type: 'flow', color: '#3b82f6' },
      { source: 'charger', target: 'server', type: 'flow', color: '#10b981' },
      { source: 'server', target: 'user', type: 'flow', color: '#3b82f6' },
      { source: 'server', target: 'cpo1', type: 'flow', color: '#10b981' },
      { source: 'server', target: 'cpo1', type: 'flow', color: '#3b82f6' },
      { source: 'cpo1', target: 'admin', type: 'flow', color: '#10b981' },
      { source: 'cpo2', target: 'admin', type: 'flow', color: '#10b981' },
      { source: 'cpo3', target: 'admin', type: 'flow', color: '#10b981' },
      { source: 'cpo1', target: 'admin', type: 'flow', color: '#3b82f6' },
      { source: 'cpo2', target: 'admin', type: 'flow', color: '#3b82f6' },
      { source: 'cpo3', target: 'admin', type: 'flow', color: '#3b82f6' },
    ];

    // Responsive positions
    const s = isSmall ? 0.45 : isMobile ? 0.67 : 1;
    const positions: Record<string, { x: number; y: number }> = type === 'B2C' ? {
      user:    { x: 150 * s, y: 320 * s },
      qr:      { x: 320 * s, y: 320 * s },
      charger: { x: 500 * s, y: 320 * s },
      server:  { x: 350 * s, y: 140 * s },
      cpo:     { x: 650 * s, y: 140 * s },
    } : {
      user:    { x: 120 * s, y: 420 * s },
      qr:      { x: 280 * s, y: 420 * s },
      charger: { x: 440 * s, y: 420 * s },
      server:  { x: 300 * s, y: 270 * s },
      cpo1:    { x: 540 * s, y: 270 * s },
      cpo2:    { x: 660 * s, y: 270 * s },
      cpo3:    { x: 780 * s, y: 270 * s },
      admin:   { x: 660 * s, y: 90 * s },
    };

    nodes.forEach(n => { if (positions[n.id]) { n.fx = positions[n.id].x; n.fy = positions[n.id].y; } });

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100 * s))
      .force('charge', d3.forceManyBody().strength(-600 * s))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const container = svg.append('g');

    // Arrows
    const mkArrow = (id: string, color: string) => {
      defs.append('marker').attr('id', id)
        .attr('viewBox', '0 -5 10 10').attr('refX', 45).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);
    };
    mkArrow('arr-blue', '#3b82f6');
    mkArrow('arr-green', '#10b981');
    mkArrow('arr-gray', isDark ? '#78716c' : '#94a3b8');

    // Links
    const link = container.append('g')
      .selectAll<SVGPathElement, Link>('path')
      .data(links).enter().append('path')
      .attr('stroke', (d: Link) => d.color || (isDark ? '#78716c' : '#94a3b8'))
      .attr('stroke-width', isMobile ? 1.5 : 2.5)
      .attr('fill', 'none')
      .attr('stroke-dasharray', (d: Link) => d.type === 'interaction' ? '8,4' : 'none')
      .attr('marker-end', (d: Link) => {
        if (d.type === 'interaction') return 'url(#arr-gray)';
        if (d.color === '#3b82f6') return 'url(#arr-blue)';
        if (d.color === '#10b981') return 'url(#arr-green)';
        return '';
      });

    // Particles
    const particles = container.append('g')
      .selectAll<SVGCircleElement, Link>('circle')
      .data(links.filter(l => l.type === 'flow'))
      .enter().append('circle')
      .attr('r', isMobile ? 3 : 4)
      .attr('fill', (d: Link) => d.color || '#fff')
      .style('filter', 'url(#dia-glow)');

    const animateParticles = () => {
      particles.each(function (d: Link) {
        const pathEl = link.filter(l => l === d).node() as SVGPathElement;
        if (!pathEl) return;
        const dAttr = pathEl.getAttribute('d');
        if (!dAttr || dAttr === '' || dAttr === 'M0,0L0,0') {
          d3.select(this).transition().duration(100).on('end', animateParticles); return;
        }
        try {
          const length = pathEl.getTotalLength();
          if (length === 0) { d3.select(this).transition().duration(100).on('end', animateParticles); return; }
          d3.select(this).transition()
            .duration(2500 + Math.random() * 1000)
            .ease(d3.easeLinear)
            .attrTween('transform', () => (t) => {
              try { const p = pathEl.getPointAtLength(t * length); return `translate(${p.x},${p.y})`; }
              catch { return 'translate(0,0)'; }
            })
            .on('end', animateParticles);
        } catch { d3.select(this).transition().duration(100).on('end', animateParticles); }
      });
    };
    animateParticles();

    // Nodes
    const nodeSize = isMobile ? 65 : 90;
    const innerSize = nodeSize - 10;
    const half = nodeSize / 2;
    const innerHalf = innerSize / 2;

    const node = container.append('g')
      .selectAll<SVGGElement, Node>('g')
      .data(nodes).enter().append('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => setSelectedNode(prev => prev?.id === d.id ? null : d))
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event) => { if (!event.active) simulation.alphaTarget(0); }) as any);

    node.append('rect')
      .attr('width', nodeSize).attr('height', nodeSize).attr('x', -half).attr('y', -half).attr('rx', isMobile ? 12 : 16)
      .attr('fill', nodeFill)
      .attr('stroke', (d: Node) => nodeColors[d.type] || '#475569')
      .attr('stroke-width', 2)
      .style('filter', shadowFilter);

    node.append('rect')
      .attr('width', innerSize).attr('height', innerSize).attr('x', -innerHalf).attr('y', -innerHalf).attr('rx', isMobile ? 8 : 12)
      .attr('fill', 'transparent')
      .attr('stroke', (d: Node) => (nodeColors[d.type] || '#475569') + '44')
      .attr('stroke-width', 3)
      .style('filter', 'url(#dia-glow)');

    node.append('foreignObject')
      .attr('x', -16).attr('y', isMobile ? -18 : -20).attr('width', 32).attr('height', 32)
      .append('xhtml:div')
      .style('color', (d: Node) => nodeColors[d.type] || '#475569')
      .style('display', 'flex').style('justify-content', 'center').style('align-items', 'center')
      .html((d: Node) => nodeIcons[d.type] || '');

    node.append('text')
      .attr('dy', half + (isMobile ? 12 : 16)).attr('text-anchor', 'middle')
      .attr('fill', labelFill).attr('font-size', isMobile ? '9px' : '11px')
      .attr('font-weight', '600').attr('font-family', 'monospace')
      .text((d: Node) => d.label);

    simulation.on('tick', () => {
      link.attr('d', (d: Link) => {
        const s = d.source as Node; const t = d.target as Node;
        return `M${s.x},${s.y}L${t.x},${t.y}`;
      });
      node.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); particles.interrupt(); };
  }, [type, isDark, isMobile, isSmall, i18n.labels.user]);

  return (
    <div className="dia-container">
      <div className="dia-grid" />

      <div className="dia-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div className="dia-title-dot" />
          <h4>{type === 'B2C' ? 'B2C_ECOSYSTEM' : 'B2B_ENTERPRISE'}</h4>
        </div>
        <p>{i18n.sysViz}</p>
      </div>

      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

      <div className="dia-legend">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          <span>{i18n.dataFlow}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span>{i18n.revenueFlow}</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="dia-popup"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div className="dia-popup-title">{selectedNode.label}</div>
                <div style={{ fontSize: '0.55rem', color: nodeColors[selectedNode.type], fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Type: {selectedNode.type}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
            </div>
            <div className="dia-popup-bar">
              <motion.div style={{ height: '100%', background: nodeColors[selectedNode.type] }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} />
            </div>
            <p className="dia-popup-desc">{i18n.descs[selectedNode.type] || ''}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function BusinessDiagram3D() {
  const t = useTranslations('businessFlow');
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<'B2C' | 'B2B'>('B2C');

  const i18n: I18nStrings = {
    labels: {
      user: t('driver'),
      qr: t('qrCode'),
      charger: t('charger'),
      server: t('server'),
      admin: t('superAdmin'),
    },
    descs: {
      user: t('descUser'),
      qr: t('descQr'),
      hardware: t('descCharger'),
      server: t('descServer'),
      operator: t('descCpo'),
      admin: t('descAdmin'),
    },
    dataFlow: t('dataFlow'),
    revenueFlow: t('revenueFlow'),
    sysViz: t('sysViz'),
  };

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
      <div className="dia-tabs">
        {(['B2C', 'B2B'] as const).map(v => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              padding: '8px 24px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: tab === v ? '1.5px solid var(--primary, #FEBF1D)' : '1.5px solid var(--glass-border, rgba(0,0,0,0.08))',
              background: tab === v ? 'var(--primary, #FEBF1D)' : 'var(--card-bg, #fff)',
              color: tab === v ? '#fff' : 'var(--text-secondary, #64748B)',
              transition: 'all 0.2s ease',
            }}
          >{v === 'B2C' ? t('b2cModel') : t('b2b2cModel')}</button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <div className="dia-glow" />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <DiagramCanvas type={tab} i18n={i18n} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
