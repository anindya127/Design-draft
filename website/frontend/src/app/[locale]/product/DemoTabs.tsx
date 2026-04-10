'use client';

import { useTranslations } from 'next-intl';
import TabSwitcher from '@/components/ui/TabSwitcher';

export default function DemoTabs() {
  const t = useTranslations();

  const tabs = [
    { id: 'demo-live', label: t('product.demo.tab.live') },
    { id: 'demo-merchant', label: t('product.demo.tab.merchant') },
  ];

  return (
    <TabSwitcher tabs={tabs}>
      {/* Tab: Live Demo */}
      <div id="demo-live">
        <div className="grid grid-2" style={{ gap: 20 }}>
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div className="card-icon" style={{ margin: '0 auto 16px', background: '#F3E8FF', color: '#D4890A' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <h4 style={{ marginBottom: 8 }}>{t('product.demo.merchant.title')}</h4>
            <p style={{ fontSize: '0.85rem' }}>{t('product.demo.merchant.desc')}</p>
            <a href="/product" className="btn btn-accent btn-sm" style={{ marginTop: 16 }}>{t('product.demo.merchant.btn')}</a>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div className="card-icon" style={{ margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h4 style={{ marginBottom: 8 }}>{t('product.demo.h5.title')}</h4>
            <p style={{ fontSize: '0.85rem' }}>{t('product.demo.h5.desc')}</p>
            <a href="/product" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>{t('product.demo.h5.btn')}</a>
          </div>
        </div>

        {/* Mobile Demo QR Codes */}
        <div className="grid grid-2" style={{ gap: 20, marginTop: 20 }}>
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <h4 style={{ marginBottom: 16 }}>{t('product.demo.mobile.title')}</h4>
            <div className="qr-placeholder" style={{ margin: '0 auto' }}>QR Code</div>
            <p style={{ fontSize: '0.8rem', marginTop: 12 }}>{t('product.demo.mobile.desc')}</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <h4 style={{ marginBottom: 16 }}>{t('product.demo.app.title')}</h4>
            <div className="qr-placeholder" style={{ margin: '0 auto' }}>QR Code</div>
            <p style={{ fontSize: '0.8rem', marginTop: 12 }}>{t('product.demo.app.desc')}</p>
          </div>
        </div>
      </div>

      {/* Tab: Merchant Access & Credentials */}
      <div id="demo-merchant">
        {/* Demo Access Links */}
        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h4 style={{ marginBottom: 16 }}>{t('product.demo.access.title')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: t('product.demo.access.merchant'), url: 'https://demo-merchant.gcss.cloud' },
              { label: t('product.demo.access.h5'), url: 'https://demo-h5.gcss.cloud' },
            ].map((link) => (
              <div key={link.url} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{link.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{link.url}</div>
                </div>
                <a href="/product" className="btn btn-sm btn-outline">{t('product.demo.access.visit')}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant Login Credentials */}
        <div className="card" style={{ padding: 32 }}>
          <h4 style={{ marginBottom: 16 }}>{t('product.demo.cred.merchant')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 2 }}>{t('product.demo.cred.username')}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem' }}>test_merchant</div>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 2 }}>{t('product.demo.cred.password')}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem' }}>123456</div>
            </div>
          </div>
        </div>
      </div>
    </TabSwitcher>
  );
}
