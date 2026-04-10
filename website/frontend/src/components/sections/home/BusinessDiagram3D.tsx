'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import './BusinessDiagram3D.css';

export default function BusinessDiagram3D() {
  const t = useTranslations();

  const handleLearnMore = (type: 'B2C' | 'B2B') => {
    if (typeof window !== 'undefined' && window.openDiagramModal) {
      window.openDiagramModal(type);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      className="business-models-container"
    >
      <div className="models-grid">
        {/* B2C Model */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="model-card b2c-card"
        >
          <div className="model-header">
            <div className="model-icon b2c-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="model-title-group">
              <span className="model-badge b2c-badge">B2C MODEL</span>
              <h3 className="model-title">{t('models.b2c.title')}</h3>
            </div>
          </div>

          <div className="model-detail">
            <p className="model-label">{t('models.b2c.detail')}</p>
          </div>

          <p className="model-description">{t('models.b2c.desc')}</p>

          <div className="model-flow">
            <h4 className="flow-title">Transaction Flow:</h4>
            <ul className="flow-list">
              {Array.isArray(t.raw('models.b2c.flow')) ? (
                (t.raw('models.b2c.flow') as string[]).map((step, idx) => (
                  <li key={idx} className="flow-item">{step}</li>
                ))
              ) : null}
            </ul>
          </div>

          <div className="model-summary">
            <p>{t('models.b2c.summary')}</p>
          </div>

          <button
            onClick={() => handleLearnMore('B2C')}
            className="learn-more-btn b2c-btn"
          >
            {t('models.learnmore')} →
          </button>
        </motion.div>

        {/* B2B Model */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="model-card b2b-card"
        >
          <div className="model-header">
            <div className="model-icon b2b-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                <circle cx="18" cy="8" r="1"></circle>
                <circle cx="6" cy="8" r="1"></circle>
              </svg>
            </div>
            <div className="model-title-group">
              <span className="model-badge b2b-badge">B2B2C MODEL</span>
              <h3 className="model-title">{t('models.b2b.title')}</h3>
            </div>
          </div>

          <div className="model-detail">
            <p className="model-label">{t('models.b2b.detail')}</p>
          </div>

          <p className="model-description">{t('models.b2b.desc')}</p>

          <div className="model-flow">
            <h4 className="flow-title">Transaction Flow:</h4>
            <ul className="flow-list">
              {Array.isArray(t.raw('models.b2b.flow')) ? (
                (t.raw('models.b2b.flow') as string[]).map((step, idx) => (
                  <li key={idx} className="flow-item">{step}</li>
                ))
              ) : null}
            </ul>
          </div>

          <div className="model-summary">
            <p>{t('models.b2b.summary')}</p>
          </div>

          <button
            onClick={() => handleLearnMore('B2B')}
            className="learn-more-btn b2b-btn"
          >
            {t('models.learnmore')} →
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
