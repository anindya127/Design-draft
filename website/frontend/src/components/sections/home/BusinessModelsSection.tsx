'use client';

import { useTranslations } from 'next-intl';
import ScrollAnimation from '@/components/effects/ScrollAnimation';
import { useDiagramModal } from './DiagramModal';

export default function BusinessModelsSection() {
    const t = useTranslations();
    const { openDiagramModal } = useDiagramModal();

    return (
        <section className="section section-alt" id="models">
            <div className="container">
                <ScrollAnimation>
                    <div className="section-header">
                        <span className="section-label">{t('models.label')}</span>
                        <h2>{t('models.title')}</h2>
                        <p>{t('models.desc')}</p>
                    </div>
                </ScrollAnimation>
                <div className="grid grid-2">
                    <ScrollAnimation>
                        <div className="model-card" style={{ height: '100%' }}>
                            <div className="model-icon">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect x="4" y="8" width="24" height="16" rx="2" stroke="white" strokeWidth="2" />
                                    <path d="M16 8V6M12 8V4M20 8V4" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                            <h3>{t('models.b2c.title')}</h3>
                            <p>{t('models.b2c.desc')}</p>
                            <button
                                className="btn btn-accent"
                                style={{ marginTop: 12 }}
                                onClick={() => openDiagramModal('B2C')}
                            >
                                {t('models.learnmore')}
                            </button>
                        </div>
                    </ScrollAnimation>
                    <ScrollAnimation>
                        <div className="model-card" style={{ height: '100%' }}>
                            <div className="model-icon">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" />
                                    <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" />
                                    <path d="M16 6v4M16 22v4M6 16h4M22 16h4" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                            <h3>{t('models.b2b.title')}</h3>
                            <p>{t('models.b2b.desc')}</p>
                            <button
                                className="btn btn-accent"
                                style={{ marginTop: 12 }}
                                onClick={() => openDiagramModal('B2B')}
                            >
                                {t('models.learnmore')}
                            </button>
                        </div>
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
}
