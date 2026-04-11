'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const ORIGIN = { name: 'China', lat: 35.86, lng: 104.20 };

const COUNTRIES = [
  { name: 'French Polynesia', lat: -17.68, lng: -149.41 },
  { name: 'Cambodia', lat: 12.57, lng: 104.99 },
  { name: 'Singapore', lat: 1.35, lng: 103.82 },
  { name: 'Belgium', lat: 50.85, lng: 4.35 },
  { name: 'France', lat: 46.23, lng: 2.21 },
  { name: 'Italy', lat: 41.87, lng: 12.57 },
  { name: 'Russia', lat: 61.52, lng: 105.32 },
  { name: 'Brazil', lat: -14.24, lng: -51.93 },
  { name: 'Malaysia', lat: 4.21, lng: 101.98 },
  { name: 'Philippines', lat: 12.88, lng: 121.77 },
  { name: 'Vietnam', lat: 14.06, lng: 108.28 },
  { name: 'UAE', lat: 23.42, lng: 53.85 },
  { name: 'Saudi Arabia', lat: 23.89, lng: 45.08 },
  { name: 'Thailand', lat: 15.87, lng: 100.99 },
  { name: 'Sri Lanka', lat: 7.87, lng: 80.77 },
  { name: 'India', lat: 20.59, lng: 78.96 },
  { name: 'Indonesia', lat: -0.79, lng: 113.92 },
];

export default function GlobeVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 500 });
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const handleZoom = (dir: 'in' | 'out') => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const factor = dir === 'in' ? 1.3 : 1 / 1.3;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const resize = () => {
      if (wrapperRef.current) {
        setDims({ w: wrapperRef.current.clientWidth, h: wrapperRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    d3.json(WORLD_ATLAS_URL).then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries) as unknown as FeatureCollection<Geometry>;
      setWorldData(countries);
    });
  }, [isVisible]);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { w, h } = dims;

    const projection = d3.geoNaturalEarth1()
      .fitExtent([[20, 20], [w - 20, h - 20]], worldData);

    const path = d3.geoPath().projection(projection);

    const defs = svg.append('defs');

    const oceanGrad = defs.append('linearGradient')
      .attr('id', 'gcss-ocean-2d')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#3d3030');
    oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#241a1a');

    const countryGrad = defs.append('linearGradient')
      .attr('id', 'gcss-land-2d')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    countryGrad.append('stop').attr('offset', '0%').attr('stop-color', '#6b5540');
    countryGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4a3a2a');

    const glow = defs.append('filter').attr('id', 'gcss-glow-2d').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const root = svg.append('g').attr('class', 'root');

    // Ocean background rect (for panning area)
    root.append('rect')
      .attr('width', w)
      .attr('height', h)
      .attr('fill', 'url(#gcss-ocean-2d)');

    // Graticule
    root.append('path')
      .datum(d3.geoGraticule()())
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#C07F00')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.12);

    // Countries
    const targetNames = new Set(COUNTRIES.map(c => c.name));
    targetNames.add(ORIGIN.name);

    root.selectAll('.country')
      .data(worldData.features)
      .enter().append('path')
      .attr('class', 'country')
      .attr('d', path as any)
      .attr('fill', (d: any) => {
        const n = d.properties?.name;
        if (n === ORIGIN.name) return '#C07F00';
        if (targetNames.has(n)) return '#6b5540';
        return 'url(#gcss-land-2d)';
      })
      .attr('stroke', '#FFD95A')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.35)
      .style('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d: any) {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', 0.8);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-opacity', 0.35).attr('stroke-width', 0.4);
      });

    // Arcs
    const arcsGroup = root.append('g').attr('class', 'arcs');
    const links = COUNTRIES.map(t => ({
      type: 'LineString' as const,
      coordinates: [[ORIGIN.lng, ORIGIN.lat], [t.lng, t.lat]],
      name: t.name,
    }));

    const arcs = arcsGroup.selectAll('.arc')
      .data(links)
      .enter().append('path')
      .attr('class', 'arc')
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#FFD95A')
      .attr('stroke-width', 1.4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-opacity', 0)
      .style('filter', 'url(#gcss-glow-2d)')
      .each(function () {
        const len = (this as SVGPathElement).getTotalLength();
        d3.select(this)
          .attr('stroke-dasharray', `${len} ${len}`)
          .attr('stroke-dashoffset', len);
      });

    // Markers
    const markersGroup = root.append('g').attr('class', 'markers');

    const allPoints = [
      { name: ORIGIN.name, lng: ORIGIN.lng, lat: ORIGIN.lat, isOrigin: true },
      ...COUNTRIES.map(c => ({ ...c, isOrigin: false })),
    ];

    const markers = markersGroup.selectAll('.marker')
      .data(allPoints)
      .enter().append('g')
      .attr('class', 'marker')
      .attr('transform', (d: any) => {
        const p = projection([d.lng, d.lat]);
        return p ? `translate(${p[0]},${p[1]})` : '';
      })
      .style('cursor', 'pointer')
      .on('mouseenter', function (event: MouseEvent, d: any) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          name: d.name,
        });
      })
      .on('mousemove', function (event: MouseEvent, d: any) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          name: d.name,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    markers.append('circle')
      .attr('class', 'ripple')
      .attr('r', (d: any) => d.isOrigin ? 6 : 3)
      .attr('fill', (d: any) => d.isOrigin ? '#FFD95A' : '#FFF7D4')
      .attr('fill-opacity', 0.4);

    markers.append('circle')
      .attr('class', 'dot')
      .attr('r', (d: any) => d.isOrigin ? 4 : 2.2)
      .attr('fill', (d: any) => d.isOrigin ? '#FFD95A' : '#FFD95A')
      .attr('stroke', (d: any) => d.isOrigin ? '#4C3D3D' : 'none')
      .attr('stroke-width', 1);

    markers.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.isOrigin ? -10 : -7)
      .attr('font-size', (d: any) => d.isOrigin ? '11px' : '9px')
      .attr('fill', '#FFF7D4')
      .attr('font-family', 'sans-serif')
      .attr('font-weight', (d: any) => d.isOrigin ? 700 : 500)
      .attr('paint-order', 'stroke')
      .attr('stroke', '#1a1210')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .text((d: any) => d.name);

    // Arc draw animation (staggered)
    arcs.transition()
      .delay((_, i) => 400 + i * 120)
      .duration(1400)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)
      .attr('stroke-opacity', 0.85);

    // Ripple pulse
    const pulseTimer = d3.timer((elapsed) => {
      const t = (elapsed % 2000) / 2000;
      markersGroup.selectAll<SVGCircleElement, any>('.ripple')
        .attr('r', (d: any) => (d.isOrigin ? 6 : 3) + 10 * t)
        .attr('fill-opacity', 0.6 * (1 - t));
    });

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 6])
      .translateExtent([[0, 0], [w, h]])
      .on('zoom', (event) => {
        root.attr('transform', event.transform);
        // Counter-scale marker text/dots so they stay readable
        const k = event.transform.k;
        markersGroup.selectAll('text').attr('font-size', (d: any) => (d.isOrigin ? 11 : 9) / k);
        markersGroup.selectAll('text').attr('stroke-width', 2 / k);
        root.selectAll<SVGPathElement, unknown>('.country').attr('stroke-width', 0.4 / k);
        arcsGroup.selectAll('.arc').attr('stroke-width', 1.4 / k);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    return () => {
      pulseTimer.stop();
    };
  }, [worldData, dims]);

  return (
    <div
      ref={wrapperRef}
      className="globe-wrapper"
      style={{
        width: '100%',
        height: '500px',
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #3d3030 0%, #1a1210 100%)',
        boxShadow: '0 0 60px rgba(192, 127, 0, 0.3), 0 0 120px rgba(192, 127, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(26, 18, 16, 0.5)',
        border: '1px solid rgba(255, 217, 90, 0.15)',
      }}
    >
      {!worldData && isVisible && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFD95A', fontSize: '0.85rem', fontWeight: 500, zIndex: 20,
        }}>
          Loading map...
        </div>
      )}
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ position: 'relative', zIndex: 10, display: 'block', cursor: 'grab' }}
      />

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: 'rgba(26, 18, 16, 0.95)',
            border: '1px solid rgba(255, 217, 90, 0.4)',
            color: '#FFF7D4',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: '0.8rem',
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.name}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <button
          onClick={() => handleZoom('in')}
          style={zoomBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192, 127, 0, 0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(76, 61, 61, 0.8)')}
          aria-label="Zoom in"
        >+</button>
        <button
          onClick={() => handleZoom('out')}
          style={zoomBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192, 127, 0, 0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(76, 61, 61, 0.8)')}
          aria-label="Zoom out"
        >−</button>
        <button
          onClick={handleReset}
          style={{ ...zoomBtnStyle, fontSize: '0.75rem' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192, 127, 0, 0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(76, 61, 61, 0.8)')}
          aria-label="Reset view"
        >⟲</button>
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'rgba(76, 61, 61, 0.8)',
  border: '1px solid rgba(255,217,90,0.3)',
  color: '#FFD95A',
  fontSize: '1.2rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(8px)',
  transition: 'background 0.2s',
};
