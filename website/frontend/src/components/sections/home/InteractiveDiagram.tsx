'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

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

interface InteractiveDiagramProps {
    type: 'B2C' | 'B2B';
}

const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({ type }) => {
    const svgRef = useRef<SVGSVGElement>(null);

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

        // Node data based on type
        const nodes: Node[] = type === 'B2C' ? [
            { id: 'user', label: 'Driver', type: 'user' },
            { id: 'qr', label: 'QR Code', type: 'qr' },
            { id: 'charger', label: 'EV Charger', type: 'hardware' },
            { id: 'server', label: 'Server', type: 'server' },
            { id: 'cpo', label: 'CPO', type: 'operator' },
        ] : [
            { id: 'user', label: 'Driver', type: 'user' },
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
            { source: 'server', target: 'cpo2', type: 'flow', color: '#10b981' },
            { source: 'server', target: 'cpo3', type: 'flow', color: '#10b981' },
            { source: 'server', target: 'user', type: 'flow', color: '#3b82f6' },
            { source: 'cpo1', target: 'admin', type: 'flow', color: '#a78bfa' },
            { source: 'cpo2', target: 'admin', type: 'flow', color: '#a78bfa' },
            { source: 'cpo3', target: 'admin', type: 'flow', color: '#a78bfa' },
        ];

        // Fixed positions for better layout
        const positions: Record<string, { x: number, y: number }> = type === 'B2C' ? {
            user: { x: 150, y: 275 },
            qr: { x: 300, y: 275 },
            charger: { x: 450, y: 275 },
            server: { x: 300, y: 100 },
            cpo: { x: 600, y: 100 },
        } : {
            user: { x: 150, y: 400 },
            qr: { x: 300, y: 400 },
            charger: { x: 450, y: 400 },
            server: { x: 300, y: 250 },
            cpo1: { x: 500, y: 250 },
            cpo2: { x: 650, y: 250 },
            cpo3: { x: 800, y: 250 },
            admin: { x: 650, y: 80 },
        };

        nodes.forEach(n => {
            if (positions[n.id]) {
                n.fx = positions[n.id].x;
                n.fy = positions[n.id].y;
            }
        });

        const simulation = d3.forceSimulation<Node>(nodes)
            .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-800))
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

        // Animation particles on flows
        const particles = container.append('g')
            .selectAll<SVGCircleElement, Link>('circle')
            .data(links.filter(l => l.type === 'flow'))
            .enter()
            .append('circle')
            .attr('r', 4)
            .attr('fill', (d: Link) => d.color || '#fff')
            .style('filter', 'url(#glow)');

        const animateParticles = () => {
            particles.each(function (d: Link) {
                const path = link.filter(l => l === d).node() as SVGPathElement;
                if (!path) return;

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
            .attr('class', 'node');

        // Node background rectangles
        node.append('rect')
            .attr('width', 90)
            .attr('height', 90)
            .attr('x', -45)
            .attr('y', -45)
            .attr('rx', 16)
            .attr('fill', '#1e293b')
            .attr('stroke', (d: Node) => {
                switch (d.type) {
                    case 'user': return '#3b82f6';
                    case 'hardware': return '#fbbf24';
                    case 'server': return '#10b981';
                    case 'admin': return '#a78bfa';
                    case 'operator': return '#475569';
                    default: return '#475569';
                }
            })
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))');

        // Inner glow
        node.append('rect')
            .attr('width', 80)
            .attr('height', 80)
            .attr('x', -40)
            .attr('y', -40)
            .attr('rx', 12)
            .attr('fill', 'transparent')
            .attr('stroke', (d: Node) => {
                switch (d.type) {
                    case 'user': return '#3b82f644';
                    case 'hardware': return '#fbbf2444';
                    case 'server': return '#10b98144';
                    case 'admin': return '#a78bfa44';
                    case 'operator': return '#47556944';
                    default: return '#47556944';
                }
            })
            .attr('stroke-width', 4)
            .style('filter', 'url(#glow)');

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

        return () => {
            simulation.stop();
            particles.interrupt();
        };
    }, [type]);

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Title */}
            <div className="absolute top-6 left-6 z-10">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-white tracking-tight font-mono">
                        {type === 'B2C' ? 'B2C_ECOSYSTEM' : 'B2B2C_NETWORK'}
                    </h3>
                </div>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Architecture Visualization</p>
            </div>

            <svg ref={svgRef} className="w-full h-full" />

            {/* Legend */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Data Flow</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Revenue Flow</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Admin Control</span>
                </div>
            </div>
        </div>
    );
};

export default InteractiveDiagram;
