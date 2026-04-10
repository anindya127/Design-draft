'use client';

import { useState, useEffect, useRef } from 'react';
import InteractiveDiagram from './InteractiveDiagram';
import './DiagramModal.css';

type DiagramType = 'B2C' | 'B2B' | null;

declare global {
    interface Window {
        openDiagramModal?: (type: DiagramType) => void;
    }
}

export default function DiagramModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [diagramType, setDiagramType] = useState<DiagramType>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        window.openDiagramModal = (type: DiagramType) => {
            setDiagramType(type);
            setIsOpen(true);
        };
        return () => {
            delete window.openDiagramModal;
        };
    }, []);

    return (
        <>
            <button
                ref={triggerRef}
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* Modal */}
            {isOpen && diagramType && (
                <div className="diagram-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="diagram-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="diagram-modal-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                        <div className="diagram-modal-header">
                            <h2 className="diagram-modal-title">
                                {diagramType === 'B2C' ? 'B2C Model - Direct Operator Ecosystem' : 'B2B2C Model - Platform / Franchise Ecosystem'}
                            </h2>
                        </div>
                        <div className="diagram-modal-body">
                            <InteractiveDiagram type={diagramType} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
