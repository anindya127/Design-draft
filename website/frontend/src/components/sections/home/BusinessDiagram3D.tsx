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
          {/* GCSS Platform - Center */}
          <div className="diagram3d-node node-gcss" style={{ '--delay': '0s' } as React.CSSProperties}>
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
          <div className="diagram3d-node node-server" style={{ '--delay': '0.1s' } as React.CSSProperties}>
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
          <div className="diagram3d-node node-driver" style={{ '--delay': '0.2s' } as React.CSSProperties}>
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
          <div className="diagram3d-node node-charger" style={{ '--delay': '0.3s' } as React.CSSProperties}>
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
          <div className="diagram3d-node node-cpo" style={{ '--delay': '0.4s' } as React.CSSProperties}>
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

          {/* Connection Lines with animated particles */}
          {/* Driver -> Charger (Money) */}
          <svg className="diagram3d-line line-driver-charger" viewBox="0 0 200 200">
            <line x1="30" y1="100" x2="170" y2="100" className="line-money" />
            <circle r="4" className="particle particle-money">
              <animateMotion dur="2s" repeatCount="indefinite" path="M30,100 L170,100" />
            </circle>
          </svg>
          <div className="line-label label-driver-charger">{t('money')} 💰</div>

          {/* Charger -> GCSS (Data) */}
          <svg className="diagram3d-line line-charger-gcss" viewBox="0 0 200 200">
            <line x1="30" y1="100" x2="170" y2="100" className="line-data" />
            <circle r="4" className="particle particle-data">
              <animateMotion dur="1.8s" repeatCount="indefinite" path="M30,100 L170,100" />
            </circle>
          </svg>
          <div className="line-label label-charger-gcss">{t('data')} 📊</div>

          {/* GCSS -> Server (Data) */}
          <svg className="diagram3d-line line-gcss-server" viewBox="0 0 200 200">
            <line x1="30" y1="100" x2="170" y2="100" className="line-data" />
            <circle r="4" className="particle particle-data">
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M30,100 L170,100" />
            </circle>
          </svg>
          <div className="line-label label-gcss-server">{t('data')} 📊</div>

          {/* CPO -> GCSS (Money) */}
          <svg className="diagram3d-line line-cpo-gcss" viewBox="0 0 200 200">
            <line x1="30" y1="100" x2="170" y2="100" className="line-money" />
            <circle r="4" className="particle particle-money">
              <animateMotion dur="2.2s" repeatCount="indefinite" path="M30,100 L170,100" />
            </circle>
          </svg>
          <div className="line-label label-cpo-gcss">{t('money')} 💰</div>

          {/* Driver -> CPO */}
          <svg className="diagram3d-line line-driver-cpo" viewBox="0 0 200 200">
            <line x1="30" y1="100" x2="170" y2="100" className="line-data" />
            <circle r="4" className="particle particle-data">
              <animateMotion dur="2s" repeatCount="indefinite" path="M30,100 L170,100" />
            </circle>
          </svg>
        </div>
      </div>
    </div>
  );
}
