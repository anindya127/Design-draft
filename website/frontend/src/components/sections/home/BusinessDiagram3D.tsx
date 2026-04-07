'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import './BusinessDiagram3D.css';

export default function BusinessDiagram3D() {
  const t = useTranslations('businessFlow');
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rotateX, setRotateX] = useState(-20);
  const [rotateZ, setRotateZ] = useState(45);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (sceneRef.current) observer.observe(sceneRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let startRotX = rotateX, startRotZ = rotateZ;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startRotX = rotateX;
      startRotZ = rotateZ;
      scene.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setRotateZ(startRotZ + dx * 0.3);
      setRotateX(Math.max(-60, Math.min(-5, startRotX + dy * 0.3)));
    };

    const onPointerUp = () => {
      isDragging = false;
      scene.style.cursor = 'grab';
    };

    scene.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      scene.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [rotateX, rotateZ]);

  // Node positions (px, centered in 500x500 scene)
  const nodes = {
    gcss:    { x: 250, y: 250 },
    server:  { x: 250, y: 40 },
    driver:  { x: 40,  y: 250 },
    charger: { x: 250, y: 460 },
    cpo:     { x: 460, y: 250 },
  };

  // Connection lines
  const connections = [
    { from: nodes.driver,  to: nodes.gcss,    type: 'data',  label: t('data') + ' 📊' },
    { from: nodes.charger, to: nodes.gcss,    type: 'data',  label: t('data') + ' 📊' },
    { from: nodes.gcss,    to: nodes.server,  type: 'data',  label: t('data') + ' 📊' },
    { from: nodes.cpo,     to: nodes.gcss,    type: 'money', label: t('money') + ' 💰' },
    { from: nodes.driver,  to: nodes.charger, type: 'money', label: t('money') + ' 💰' },
  ];

  return (
    <div className={`diagram3d-wrapper ${isVisible ? 'diagram3d-visible' : ''}`}>
      <div className="diagram3d-hint">{t('dragHint')}</div>
      <div className="diagram3d-viewport">
        <div
          ref={sceneRef}
          className="diagram3d-scene"
          style={{
            transform: `perspective(1200px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
          }}
        >
          {/* Connection lines as HTML divs */}
          {connections.map((conn, i) => {
            const dx = conn.to.x - conn.from.x;
            const dy = conn.to.y - conn.from.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const midX = (conn.from.x + conn.to.x) / 2;
            const midY = (conn.from.y + conn.to.y) / 2;

            return (
              <div key={i}>
                <div
                  className={`diagram3d-conn conn-${conn.type}`}
                  style={{
                    left: conn.from.x,
                    top: conn.from.y,
                    width: length,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 0',
                  }}
                >
                  <div className={`conn-particle particle-${conn.type}`} />
                </div>
                <div
                  className={`conn-label conn-label-${conn.type}`}
                  style={{ left: midX, top: midY }}
                >
                  {conn.label}
                </div>
              </div>
            );
          })}

          {/* GCSS Platform - Center */}
          <div className="diagram3d-node node-gcss" style={{ left: nodes.gcss.x, top: nodes.gcss.y, '--delay': '0s' } as React.CSSProperties}>
            <div className="node-3d-body">
              <div className="node-3d-top"></div>
              <div className="node-3d-front">
                <div className="node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                    <circle cx="12" cy="10" r="2" />
                  </svg>
                </div>
                <span className="node-label">{t('gcss')}</span>
              </div>
            </div>
          </div>

          {/* Server - Top */}
          <div className="diagram3d-node node-server" style={{ left: nodes.server.x, top: nodes.server.y, '--delay': '0.1s' } as React.CSSProperties}>
            <div className="node-3d-body">
              <div className="node-3d-top"></div>
              <div className="node-3d-front">
                <div className="node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="8" rx="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" />
                    <circle cx="6" cy="6" r="1" fill="currentColor" />
                    <circle cx="6" cy="18" r="1" fill="currentColor" />
                    <line x1="10" y1="6" x2="18" y2="6" />
                    <line x1="10" y1="18" x2="18" y2="18" />
                  </svg>
                </div>
                <span className="node-label">{t('server')}</span>
              </div>
            </div>
          </div>

          {/* Driver - Left */}
          <div className="diagram3d-node node-driver" style={{ left: nodes.driver.x, top: nodes.driver.y, '--delay': '0.2s' } as React.CSSProperties}>
            <div className="node-3d-body">
              <div className="node-3d-top"></div>
              <div className="node-3d-front">
                <div className="node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="node-label">{t('driver')}</span>
              </div>
            </div>
          </div>

          {/* EV Charger - Bottom */}
          <div className="diagram3d-node node-charger" style={{ left: nodes.charger.x, top: nodes.charger.y, '--delay': '0.3s' } as React.CSSProperties}>
            <div className="node-3d-body">
              <div className="node-3d-top"></div>
              <div className="node-3d-front">
                <div className="node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span className="node-label">{t('charger')}</span>
              </div>
            </div>
          </div>

          {/* CPO - Right */}
          <div className="diagram3d-node node-cpo" style={{ left: nodes.cpo.x, top: nodes.cpo.y, '--delay': '0.4s' } as React.CSSProperties}>
            <div className="node-3d-body">
              <div className="node-3d-top"></div>
              <div className="node-3d-front">
                <div className="node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="node-label">{t('cpo')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
