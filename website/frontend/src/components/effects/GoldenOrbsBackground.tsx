'use client';

import { useEffect, useRef } from 'react';

type BallSpec = {
    initialLeft: number; // px from the left edge of the canvas
    initialTop: number; // px from the top edge of the canvas
    size: number; // diameter in px
    variant: 'a' | 'b' | 'c' | 'd';
    speed: number;
};

// 5 balls, each starting at a different corner/zone. Sizes and speeds vary
// so the drift never feels like a synchronised pattern.
const BALLS: BallSpec[] = [
    { initialLeft: -40, initialTop: 120, size: 520, variant: 'a', speed: 2.2 },
    { initialLeft: 420, initialTop: -80, size: 460, variant: 'b', speed: 2.6 },
    { initialLeft: 980, initialTop: 40, size: 500, variant: 'c', speed: 2.0 },
    { initialLeft: 220, initialTop: 520, size: 420, variant: 'd', speed: 2.4 },
    { initialLeft: 820, initialTop: 600, size: 380, variant: 'a', speed: 2.3 },
];

export default function GoldenOrbsBackground() {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        // Respect prefers-reduced-motion — still render the glass, skip the motion.
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq.matches) return;

        const canvas = root.querySelector<HTMLDivElement>('.orbs-canvas-layer');
        if (!canvas) return;
        const balls = Array.from(canvas.querySelectorAll<HTMLDivElement>('.orb-ball'));
        if (balls.length === 0) return;

        type BallState = {
            el: HTMLDivElement;
            x: number;
            y: number;
            dx: number;
            dy: number;
            speed: number;
        };

        const states: BallState[] = balls.map((el) => {
            const x = parseFloat(el.style.left) || 0;
            const y = parseFloat(el.style.top) || 0;
            const speed = parseFloat(el.dataset.speed || '2.4');
            return {
                el,
                x,
                y,
                dx: Math.random() * 2 - 1,
                dy: Math.random() * 2 - 1,
                speed,
            };
        });

        const OVERFLOW = 160; // allow balls to drift this many px past the edges

        let rafId = 0;
        let paused = false;

        const onVisibility = () => {
            paused = document.hidden;
            if (!paused) {
                rafId = requestAnimationFrame(tick);
            }
        };

        const tick = () => {
            if (paused) return;
            const cw = canvas.offsetWidth;
            const ch = canvas.offsetHeight;
            for (const s of states) {
                const w = s.el.offsetWidth;
                const h = s.el.offsetHeight;
                s.x += s.dx * s.speed;
                s.y += s.dy * s.speed;
                if (s.x < -OVERFLOW || s.x > cw - w + OVERFLOW) s.dx = -s.dx;
                if (s.y < -OVERFLOW || s.y > ch - h + OVERFLOW) s.dy = -s.dy;
                s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
            }
            rafId = requestAnimationFrame(tick);
        };

        // Prime each ball's transform from its initial left/top, then switch
        // left/top to 0 so transform becomes the sole position driver — keeps
        // the animation on the compositor and avoids layout thrash.
        for (const s of states) {
            s.el.style.left = '0px';
            s.el.style.top = '0px';
            s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        }

        document.addEventListener('visibilitychange', onVisibility);
        rafId = requestAnimationFrame(tick);

        return () => {
            paused = true;
            cancelAnimationFrame(rafId);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    return (
        <div ref={rootRef} className="orbs-root" aria-hidden="true">
            <div className="orbs-canvas-layer">
                {BALLS.map((b, i) => (
                    <div
                        key={i}
                        className={`orb-ball orb-ball--${b.variant}`}
                        data-speed={b.speed}
                        style={{
                            left: `${b.initialLeft}px`,
                            top: `${b.initialTop}px`,
                            width: `${b.size}px`,
                            height: `${b.size}px`,
                        }}
                    />
                ))}
            </div>
            <div className="orbs-glass-layer" />
        </div>
    );
}
