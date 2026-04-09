'use client';

import { useState } from 'react';
import BusinessDiagram3D from './BusinessDiagram3D';
import './DiagramModal.css';

export default function DiagramModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Hidden button - will be triggered by parent Links */}
            <div id="diagram-modal-trigger" style={{ display: 'none' }}>
                <button onClick={() => setIsOpen(true)} />
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="diagram-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="diagram-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="diagram-modal-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                        <div className="diagram-modal-body">
                            <BusinessDiagram3D />
                        </div>
                    </div>
                </div>
            )}

            {/* Script to handle button clicks globally */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            if (typeof window !== 'undefined') {
              window.openDiagramModal = function() {
                const trigger = document.getElementById('diagram-modal-trigger');
                if (trigger && trigger.querySelector('button')) {
                  trigger.querySelector('button').click();
                }
              };
            }
          `,
                }}
            />
        </>
    );
}
