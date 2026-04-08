import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Info,
  Zap,
  User,
  QrCode,
  Server,
  Monitor,
  ShieldCheck,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'user' | 'qr' | 'hardware' | 'server' | 'operator' | 'admin';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: 'flow' | 'interaction';
  color?: string;
}

interface DiagramProps {
  type: 'B2C' | 'B2B';
}

const Diagram: React.FC<DiagramProps> = ({ type }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 900;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Node data based on user mind map
    const nodes: Node[] = type === 'B2C' ? [
      { id: 'user', label: 'User (车手)', type: 'user' },
      { id: 'qr', label: 'QR Code', type: 'qr' },
      { id: 'charger', label: 'EV Charger', type: 'hardware' },
      { id: 'server', label: 'Server', type: 'server' },
      { id: 'cpo', label: 'CPO', type: 'operator' },
    ] : [
      { id: 'user', label: 'User (车手)', type: 'user' },
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

    // Isometric-like fixed positions
    const positions: Record<string, { x: number, y: number }> = type === 'B2C' ? {
      user: { x: 150, y: 300 },
      qr: { x: 300, y: 300 },
      charger: { x: 450, y: 300 },
      server: { x: 300, y: 150 },
      cpo: { x: 600, y: 150 },
    } : {
      user: { x: 150, y: 450 },
      qr: { x: 300, y: 450 },
      charger: { x: 450, y: 450 },
      server: { x: 300, y: 300 },
      cpo1: { x: 550, y: 300 },
      cpo2: { x: 650, y: 300 },
      cpo3: { x: 750, y: 300 },
      admin: { x: 650, y: 100 },
    };

    nodes.forEach(n => {
      if (positions[n.id]) {
        n.fx = positions[n.id].x;
        n.fy = positions[n.id].y;
      }
    });

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const container = svg.append('g');

    // Arrowheads
    const createArrow = (id: string, color: string) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 45)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    };

    createArrow('arrow-flow-blue', '#3b82f6');
    createArrow('arrow-flow-green', '#10b981');
    createArrow('arrow-flow-purple', '#a78bfa');
    createArrow('arrow-interaction', '#94a3b8');

    // Draw links
    const link = container.append('g')
      .selectAll<SVGPathElement, Link>('path')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', (d: Link) => d.color || '#94a3b8')
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('stroke-dasharray', (d: Link) => d.type === 'interaction' ? '8,4' : 'none')
      .attr('marker-end', (d: Link) => {
        if (d.type === 'interaction') return 'url(#arrow-interaction)';
        if (d.color === '#3b82f6') return 'url(#arrow-flow-blue)';
        if (d.color === '#10b981') return 'url(#arrow-flow-green)';
        if (d.color === '#a78bfa') return 'url(#arrow-flow-purple)';
        return '';
      });

    // Animated particles
    const particles = container.append('g')
      .selectAll<SVGCircleElement, Link>('circle')
      .data(links.filter(l => l.type === 'flow'))
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', (d: Link) => d.color || '#fff')
      .style('filter', 'url(#glow)');

    const animateParticles = () => {
      particles.each(function(d: Link) {
        const path = link.filter(l => l === d).node() as SVGPathElement;
        if (!path) return;

        // Safety check: Ensure path has a valid 'd' attribute before calculating length
        const dAttr = path.getAttribute('d');
        if (!dAttr || dAttr === '' || dAttr === 'M0,0L0,0') {
          d3.select(this)
            .transition()
            .duration(100)
            .on('end', animateParticles);
          return;
        }

        try {
          const length = path.getTotalLength();
          if (length === 0) {
            d3.select(this)
              .transition()
              .duration(100)
              .on('end', animateParticles);
            return;
          }

          d3.select(this)
            .transition()
            .duration(2500 + Math.random() * 1000)
            .ease(d3.easeLinear)
            .attrTween('transform', () => {
              return (t) => {
                try {
                  const p = path.getPointAtLength(t * length);
                  return `translate(${p.x},${p.y})`;
                } catch (e) {
                  return 'translate(0,0)';
                }
              };
            })
            .on('end', animateParticles);
        } catch (e) {
          d3.select(this)
            .transition()
            .duration(100)
            .on('end', animateParticles);
        }
      });
    };
    animateParticles();

    // Draw nodes
    const node = container.append('g')
      .selectAll<SVGGElement, Node>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', (event, d) => setSelectedNode(d))
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Node "Hardware" styling
    node.append('rect')
      .attr('width', 90)
      .attr('height', 90)
      .attr('x', -45)
      .attr('y', -45)
      .attr('rx', 16)
      .attr('fill', '#1e293b')
      .attr('stroke', (d: Node) => {
        switch(d.type) {
          case 'user': return '#3b82f6';
          case 'hardware': return '#fbbf24';
          case 'server': return '#10b981';
          case 'admin': return '#a78bfa';
          default: return '#475569';
        }
      })
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))');

    // Inner glow for active nodes
    node.append('rect')
      .attr('width', 80)
      .attr('height', 80)
      .attr('x', -40)
      .attr('y', -40)
      .attr('rx', 12)
      .attr('fill', 'transparent')
      .attr('stroke', (d: Node) => {
        switch(d.type) {
          case 'user': return '#3b82f644';
          case 'hardware': return '#fbbf2444';
          case 'server': return '#10b98144';
          case 'admin': return '#a78bfa44';
          default: return '#47556944';
        }
      })
      .attr('stroke-width', 4)
      .style('filter', 'url(#glow)');

    // Icons
    node.append('foreignObject')
      .attr('x', -20)
      .attr('y', -25)
      .attr('width', 40)
      .attr('height', 40)
      .append('xhtml:div')
      .style('color', 'white')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .html((d: Node) => {
        const size = 32;
        switch(d.type) {
          case 'user': return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
          case 'qr': return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><line x1="7" y1="7" x2="7.01" y2="7"></line><line x1="17" y1="7" x2="17.01" y2="7"></line><line x1="17" y1="17" x2="17.01" y2="17"></line><line x1="7" y1="17" x2="7.01" y2="17"></line></svg>`;
          case 'hardware': return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2L3 14h9l-1 8 8-12h-9l1-8z"></path></svg>`;
          case 'server': return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;
          case 'operator': return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
          case 'admin': return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
          default: return '';
        }
      });

    // Labels
    node.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'monospace')
      .text((d: Node) => d.label);

    simulation.on('tick', () => {
      link.attr('d', (d: Link) => {
        const source = d.source as Node;
        const target = d.target as Node;
        
        // Curved paths for "Server -> User" to avoid overlap
        if (source.id === 'server' && target.id === 'user') {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        }

        return `M${source.x},${source.y}L${target.x},${target.y}`;
      });

      node.attr('transform', (d: Node) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep fixed positions as defined
      // d.fx = null;
      // d.fy = null;
    }

    return () => {
      simulation.stop();
      particles.interrupt();
    };
  }, [type]);

  return (
    <div className="relative w-full h-full bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
          backgroundSize: '30px 30px' 
        }} 
      />

      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-xl font-bold text-white tracking-tight font-mono">
            {type === 'B2C' ? 'B2C_ECOSYSTEM_V1' : 'B2B_ENTERPRISE_V1'}
          </h3>
        </div>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">System Architecture Visualization</p>
      </div>

      <svg ref={svgRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-3 bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Data Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Revenue Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Admin Control</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-8 left-8 w-72 bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-2xl z-20"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-white font-mono">{selectedNode.label}</h4>
                <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Entity Type: {selectedNode.type}</span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {selectedNode.type === 'user' && 'Initiates charging session via QR scan. Receives status updates from server.'}
                {selectedNode.type === 'hardware' && 'Physical EV charging unit. Communicates power delivery data to the server.'}
                {selectedNode.type === 'server' && 'Central orchestration engine. Manages authentication, sessions, and data routing.'}
                {selectedNode.type === 'operator' && 'Charge Point Operator. Manages infrastructure and receives revenue flows.'}
                {selectedNode.type === 'admin' && 'Super Administrative layer. Oversees multiple CPOs and global system health.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Diagram;
