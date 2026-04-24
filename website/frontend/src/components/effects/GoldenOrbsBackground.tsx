'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The three.js bundle is heavy and only needed client-side. Load after
// the main app is interactive so we don't block first paint.
const OrbsCanvas = dynamic(() => import('./OrbsCanvas'), {
    ssr: false,
    loading: () => null,
});

export default function GoldenOrbsBackground() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // Respect prefers-reduced-motion — skip the 3D scene entirely.
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq.matches) return;

        // Delay until the page is idle so the first paint + critical content
        // are in place before we spin up WebGL. Falls back to a setTimeout
        // on browsers without requestIdleCallback.
        type IdleWin = Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
        };
        const w = window as IdleWin;
        if (w.requestIdleCallback) {
            const id = w.requestIdleCallback(() => setEnabled(true), { timeout: 2000 });
            return () => {
                if ('cancelIdleCallback' in window) {
                    (window as typeof window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
                }
            };
        }
        const id = window.setTimeout(() => setEnabled(true), 1200);
        return () => window.clearTimeout(id);
    }, []);

    return (
        <div className="orbs-root" aria-hidden="true">
            <div className="orbs-canvas-layer">{enabled ? <OrbsCanvas /> : null}</div>
            <div className="orbs-glass-layer" />
        </div>
    );
}
