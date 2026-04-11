'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export default function DocsPage() {
  const t = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('introduction');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'getting-started': true,
    'platform': false,
    'ocpp': false,
    'payment': false,
    'api': false,
    'faq': false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSidebarLinkClick = (id: string) => {
    setActiveLink(id);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const copyCode = useCallback((id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlock(id);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  }, []);

  const ChevronIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l4 4-4 4" /></svg>
  );

  const sidebarSections = [
    {
      key: 'getting-started',
      label: t('docs.sidebar.getting.started'),
      links: [
        { id: 'introduction', label: t('docs.sidebar.introduction') },
        { id: 'requirements', label: t('docs.sidebar.requirements') },
        { id: 'installation', label: t('docs.sidebar.installation') },
        { id: 'first-login', label: t('docs.sidebar.firstlogin') },
      ],
    },
    {
      key: 'platform',
      label: t('docs.sidebar.platform'),
      links: [
        { id: 'dashboard', label: t('docs.sidebar.dashboard') },
        { id: 'stations', label: t('docs.sidebar.stations') },
        { id: 'chargers', label: t('docs.sidebar.chargers') },
        { id: 'rates', label: t('docs.sidebar.rates') },
        { id: 'orders', label: t('docs.sidebar.orders') },
        { id: 'users', label: t('docs.sidebar.users') },
      ],
    },
    {
      key: 'ocpp',
      label: t('docs.sidebar.ocppLabel'),
      links: [
        { id: 'ocpp-overview', label: t('docs.sidebar.ocpp.overview') },
        { id: 'ocpp-commands', label: t('docs.sidebar.ocpp.commands') },
        { id: 'ocpp-diagnostics', label: t('docs.sidebar.ocpp.diagnostics') },
      ],
    },
    {
      key: 'payment',
      label: t('docs.sidebar.paymentLabel'),
      links: [
        { id: 'payment-setup', label: t('docs.sidebar.payment.setup') },
        { id: 'payment-gateways', label: t('docs.sidebar.payment.gateways') },
      ],
    },
    {
      key: 'api',
      label: t('docs.sidebar.apiLabel'),
      links: [
        { id: 'api-auth', label: t('docs.sidebar.api.auth') },
        { id: 'api-endpoints', label: t('docs.sidebar.api.endpoints') },
        { id: 'api-webhooks', label: t('docs.sidebar.api.webhooks') },
      ],
    },
    {
      key: 'faq',
      label: t('docs.sidebar.faqLabel'),
      links: [
        { id: 'faq-general', label: t('docs.sidebar.faq.general') },
        { id: 'faq-technical', label: t('docs.sidebar.faq.technical') },
      ],
    },
  ];

  return (
    <>
      {/* Docs Mobile Overlay */}
      {sidebarOpen && <div className="docs-overlay open" onClick={() => setSidebarOpen(false)} />}

      {/* Docs Wrapper */}
      <div className="docs-wrapper">

        {/* Left Sidebar */}
        <aside className={`docs-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="docs-search">
            <div className="docs-search-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder={t('docs.search.placeholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    const allOpen: Record<string, boolean> = {};
                    sidebarSections.forEach((s) => { allOpen[s.key] = true; });
                    setOpenSections(allOpen);
                  }
                }}
              />
            </div>
          </div>

          {sidebarSections.map((section) => (
            <div className="sidebar-section" key={section.key}>
              <button
                type="button"
                className={`sidebar-heading${openSections[section.key] ? ' open' : ''}`}
                onClick={() => toggleSection(section.key)}
              >
                <span>{section.label}</span>
                <ChevronIcon />
              </button>
              <ul className={`sidebar-links${openSections[section.key] ? ' open' : ''}`}>
                {section.links
                  .filter((link) => !searchQuery || link.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((link) => (
                    <li key={link.id}>
                      <a
                        href={`#${link.id}`}
                        className={activeLink === link.id ? 'active' : ''}
                        onClick={() => handleSidebarLinkClick(link.id)}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <main className="docs-main">
          {/* Breadcrumbs */}
          <nav className="docs-breadcrumb">
            <Link href="/">{t('nav.home')}</Link>
            <span className="separator">/</span>
            <Link href="/docs">{t('nav.docs')}</Link>
            <span className="separator">/</span>
            <span>{t('docs.sidebar.getting.started')}</span>
          </nav>

          {/* Mobile TOC */}
          <details className="docs-toc-mobile">
            <summary>{t('docs.toc.title')}</summary>
            <ul>
              <li><a href="#introduction">{t('docs.intro.title')}</a></li>
              <li><a href="#requirements">{t('docs.req.title')}</a></li>
              <li><a href="#installation">{t('docs.install.title')}</a></li>
              <li><a href="#first-login">{t('docs.login.title')}</a></li>
            </ul>
          </details>

          {/* Content */}
          <div className="docs-content">
            <h1 id="introduction">{t('docs.intro.title')}</h1>
            <p>{t('docs.intro.desc')}</p>

            <div className="docs-callout info">
              <div className="docs-callout-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              </div>
              <div>{t('docs.intro.info')}</div>
            </div>

            <h2 id="requirements">{t('docs.req.title')}</h2>
            <p>{t('docs.req.desc')}</p>

            <table>
              <thead>
                <tr>
                  <th>{t('docs.req.component')}</th>
                  <th>{t('docs.req.minimum')}</th>
                  <th>{t('docs.req.recommended')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CPU</td>
                  <td>{t('docs.req.cpu.min')}</td>
                  <td>{t('docs.req.cpu.rec')}</td>
                </tr>
                <tr>
                  <td>{t('docs.req.ram')}</td>
                  <td>4 GB</td>
                  <td>8 GB</td>
                </tr>
                <tr>
                  <td>{t('docs.req.disk')}</td>
                  <td>40 GB</td>
                  <td>100 GB SSD</td>
                </tr>
                <tr>
                  <td>{t('docs.req.os')}</td>
                  <td colSpan={2}>CentOS 7+, Ubuntu 18.04+, Debian 10+</td>
                </tr>
                <tr>
                  <td>{t('docs.req.arch')}</td>
                  <td colSpan={2}>x86_64, aarch64, armv7l</td>
                </tr>
              </tbody>
            </table>

            <div className="docs-callout tip">
              <div className="docs-callout-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <div>{t('docs.req.tip')}</div>
            </div>

            <h2 id="installation">{t('docs.install.title')}</h2>
            <p>{t('docs.install.intro')}</p>

            <h3>{t('docs.install.step1.title')}</h3>
            <p>{t('docs.install.step1.desc')}</p>

            <div className="code-block">
              <div className="code-header">
                <span>Bash</span>
                <button
                  className="copy-btn"
                  onClick={() => copyCode('ssh', 'ssh root@your-server-ip')}
                  style={copiedBlock === 'ssh' ? { color: '#10B981' } : undefined}
                >
                  {copiedBlock === 'ssh' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre><code>ssh root@your-server-ip</code></pre>
            </div>

            <h3>{t('docs.install.step2.title')}</h3>
            <p>{t('docs.install.step2.desc')}</p>

            <div className="code-block">
              <div className="code-header">
                <span>Bash</span>
                <button
                  className="copy-btn"
                  onClick={() => copyCode('install', `bash -c "$(curl -sS https://gcss.hk/GCSS/package/v2/start.sh)"`)}
                  style={copiedBlock === 'install' ? { color: '#10B981' } : undefined}
                >
                  {copiedBlock === 'install' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre><code>{`bash -c "$(curl -sS https://gcss.hk/GCSS/package/v2/start.sh)"`}</code></pre>
            </div>

            <p>{t('docs.install.step2.note')}</p>

            <div className="docs-callout warning">
              <div className="docs-callout-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div>{t('docs.install.step2.warning')}</div>
            </div>

            <h3>{t('docs.install.step3.title')}</h3>
            <p>{t('docs.install.step3.desc')}</p>

            <div className="code-block">
              <div className="code-header">
                <span>Bash</span>
                <button
                  className="copy-btn"
                  onClick={() => copyCode('verify', `# Check Docker containers are running\ndocker ps\n\n# Check GCSS service status\nsystemctl status gcss`)}
                  style={copiedBlock === 'verify' ? { color: '#10B981' } : undefined}
                >
                  {copiedBlock === 'verify' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre><code>{`# Check Docker containers are running
docker ps

# Check GCSS service status
systemctl status gcss`}</code></pre>
            </div>

            <p>{t('docs.install.step3.note')}</p>

            <h2 id="first-login">{t('docs.login.title')}</h2>
            <p>{t('docs.login.desc')}</p>

            <h3 id="access">{t('docs.login.access.title')}</h3>
            <p>{t('docs.login.access.desc')}</p>

            <div className="code-block">
              <div className="code-header">
                <span>URL</span>
                <button
                  className="copy-btn"
                  onClick={() => copyCode('url', 'http://your-server-ip:8080')}
                  style={copiedBlock === 'url' ? { color: '#10B981' } : undefined}
                >
                  {copiedBlock === 'url' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre><code>http://your-server-ip:8080</code></pre>
            </div>

            <h3 id="credentials">{t('docs.login.credentials.title')}</h3>
            <p>{t('docs.login.credentials.desc')}</p>

            <table>
              <thead>
                <tr>
                  <th>{t('docs.login.field')}</th>
                  <th>{t('docs.login.value')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('docs.login.username')}</td>
                  <td><code>admin</code></td>
                </tr>
                <tr>
                  <td>{t('docs.login.password')}</td>
                  <td><code>123456</code></td>
                </tr>
              </tbody>
            </table>

            <div className="docs-callout danger">
              <div className="docs-callout-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
              <div>{t('docs.login.warning')}</div>
            </div>

            <h3 id="next-steps">{t('docs.login.next.title')}</h3>
            <p>{t('docs.login.next.desc')}</p>
            <ul>
              <li>{t('docs.login.next.li1')}</li>
              <li>{t('docs.login.next.li2')}</li>
              <li>{t('docs.login.next.li3')}</li>
              <li>{t('docs.login.next.li4')}</li>
              <li>{t('docs.login.next.li5')}</li>
            </ul>

            <h2 id="dashboard">{t('docs.sidebar.dashboard')}</h2>
            <p>{t('docs.dashboard.desc')}</p>
            <div style={{ width: '100%', marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
              <Image
                src="/images/dashboard-home.png"
                alt="Analytics Dashboard Home Page"
                width={1920}
                height={1080}
                sizes="(max-width: 1024px) 100vw, 900px"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Previous / Next Navigation */}
            <div className="docs-nav">
              <div></div>
              <a href="/docs" className="docs-nav-card next">
                <span className="nav-label">{t('docs.nav.next')}</span>
                <span className="nav-title">{t('docs.sidebar.dashboard')} &rarr;</span>
              </a>
            </div>
          </div>
        </main>

        {/* Right TOC */}
        <aside className="docs-toc">
          <div className="docs-toc-title">{t('docs.toc.title')}</div>
          <ul>
            <li><a href="#introduction" className={activeLink === 'introduction' ? 'active' : ''}>{t('docs.intro.title')}</a></li>
            <li><a href="#requirements" className={activeLink === 'requirements' ? 'active' : ''}>{t('docs.req.title')}</a></li>
            <li><a href="#installation" className={activeLink === 'installation' ? 'active' : ''}>{t('docs.install.title')}</a></li>
            <li><a href="#first-login" className={activeLink === 'first-login' ? 'active' : ''}>{t('docs.login.title')}</a></li>
            <li><a href="#access" className="toc-h3">{t('docs.login.access.title')}</a></li>
            <li><a href="#credentials" className="toc-h3">{t('docs.login.credentials.title')}</a></li>
            <li><a href="#next-steps" className="toc-h3">{t('docs.login.next.title')}</a></li>
          </ul>
        </aside>

      </div>

      {/* Mobile sidebar toggle */}
      <button
        className="docs-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
    </>
  );
}
