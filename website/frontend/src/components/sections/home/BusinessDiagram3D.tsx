'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

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

/* ── SVG Icons (inline) ────────────────────────────── */
const nodeIcons: Record<string, string> = {
  user: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  qr: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><path d="M21 14v3h-3M21 19v2h-2M14 21h3"/></svg>',
  hardware: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2L3 14h9l-1 8 8-12h-9l1-8z"/></svg>',
  server: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  operator: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  admin: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
};

const nodeColors: Record<string, string> = {
  user: '#3b82f6',
  qr: '#475569',
  hardware: '#fbbf24',
  server: '#10b981',
  operator: '#a78bfa',
  admin: '#f59e0b',
};

/* ── Node descriptions ─────────────────────────────── */
const nodeDescs: Record<string, string> = {
  user: 'Initiates charging session via QR scan. Receives status updates from server.',
  qr: 'QR code scanned by the user to identify and connect to the charger.',
  hardware: 'Physical EV charging unit. Communicates power delivery data to the server.',
  server: 'Central orchestration engine. Manages authentication, sessions, and data routing.',
  operator: 'Charge Point Operator. Manages infrastructure and receives revenue flows.',
  admin: 'Super Admin layer. Oversees multiple CPOs and global system health.',
};

/* ── D3 Diagram ────────────────────────────────────── */
function DiagramCanvas({ type }: { type: 'B2C' | 'B2B' }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 900;
    const height = 550;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'dia-glow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Nodes
    const nodes: Node[] = type === 'B2C' ? [
      { id: 'user', label: 'User / Driver', type: 'user' },
      { id: 'qr', label: 'QR Code', type: 'qr' },
      { id: 'charger', label: 'EV Charger', type: 'hardware' },
      { id: 'server', label: 'Server', type: 'server' },
      { id: 'cpo', label: 'CPO', type: 'operator' },
    ] : [
      { id: 'user', label: 'User / Driver', type: 'user' },
      { id: 'qr', label: 'QR Code', type: 'qr' },
      { id: 'charger', label: 'EV Charger', type: 'hardware' },
      { id: 'server', label: 'Server', type: 'server' },
      { id: 'cpo1', label: 'CPO 1', type: 'operator' },
      { id: 'cpo2', label: 'CPO 2', type: 'operator' },
      { id: 'cpo3', label: 'CPO 3', type: 'operator' },
      { id: 'admin', label: 'Super Admin', type: 'admin' },
    ];

    const links: Link[] = type === 'B2C' ? [
      { source: 'user', target: 'qr', type: 'interaction' },
      { source: 'qr', target: 'charger', type: 'interaction' },
      { source: 'charger', target: 'server', type: 'flow', color: '#3b82f6' },
      { source: 'server', target: 'cpo', type: 'flow', color: '#10b981' },
      { source: 'server', target: 'user', type: 'flow', color: '#3b82f6' },
    ] : [
      { source: 'user', target: 'qr', type: 'interaction' },
      { source: 'qr', target: 'charger', type: 'interaction' },
      { source: 'charger', target: 'server', type: 'flow', color: '#3b82f6' },
      { source: 'server', target: 'cpo1', type: 'flow', color: '#10b981' },
      { source: 'server', target: 'user', type: 'flow', color: '#3b82f6' },
      { source: 'cpo1', target: 'admin', type: 'flow', color: '#a78bfa' },
      { source: 'cpo2', target: 'admin', type: 'flow', color: '#a78bfa' },
      { source: 'cpo3', target: 'admin', type: 'flow', color: '#a78bfa' },
    ];

    // Fixed positions
    const positions: Record<string, { x: number; y: number }> = type === 'B2C' ? {
      user: { x: 150, y: 320 },
      qr: { x: 320, y: 320 },
      charger: { x: 500, y: 320 },
      server: { x: 350, y: 140 },
      cpo: { x: 650, y: 140 },
    } : {
      user: { x: 120, y: 420 },
      qr: { x: 280, y: 420 },
      charger: { x: 440, y: 420 },
      server: { x: 300, y: 270 },
      cpo1: { x: 540, y: 270 },
      cpo2: { x: 660, y: 270 },
      cpo3: { x: 780, y: 270 },
      admin: { x: 660, y: 90 },
    };

    nodes.forEach(n => {
      if (positions[n.id]) { n.fx = positions[n.id].x; n.fy = positions[n.id].y; }
    });

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const container = svg.append('g');

    // Arrow markers
    const mkArrow = (id: string, color: string) => {
      defs.append('marker').attr('id', id)
        .attr('viewBox', '0 -5 10 10').attr('refX', 45).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);
    };
    mkArrow('arr-blue', '#3b82f6');
    mkArrow('arr-green', '#10b981');
    mkArrow('arr-purple', '#a78bfa');
    mkArrow('arr-gray', '#94a3b8');

    // Links
    const link = container.append('g')
      .selectAll<SVGPathElement, Link>('path')
      .data(links).enter().append('path')
      .attr('stroke', (d: Link) => d.color || '#94a3b8')
      .attr('stroke-width', 2.5)
      .attr('fill', 'none')
      .attr('stroke-dasharray', (d: Link) => d.type === 'interaction' ? '8,4' : 'none')
      .attr('marker-end', (d: Link) => {
        if (d.type === 'interaction') return 'url(#arr-gray)';
        if (d.color === '#3b82f6') return 'url(#arr-blue)';
        if (d.color === '#10b981') return 'url(#arr-green)';
        if (d.color === '#a78bfa') return 'url(#arr-purple)';
        return '';
      });

    // Animated particles
    const particles = container.append('g')
      .selectAll<SVGCircleElement, Link>('circle')
      .data(links.filter(l => l.type === 'flow'))
      .enter().append('circle')
      .attr('r', 4)
      .attr('fill', (d: Link) => d.color || '#fff')
      .style('filter', 'url(#dia-glow)');

    const animateParticles = () => {
      particles.each(function (d: Link) {
        const pathEl = link.filter(l => l === d).node() as SVGPathElement;
        if (!pathEl) return;
        const dAttr = pathEl.getAttribute('d');
        if (!dAttr || dAttr === '' || dAttr === 'M0,0L0,0') {
          d3.select(this).transition().duration(100).on('end', animateParticles);
          return;
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
        } catch {
          d3.select(this).transition().duration(100).on('end', animateParticles);
        }
      });
    };
    animateParticles();

    // Nodes
    const node = container.append('g')
      .selectAll<SVGGElement, Node>('g')
      .data(nodes).enter().append('g')
      .attr('class', 'dia-node')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => setSelectedNode(prev => prev?.id === d.id ? null : d))
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event) => { if (!event.active) simulation.alphaTarget(0); }) as any);

    // Outer rect
    node.append('rect')
      .attr('width', 90).attr('height', 90).attr('x', -45).attr('y', -45).attr('rx', 16)
      .attr('fill', '#1e293b')
      .attr('stroke', (d: Node) => nodeColors[d.type] || '#475569')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))');

    // Inner glow rect
    node.append('rect')
      .attr('width', 80).attr('height', 80).attr('x', -40).attr('y', -40).attr('rx', 12)
      .attr('fill', 'transparent')
      .attr('stroke', (d: Node) => (nodeColors[d.type] || '#475569') + '44')
      .attr('stroke-width', 4)
      .style('filter', 'url(#dia-glow)');

    // Icons via foreignObject
    node.append('foreignObject')
      .attr('x', -16).attr('y', -20).attr('width', 32).attr('height', 32)
      .append('xhtml:div')
      .style('color', 'white')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .html((d: Node) => nodeIcons[d.type] || '');

    // Labels
    node.append('text')
      .attr('dy', 35).attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8').attr('font-size', '11px')
      .attr('font-weight', '600').attr('font-family', 'monospace')
      .text((d: Node) => d.label);

    simulation.on('tick', () => {
      link.attr('d', (d: Link) => {
        const s = d.source as Node;
        const t = d.target as Node;
        if (s.id === 'server' && t.id === 'user') {
          const dx = t.x! - s.x!; const dy = t.y! - s.y!;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${s.x},${s.y}A${dr},${dr} 0 0,1 ${t.x},${t.y}`;
        }
        return `M${s.x},${s.y}L${t.x},${t.y}`;
      });
      node.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); particles.interrupt(); };
  }, [type]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0f172a', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(51,65,85,0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
      {/* Dot grid bg */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Title overlay */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.8)' }} />
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
            {type === 'B2C' ? 'B2C_ECOSYSTEM' : 'B2B_ENTERPRISE'}
          </span>
        </div>
        <p style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em' }}>System Architecture Visualization</p>
      </div>

      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(51,65,85,0.5)', fontSize: '0.6rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
          <span>Data Flow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
          <span>Revenue Flow</span>
        </div>
        {type === 'B2B' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px rgba(167,139,250,0.5)' }} />
            <span>Admin Control</span>
          </div>
        )}
      </div>

      {/* Selected node popup */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            style={{ position: 'absolute', bottom: 20, left: 20, width: 260, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', padding: 20, borderRadius: 16, border: '1px solid rgba(71,85,105,0.5)', boxShadow: '0 16px 32px rgba(0,0,0,0.4)', zIndex: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>{selectedNode.label}</div>
                <div style={{ fontSize: '0.6rem', color: nodeColors[selectedNode.type], fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>Type: {selectedNode.type}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ height: 3, width: '100%', background: '#1e293b', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
              <motion.div style={{ height: '100%', background: nodeColors[selectedNode.type] }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, fontFamily: 'monospace' }}>
              {nodeDescs[selectedNode.type] || ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export default function BusinessDiagram3D() {
  const t = useTranslations('businessFlow');
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<'B2C' | 'B2B'>('B2C');

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
      {/* Legend bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 14, fontSize: '0.78rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 3, borderRadius: 2, background: '#10B981', display: 'inline-block' }} />
          {t('money')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 3, borderRadius: 2, background: '#3B82F6', display: 'inline-block' }} />
          {t('data')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 3, borderRadius: 2, background: '#94a3b8', borderTop: '2px dashed #94a3b8', display: 'inline-block' }} />
          {t('scan')}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
        <button
          onClick={() => setTab('B2C')}
          style={{
            padding: '8px 24px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            border: tab === 'B2C' ? '1.5px solid var(--primary, #F57C00)' : '1.5px solid var(--glass-border, rgba(0,0,0,0.08))',
            background: tab === 'B2C' ? 'var(--primary, #F57C00)' : 'var(--card-bg, #fff)',
            color: tab === 'B2C' ? '#fff' : 'var(--text-secondary, #64748B)',
            transition: 'all 0.2s ease',
          }}
        >{t('b2cModel')}</button>
        <button
          onClick={() => setTab('B2B')}
          style={{
            padding: '8px 24px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            border: tab === 'B2B' ? '1.5px solid var(--primary, #F57C00)' : '1.5px solid var(--glass-border, rgba(0,0,0,0.08))',
            background: tab === 'B2B' ? 'var(--primary, #F57C00)' : 'var(--card-bg, #fff)',
            color: tab === 'B2B' ? '#fff' : 'var(--text-secondary, #64748B)',
            transition: 'all 0.2s ease',
          }}
        >{t('b2b2cModel')}</button>
      </div>

      {/* Diagram with glow border */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: -2, background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15))', borderRadius: 22, filter: 'blur(8px)', opacity: 0.4, transition: 'opacity 0.5s', pointerEvents: 'none' }} />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <DiagramCanvas type={tab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
