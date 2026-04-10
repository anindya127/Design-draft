'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const sections = [
  { id: 'overview', key: 'b2b.nav.overview' },
  { id: 'modes', key: 'b2b.nav.modes' },
  { id: 'revenue', key: 'b2b.nav.revenue' },
  { id: 'features', key: 'b2b.nav.features' },
  { id: 'profit', key: 'b2b.nav.profit' },
  { id: 'support', key: 'b2b.nav.support' },
  { id: 'pricing', key: 'b2b.nav.pricing' },
  { id: 'aftersales', key: 'b2b.nav.aftersales' },
  { id: 'releases', key: 'b2b.nav.releases' },
  { id: 'demo', key: 'b2b.nav.demo' },
];

export default function SubNav() {
  const t = useTranslations();
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const offset = 160;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.getBoundingClientRect().top <= offset) {
          setActive(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className="sub-nav product-sub-nav">
        <div className="sub-nav-inner">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={active === s.id ? 'active' : undefined}
            >
              {t(s.key)}
            </a>
          ))}
        </div>
      </nav>
      <div className="sub-nav-spacer" />
    </>
  );
}
