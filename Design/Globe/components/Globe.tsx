import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ORIGIN_COUNTRY, TARGET_COUNTRIES } from '../constants';
import { FeatureCollection, Geometry } from 'geojson';

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const Globe: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry> | null>(null);

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch TopoJSON data
  useEffect(() => {
    d3.json(WORLD_ATLAS_URL).then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries) as unknown as FeatureCollection<Geometry>;
      setWorldData(countries);
    });
  }, []);

  // D3 Rendering Logic
  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const { width, height } = dimensions;
    const sensitivity = 75;

    // 1. Projection Setup
    const projection = d3.geoOrthographic()
      .scale(Math.min(width, height) / 2.2)
      .center([0, 0])
      .translate([width / 2, height / 2])
      .clipAngle(90); // Hides back of globe

    const pathGenerator = d3.geoPath().projection(projection);

    // 2. Gradients & Filters (Visual aesthetics)
    const defs = svg.append('defs');

    // Ocean Gradient
    const oceanGradient = defs.append('radialGradient')
      .attr('id', 'oceanGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    oceanGradient.append('stop').attr('offset', '0%').attr('stop-color', '#0f172a'); // Slate 900
    oceanGradient.append('stop').attr('offset', '100%').attr('stop-color', '#1e3a8a'); // Blue 900

    // Glow Filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 3. Globe Layers
    const globeGroup = svg.append('g');

    // Sphere (Water)
    globeGroup.append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'sphere')
      .attr('d', pathGenerator as any)
      .attr('fill', 'url(#oceanGradient)')
      .attr('stroke', '#1e40af') // Blue 800
      .attr('stroke-width', 2);

    // Graticule (Grid lines)
    const graticule = d3.geoGraticule();
    globeGroup.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', pathGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6') // Blue 500
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.2);

    // Countries
    globeGroup.selectAll('.country')
      .data(worldData.features)
      .enter().append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator as any)
      .attr('fill', '#172554') // Blue 950
      .attr('stroke', '#60a5fa') // Blue 400
      .attr('stroke-width', 0.5)
      .style('opacity', 0.8);

    // 4. Arcs (Rays)
    const arcsGroup = svg.append('g').attr('class', 'arcs');
    const links = TARGET_COUNTRIES.map(target => ({
      type: 'LineString',
      coordinates: [
        [ORIGIN_COUNTRY.coords.lng, ORIGIN_COUNTRY.coords.lat],
        [target.coords.lng, target.coords.lat]
      ],
      targetName: target.name
    }));

    // 5. Markers (Cities)
    const markersGroup = svg.append('g').attr('class', 'markers');
    
    // Add China Marker
    const chinaPoint = {
        type: 'Point',
        coordinates: [ORIGIN_COUNTRY.coords.lng, ORIGIN_COUNTRY.coords.lat]
    };

    // 6. Animation Loop
    const timer = d3.timer((elapsed) => {
      // Rotation
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();
      
      // ROTATION SPEED: 2x Faster (0.4)
      projection.rotate([rotate[0] - 0.4, rotate[1]]);

      // Update Paths
      globeGroup.selectAll('path').attr('d', pathGenerator as any);
      
      // LOGIC CHECK: Show rays after 10 seconds (10000ms)
      const RAYS_START_DELAY = 10000;
      
      // RAY SPEED: Slow (20000ms duration)
      const RAY_TRAVEL_DURATION = 20000; 
      
      const showRays = elapsed > RAYS_START_DELAY;
      
      // Update Arcs
      const currentLinks = showRays ? links : [];
      
      const arcSelection = arcsGroup.selectAll('.arc')
        .data(currentLinks);

      arcSelection.enter()
        .append('path')
        .attr('class', 'arc')
        .attr('fill', 'none')
        .attr('stroke', '#67e8f9') // Brighter Cyan for "light"
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .style('filter', 'url(#glow)')
        .merge(arcSelection as any)
        .attr('d', pathGenerator as any)
        .attr('stroke-dasharray', 2000) // Large enough to cover arc length
        .attr('stroke-dashoffset', function() {
           // Animation: Grow from origin
           const animationTime = elapsed - RAYS_START_DELAY;
           const progress = Math.min(1, Math.max(0, animationTime / RAY_TRAVEL_DURATION));
           // Easing function (Cubic Out)
           const ease = 1 - Math.pow(1 - progress, 3);
           
           return 2000 * (1 - ease);
        })
        .attr('stroke-opacity', function() {
           // Animation: Pulse after arrival to show active data transfer
           const animationTime = elapsed - RAYS_START_DELAY;
           if (animationTime > RAY_TRAVEL_DURATION) {
              // PULSE SPEED: Normal (300ms cycle) to show active connection
              return 0.8 + 0.2 * Math.sin((animationTime - RAY_TRAVEL_DURATION) / 300);
           }
           return 1;
        });
      
      arcSelection.exit().remove();

      // Update Markers
      // Show targets only when rays start
      const activeTargets = showRays ? TARGET_COUNTRIES : [];
      
      const allPoints = [
        { ...chinaPoint, isOrigin: true, name: ORIGIN_COUNTRY.name },
        ...activeTargets.map(t => ({
          type: 'Point',
          coordinates: [t.coords.lng, t.coords.lat],
          isOrigin: false,
          name: t.name
        }))
      ];

      const pointSelection = markersGroup.selectAll('.marker')
        .data(allPoints);

      const enteredPoints = pointSelection.enter()
        .append('g')
        .attr('class', 'marker');

      // Outer ripple
      enteredPoints.append('circle')
        .attr('r', d => d.isOrigin ? 6 : 3)
        .attr('fill', d => d.isOrigin ? '#fbbf24' : '#22d3ee')
        .attr('fill-opacity', 0.4)
        .attr('class', 'ripple');

      // Inner Dot
      enteredPoints.append('circle')
        .attr('r', d => d.isOrigin ? 3 : 1.5)
        .attr('fill', d => d.isOrigin ? '#f59e0b' : '#cffafe')
        .attr('class', 'dot');
        
      // Text Labels
      enteredPoints.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', -8)
        .attr('font-size', '10px')
        .attr('fill', '#e0f2fe')
        .attr('font-family', 'sans-serif')
        .text((d: any) => d.name)
        .style('opacity', 0); // Start hidden, show when visible

      // Update positions
      pointSelection.merge(enteredPoints as any)
        .each(function(d: any) {
            // Check visibility using the projection
            const projected = projection(d.coordinates as [number, number]);
            
            const pathData = pathGenerator(d as any);
            const isVisible = !!pathData;

            const el = d3.select(this);
            el.style('display', isVisible ? 'block' : 'none');
            
            if (isVisible && projected) {
                el.attr('transform', `translate(${projected[0]}, ${projected[1]})`);
                
                // RIPPLE SPEED: Normal (2000ms cycle)
                const ripple = el.select('.ripple');
                const t = (elapsed % 2000) / 2000; 
                ripple
                    .attr('r', (d.isOrigin ? 6 : 3) + (10 * t))
                    .attr('fill-opacity', 0.8 * (1 - t));
                
                // Show text only if near center or very visible
                el.select('text').style('opacity', isVisible ? 1 : 0);
            }
        });

      pointSelection.exit().remove();
    });

    return () => {
      timer.stop();
    };

  }, [worldData, dimensions]);

  return (
    <div ref={wrapperRef} className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Starfield Effect (static for performance) */}
      <div className="absolute inset-0 opacity-30" 
           style={{
             backgroundImage: 'radial-gradient(circle at center, #1e3a8a 0%, #020617 70%)',
             zIndex: 0
           }}
      />
      
      {/* Loading State */}
      {!worldData && (
         <div className="absolute inset-0 flex items-center justify-center text-cyan-500 animate-pulse z-20">
            正在初始化地理空间数据...
         </div>
      )}

      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="z-10 relative drop-shadow-2xl"
        style={{ cursor: 'move' }}
      />
    </div>
  );
};

export default Globe;