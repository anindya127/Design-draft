'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Diagram2D from './Diagram2D';
import './DiagramModal.css';

type DiagramType = 'B2C' | 'B2B';

type DiagramModalContextValue = {
    openDiagramModal: (type: DiagramType) => void;
};

const DiagramModalContext = createContext<DiagramModalContextValue | null>(null);

export function useDiagramModal(): DiagramModalContextValue {
    const ctx = useContext(DiagramModalContext);
    if (!ctx) {
        // No provider — return a no-op so consumers outside the provider don't crash.
        return { openDiagramModal: () => {} };
    }
    return ctx;
}

export function DiagramModalProvider({ children }: { children: ReactNode }) {
    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const [diagramType, setDiagramType] = useState<DiagramType | null>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const titleId = 'gcss-diagram-modal-title';

    const openDiagramModal = useCallback((type: DiagramType) => {
        previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
        setDiagramType(type);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            previouslyFocusedRef.current?.focus?.();
            return;
        }
        closeBtnRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, close]);

    const title =
        diagramType === 'B2C' ? t('models.modalTitle.b2c') : t('models.modalTitle.b2b');

    return (
        <DiagramModalContext.Provider value={{ openDiagramModal }}>
            {children}
            {isOpen && diagramType && (
                <div
                    className="diagram-modal-overlay"
                    onClick={close}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                >
                    <div className="diagram-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            ref={closeBtnRef}
                            className="diagram-modal-close"
                            onClick={close}
                            aria-label="Close modal"
                            type="button"
                        >
                            ✕
                        </button>
                        <div className="diagram-modal-header">
                            <h2 id={titleId} className="diagram-modal-title">
                                {title}
                            </h2>
                        </div>
                        <div className="diagram-modal-body">
                            <Diagram2D type={diagramType} />
                        </div>
                    </div>
                </div>
            )}
        </DiagramModalContext.Provider>
    );
}

// Backwards-compatible default export: a bare provider that wraps nothing.
// The homepage should use <DiagramModalProvider> directly around its sections.
export default DiagramModalProvider;
