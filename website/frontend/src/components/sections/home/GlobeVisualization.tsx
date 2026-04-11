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
  const zoomRef = useRef(1.7); // divisor: lower = more zoomed in
  const MIN_ZOOM = 1.2; // max zoom in
  const MAX_ZOOM = 2.3; // max zoom out
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  const handleZoom = (dir: 'in' | 'out') => {
    const step = 0.15;
    if (dir === 'in') zoomRef.current = Math.max(MIN_ZOOM, zoomRef.current - step);
    else zoomRef.current = Math.min(MAX_ZOOM, zoomRef.current + step);
    if (projectionRef.current) {
      const { w, h } = dims;
      projectionRef.current.scale(Math.min(w, h) / zoomRef.current);
    }
  };

  // Intersection observer — only start when visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  // Responsive resize
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

  // Fetch world data
  useEffect(() => {
    if (!isVisible) return;
    d3.json(WORLD_ATLAS_URL).then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries) as unknown as FeatureCollection<Geometry>;
      setWorldData(countries);
    });
  }, [isVisible]);

  // D3 rendering
  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { w, h } = dims;

    // Projection
    const projection = d3.geoOrthographic()
      .scale(Math.min(w, h) / zoomRef.current)
      .center([0, 0])
      .translate([w / 2, h / 2])
      .clipAngle(90);

    projectionRef.current = projection;
    const path = d3.geoPath().projection(projection);

    // Defs
    const defs = svg.append('defs');

    const oceanGrad = defs.append('radialGradient')
      .attr('id', 'gcss-ocean')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#4C3D3D');
    oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#2a2020');

    const glow = defs.append('filter').attr('id', 'gcss-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Globe group
    const globe = svg.append('g');

    // Sphere
    globe.append('path')
      .datum({ type: 'Sphere' })
      .attr('d', path as any)
      .attr('fill', 'url(#gcss-ocean)')
      .attr('stroke', '#C07F00')
      .attr('stroke-width', 1.5);

    // Graticule
    globe.append('path')
      .datum(d3.geoGraticule()())
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#C07F00')
      .attr('stroke-width', 0.4)
      .attr('stroke-opacity', 0.15);

    // Countries
    globe.selectAll('.country')
      .data(worldData.features)
      .enter().append('path')
      .attr('class', 'country')
      .attr('d', path as any)
      .attr('fill', '#5c4a3a')
      .attr('stroke', '#FFD95A')
      .attr('stroke-width', 0.4)
      .style('opacity', 0.8);

    // Arcs
    const arcsGroup = svg.append('g');
    const links = COUNTRIES.map(t => ({
      type: 'LineString',
      coordinates: [[ORIGIN.lng, ORIGIN.lat], [t.lng, t.lat]],
      name: t.name,
    }));

    // Markers
    const markersGroup = svg.append('g');
    const originPoint = { type: 'Point', coordinates: [ORIGIN.lng, ORIGIN.lat], isOrigin: true, name: ORIGIN.name };

    // Animation
    const timer = d3.timer((elapsed) => {
      const rotate = projection.rotate();
      projection.rotate([rotate[0] - 0.3, rotate[1]]);
      projection.scale(Math.min(w, h) / zoomRef.current);

      globe.selectAll('path').attr('d', path as any);

      const DELAY = 3000;
      const TRAVEL = 15000;
      const showRays = elapsed > DELAY;

      // Arcs
      const currentLinks = showRays ? links : [];
      const arcSel = arcsGroup.selectAll('.arc').data(currentLinks);

      arcSel.enter()
        .append('path')
        .attr('class', 'arc')
        .attr('fill', 'none')
        .attr('stroke', '#FFD95A')
        .attr('stroke-width', 1.5)
        .attr('stroke-linecap', 'round')
        .style('filter', 'url(#gcss-glow)')
        .merge(arcSel as any)
        .attr('d', path as any)
        .attr('stroke-dasharray', 2000)
        .attr('stroke-dashoffset', () => {
          const t = Math.min(1, Math.max(0, (elapsed - DELAY) / TRAVEL));
          return 2000 * (1 - (1 - Math.pow(1 - t, 3)));
        })
        .attr('stroke-opacity', () => {
          const t = elapsed - DELAY;
          if (t > TRAVEL) return 0.7 + 0.2 * Math.sin((t - TRAVEL) / 400);
          return 0.9;
        });

      arcSel.exit().remove();

      // Markers
      const activeTargets = showRays ? COUNTRIES : [];
      const allPoints = [
        originPoint,
        ...activeTargets.map(c => ({
          type: 'Point',
          coordinates: [c.lng, c.lat],
          isOrigin: false,
          name: c.name,
        })),
      ];

      const ptSel = markersGroup.selectAll('.marker').data(allPoints);

      const entered = ptSel.enter()
        .append('g')
        .attr('class', 'marker');

      entered.append('circle')
        .attr('r', (d: any) => d.isOrigin ? 5 : 2.5)
        .attr('fill', (d: any) => d.isOrigin ? '#FFD95A' : '#FFF7D4')
        .attr('fill-opacity', 0.4)
        .attr('class', 'ripple');

      entered.append('circle')
        .attr('r', (d: any) => d.isOrigin ? 2.5 : 1.5)
        .attr('fill', (d: any) => d.isOrigin ? '#C07F00' : '#FFD95A')
        .attr('class', 'dot');

      entered.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', -8)
        .attr('font-size', '9px')
        .attr('fill', '#FFF7D4')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '500')
        .text((d: any) => d.name)
        .style('opacity', 0);

      ptSel.merge(entered as any)
        .each(function (d: any) {
          const projected = projection(d.coordinates as [number, number]);
          const pathData = path(d as any);
          const visible = !!pathData;

          const el = d3.select(this);
          el.style('display', visible ? 'block' : 'none');

          if (visible && projected) {
            el.attr('transform', `translate(${projected[0]},${projected[1]})`);

            const ripple = el.select('.ripple');
            const t = (elapsed % 2000) / 2000;
            ripple
              .attr('r', (d.isOrigin ? 5 : 2.5) + 8 * t)
              .attr('fill-opacity', 0.7 * (1 - t));

            el.select('text').style('opacity', visible ? 1 : 0);
          }
        });

      ptSel.exit().remove();
    });

    return () => { timer.stop(); };
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
        background: 'radial-gradient(circle at center, #4C3D3D 0%, #1a1210 70%)',
        boxShadow: '0 0 60px rgba(192, 127, 0, 0.3), 0 0 120px rgba(192, 127, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(26, 18, 16, 0.5)',
        border: '1px solid rgba(255, 217, 90, 0.15)',
      }}
    >
      {!worldData && isVisible && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFD95A', fontSize: '0.85rem', fontWeight: 500, zIndex: 20,
        }}>
          Loading globe...
        </div>
      )}
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ position: 'relative', zIndex: 10 }}
      />
      {/* Zoom Controls */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <button
          onClick={() => handleZoom('in')}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(76, 61, 61, 0.8)', border: '1px solid rgba(255,217,90,0.3)',
            color: '#FFD95A', fontSize: '1.2rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192, 127, 0, 0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(76, 61, 61, 0.8)')}
          aria-label="Zoom in"
        >+</button>
        <button
          onClick={() => handleZoom('out')}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(76, 61, 61, 0.8)', border: '1px solid rgba(255,217,90,0.3)',
            color: '#FFD95A', fontSize: '1.2rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192, 127, 0, 0.5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(76, 61, 61, 0.8)')}
          aria-label="Zoom out"
        >−</button>
      </div>
    </div>
  );
}
