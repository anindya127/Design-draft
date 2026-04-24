# Nav Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declutter the desktop header right-cluster from 7 controls to 3 (Buy Now, Login/avatar, Settings icon popover), and fix the mobile drawer CTA row so four buttons stop sharing one flex line.

**Architecture:** Extract the existing lang-switcher and theme-toggle into a new `SettingsPopover` client component with click-outside + Escape close. Remove the desktop-rendered `.btn-demo` and `.btn-signup` from `.header-actions` JSX (they stay in the mobile drawer, reached through the hamburger). Rewrite `.mobile-nav-cta` CSS from a single flex row to a column with a nested 50/50 auth pair. No backend changes.

**Tech Stack:** Next.js 16 App Router, TypeScript, `next-intl` for i18n, vanilla CSS in `src/app/styles/`. The existing `useAuth()`, `useThemeContext()`, `useLocale()`, and `useRouter()` hooks are reused.

---

## File structure

- **Create:** `website/frontend/src/components/layout/SettingsPopover.tsx` — self-contained popover with lang + theme controls, encapsulates open/close state, outside-click, and Escape handling.
- **Modify:** `website/frontend/src/components/layout/Header.tsx` — remove desktop `.btn-demo` and `.btn-signup` JSX, replace the inline lang-switcher + theme-toggle block with `<SettingsPopover/>`.
- **Modify:** `website/frontend/src/app/styles/components.css` — add `.settings-trigger` + `.settings-popover` + `.settings-popover-section` rules; delete now-dead `.header-actions .btn-demo` and desktop `.header-actions .btn-signup` rules.
- **Modify:** `website/frontend/src/app/styles/pages.css` — rewrite `.mobile-nav-cta` inside the `@media (max-width: 1024px)` block from flex-row to flex-column with a nested `.mobile-nav-cta-auth` 50/50 pair; add full-width rules for `.btn-buy` + `.btn-signup` in mobile scope.
- **Modify:** `website/frontend/messages/en.json` + `website/frontend/messages/zh.json` — add `nav.settings`, `nav.settingsLang`, `nav.settingsTheme`.

---

## Task 1: Add i18n keys for the settings popover

**Files:**
- Modify: `website/frontend/messages/en.json` (add under the existing `nav` block)
- Modify: `website/frontend/messages/zh.json` (add under the existing `nav` block)

- [ ] **Step 1: Find the existing `nav` block in en.json**

Run: `grep -n '"nav":' website/frontend/messages/en.json`
Expected: one line number where the `"nav": {` block opens.

- [ ] **Step 2: Add the three new keys inside `nav` in en.json**

Pick any spot inside the existing `nav` object (alphabetical is fine, or next to the existing `demo`/`buyNow`/`signup` keys):

```json
"settings": "Settings",
"settingsLang": "Language",
"settingsTheme": "Theme"
```

- [ ] **Step 3: Add the matching keys inside `nav` in zh.json**

```json
"settings": "设置",
"settingsLang": "语言",
"settingsTheme": "主题"
```

- [ ] **Step 4: Verify both files parse as JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('website/frontend/messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('website/frontend/messages/zh.json','utf8')); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 5: Commit**

```bash
git add website/frontend/messages/en.json website/frontend/messages/zh.json
git commit -m "i18n(nav): add settings/settingsLang/settingsTheme keys"
```

---

## Task 2: Create the SettingsPopover component

**Files:**
- Create: `website/frontend/src/components/layout/SettingsPopover.tsx`

- [ ] **Step 1: Create the component file**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useThemeContext } from '@/providers/ThemeProvider';

export default function SettingsPopover() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { toggleTheme } = useThemeContext();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const switchLocale = (next: string) => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const nextPath = pathname.match(/^\/(en|zh)(?=\/|$)/)
      ? pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${next}`)
      : `/${next}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
    router.replace(nextPath + hash);
    setOpen(false);
  };

  return (
    <div className="settings-wrapper" ref={wrapRef}>
      <button
        type="button"
        className="settings-trigger"
        aria-label={t('settings')}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div className="settings-popover" role="menu">
          <div className="settings-popover-section">
            <div className="settings-popover-label">{t('settingsLang')}</div>
            <div className="settings-popover-lang">
              <button
                type="button"
                className={`lang-btn${locale === 'en' ? ' active' : ''}`}
                onClick={() => switchLocale('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn${locale === 'zh' ? ' active' : ''}`}
                onClick={() => switchLocale('zh')}
              >
                中文
              </button>
            </div>
          </div>
          <div className="settings-popover-divider" />
          <div className="settings-popover-section">
            <div className="settings-popover-label">{t('settingsTheme')}</div>
            <button
              type="button"
              className="settings-popover-theme"
              onClick={() => { toggleTheme(); setOpen(false); }}
              aria-label="Toggle dark mode"
            >
              <svg className="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <svg className="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript/build still compiles standalone**

Run: `cd website/frontend && npx tsc --noEmit`
Expected: no errors. (The component is imported nowhere yet, so zero integration risk.)

- [ ] **Step 3: Commit**

```bash
git add website/frontend/src/components/layout/SettingsPopover.tsx
git commit -m "feat(nav): add SettingsPopover component with lang + theme"
```

---

## Task 3: Add CSS for SettingsPopover and remove dead desktop rules

**Files:**
- Modify: `website/frontend/src/app/styles/components.css`

- [ ] **Step 1: Append popover rules to the end of the "Header / Navigation" section (after line 462, before the "Reusable Utility Classes" comment)**

```css
/* Settings popover (desktop) */
.settings-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.settings-trigger {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}

.settings-trigger:hover,
.settings-trigger[aria-expanded="true"] {
  color: var(--primary-text);
  border-color: rgba(254, 191, 29, 0.4);
  background: var(--primary-dim);
}

.settings-trigger:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.settings-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 10px;
  z-index: 1000;
  animation: settingsPopoverIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes settingsPopoverIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.settings-popover-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px;
}

.settings-popover-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 0 4px;
}

.settings-popover-lang {
  display: flex;
  gap: 6px;
}

.settings-popover-lang .lang-btn {
  flex: 1;
  padding: 8px 10px;
  font-size: 0.82rem;
  border-radius: var(--radius);
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}

.settings-popover-lang .lang-btn:hover {
  color: var(--primary-text);
  background: var(--primary-dim);
  border-color: rgba(254, 191, 29, 0.4);
}

.settings-popover-lang .lang-btn.active {
  color: var(--primary-text);
  background: var(--primary-dim);
  border-color: rgba(254, 191, 29, 0.5);
  font-weight: 600;
}

.settings-popover-theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  font-size: 0.82rem;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}

.settings-popover-theme:hover {
  color: var(--primary-text);
  background: var(--primary-dim);
  border-color: rgba(254, 191, 29, 0.4);
}

.settings-popover-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 6px 0;
}
```

- [ ] **Step 2: Remove the now-dead desktop rules for `.header-actions .btn-demo` and `.header-actions .btn-signup`**

In `components.css`, delete lines 362–380 (the `.header-actions .btn-demo` rule and its `:hover`), and delete lines 404–420 (the `.header-actions .btn-signup`/`.mobile-nav-cta .btn-signup` shared rule and its `:hover`).

The replacement for `.mobile-nav-cta .btn-signup` will be added in Task 5 inside the mobile media block. The `.btn-demo` is going away entirely from the root scope because its mobile variant already has its own rule at line 2797 in `pages.css` (inside the `@media (max-width: 1024px)` block).

Keep untouched: `.header-actions .btn-buy` / `.mobile-nav-cta .btn-buy` (lines 338–359) — both desktop and mobile still use Buy. Keep `.header-actions .btn-login` (lines 389–402) — desktop still uses Login.

- [ ] **Step 3: Verify the file still parses by running the build**

Run: `cd website/frontend && npm run build`
Expected: build completes without CSS syntax errors. (Next.js uses lightningcss; syntax errors will fail the build.)

- [ ] **Step 4: Commit**

```bash
git add website/frontend/src/app/styles/components.css
git commit -m "style(nav): settings popover rules + drop dead desktop btn-demo/btn-signup"
```

---

## Task 4: Wire SettingsPopover into Header, remove desktop Demo/Signup

**Files:**
- Modify: `website/frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Add the import at the top of Header.tsx**

Insert after the existing `useAuth` import (line 9):

```tsx
import SettingsPopover from './SettingsPopover';
```

- [ ] **Step 2: Replace the `.header-actions` block (lines 291–364) with a trimmed version**

Locate the `<div className="header-actions">` opening tag (line 291) and its closing `</div>` (line 364). Replace the whole block with this:

```tsx
<div className="header-actions">
  <Link href="/buy" className="btn-buy">
    <span>{t('buyNow')}</span>
  </Link>

  {user ? (
    <div className="user-menu-wrapper" ref={userMenuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        <span className="user-menu-avatar">
          {(user.firstName || user.username || '?').charAt(0).toUpperCase()}
        </span>
        <span className="user-menu-name">{user.firstName || user.username}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {userMenuOpen && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <div className="user-menu-header-name">{user.firstName} {user.lastName}</div>
            <div className="user-menu-header-email">{user.email}</div>
          </div>
          <div className="user-menu-divider" />
          <Link href="/dashboard" className="user-menu-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            {t('dashboard')}
          </Link>
          {user.role === 'admin' && (
            <Link href="/admin" className="user-menu-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
              {t('adminPanel')}
            </Link>
          )}
          <div className="user-menu-divider" />
          <button type="button" className="user-menu-item user-menu-item--danger" role="menuitem" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link href="/login" className="btn-login">{t('login')}</Link>
  )}

  <SettingsPopover />
</div>
```

Key diffs vs the old block:
- Deleted the inline `.lang-switcher` pill (top of the block).
- Deleted the standalone `.theme-toggle` button.
- Deleted the `<Link href="/demo" className="btn-demo">…</Link>`.
- Deleted the `.auth-links` wrapper and the `<Link href="/register" className="btn-signup">` inside it.
- Added `<SettingsPopover />` at the end.
- Kept the user-menu dropdown exactly as-is.

- [ ] **Step 3: Scan for unused imports and remove them**

Hooks still used by the component after this edit: `useEffect`, `useRef`, `useState`, `useCallback`, `Image`, `Link`, `usePathname`, `useRouter`, `useLocale`, `useTranslations`, `useThemeContext`, `useAuth`.

The `switchLocale` function defined in Header.tsx (lines 78–84) and the `useThemeContext().theme / toggleTheme` destructure (line 18) are still used by the **mobile drawer** (`.mobile-nav-settings` block), so keep them. Run:

Run: `grep -c "switchLocale\|toggleTheme" website/frontend/src/components/layout/Header.tsx`
Expected: at least 3 matches (once each in the mobile block plus the declaration).

If the count is below 3, something was over-removed — revert and try again.

- [ ] **Step 4: Type check**

Run: `cd website/frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Build**

Run: `cd website/frontend && npm run build`
Expected: build succeeds, all 26 static pages export.

- [ ] **Step 6: Commit**

```bash
git add website/frontend/src/components/layout/Header.tsx
git commit -m "feat(nav): declutter desktop header — drop Demo/Signup, add SettingsPopover"
```

---

## Task 5: Rebuild mobile CTA layout (stacked + 50/50 auth pair)

**Files:**
- Modify: `website/frontend/src/components/layout/Header.tsx` (small JSX wrapper)
- Modify: `website/frontend/src/app/styles/pages.css`

- [ ] **Step 1: Wrap the login+signup pair in the mobile JSX with a `.mobile-nav-cta-auth` container**

In `Header.tsx`, locate the `<div className="mobile-nav-cta">` block (lines 253–269 in the original file; line numbers will have shifted after Task 4). Inside it, wrap only the `login` + `signup` `<Link>` tags (and the logout `<button>` when `user` is set) in a new sub-container. Replace the current content:

```tsx
<div className="mobile-nav-cta">
  <Link href="/buy" className="btn-buy" onClick={closeMenu}>
    <span>{t('buyNow')}</span>
  </Link>
  <Link href="/demo" className="btn-demo" onClick={closeMenu}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 3.5v9l6-4.5-6-4.5z" /></svg>
    <span>{t('demo')}</span>
  </Link>
  <div className="mobile-nav-cta-auth">
    {user ? (
      <button type="button" className="btn-login" onClick={() => { closeMenu(); handleLogout(); }}>{t('logout')}</button>
    ) : (
      <>
        <Link href="/login" className="btn-login" onClick={closeMenu}>{t('login')}</Link>
        <Link href="/register" className="btn-signup" onClick={closeMenu}>{t('signup')}</Link>
      </>
    )}
  </div>
</div>
```

- [ ] **Step 2: Rewrite `.mobile-nav-cta` rules inside `@media (max-width: 1024px)` in pages.css**

Locate the rules at lines 2792–2837 (`.mobile-nav-cta`, `.mobile-nav-cta .btn-demo`, `.mobile-nav-cta .btn-demo:hover`, `.mobile-nav-cta .btn-login`, `.mobile-nav-cta .btn-login:hover`). Replace that whole range with:

```css
  /* CTA stack — Buy (primary) / Demo (outlined) / Login+Signup pair */
  .mobile-nav-cta {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* All top-level CTA buttons are full-width with a 48px touch target */
  .mobile-nav-cta > .btn-buy,
  .mobile-nav-cta > .btn-demo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 12px 16px;
    min-height: 48px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: var(--radius);
    transition: all var(--transition);
  }

  /* Buy Now — solid gold (primary) */
  .mobile-nav-cta > .btn-buy {
    background: var(--primary);
    color: var(--black);
    font-weight: 700;
    border: none;
    box-shadow: 0 0 0 1px rgba(254, 191, 29, 0.25);
  }

  .mobile-nav-cta > .btn-buy:hover {
    background: var(--primary-hover);
    box-shadow: 0 0 20px rgba(230, 168, 23, 0.35), 0 0 0 1px rgba(254, 191, 29, 0.4);
  }

  /* Demo — outlined secondary */
  .mobile-nav-cta > .btn-demo {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-light);
  }

  .mobile-nav-cta > .btn-demo:hover {
    color: var(--primary-text);
    background: var(--primary-dim);
    border-color: rgba(254, 191, 29, 0.4);
  }

  /* Auth sub-row — Login | Sign up (50/50), collapses to 1 col on logout */
  .mobile-nav-cta-auth {
    display: flex;
    gap: 10px;
  }

  .mobile-nav-cta-auth > * {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px 16px;
    min-height: 48px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: var(--radius);
    transition: all var(--transition);
  }

  .mobile-nav-cta-auth .btn-login {
    color: var(--text-secondary);
    border: 1px solid var(--border-light);
    background: transparent;
  }

  .mobile-nav-cta-auth .btn-login:hover {
    color: var(--text-primary);
    border-color: var(--border-medium);
  }

  .mobile-nav-cta-auth .btn-signup {
    color: var(--primary-text);
    border: 1px solid rgba(254, 191, 29, 0.35);
    background: transparent;
  }

  .mobile-nav-cta-auth .btn-signup:hover {
    border-color: var(--primary);
    background: var(--primary-dim);
  }
```

- [ ] **Step 3: Check the `@media (max-width: 480px)` override around line 3375 still makes sense**

Locate lines 3375–3382 (small-phone override that currently shrinks `.mobile-nav-cta` padding):

Replace with:

```css
  .mobile-nav-cta {
    gap: 8px;
  }

  .mobile-nav-cta > .btn-buy,
  .mobile-nav-cta > .btn-demo,
  .mobile-nav-cta-auth > * {
    padding: 10px 14px;
    font-size: 0.88rem;
  }
```

- [ ] **Step 4: Build**

Run: `cd website/frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Verify mobile layout in dev server**

The dev server is already running at http://localhost:3000 (task `br5aoo4to`). Open in a browser, resize the window below 1024 px (or open DevTools device mode), click the hamburger.

Visual check:
- Drawer opens with `Buy Now` full-width at top (gold)
- Below it, `Demo` full-width (outlined)
- Below that, `Log in` + `Sign up` as a 50/50 pair
- All four buttons read as the same height (≥48 px)
- If logged in, the auth sub-row is a single full-width `Log out`

- [ ] **Step 6: Commit**

```bash
git add website/frontend/src/components/layout/Header.tsx website/frontend/src/app/styles/pages.css
git commit -m "style(nav): stack mobile CTA row; Buy over Demo over Login|Signup pair"
```

---

## Task 6: Desktop visual verification + regression sweep

**Files:** none (manual verification only)

- [ ] **Step 1: Confirm the dev server still has the new config loaded**

Visit http://localhost:3000/en/ in a desktop-width browser (≥1200 px). Expected right cluster:
- `Buy Now` (gold)
- `Log in` text link (or user avatar if you have a session)
- Gear icon button

**Not expected:** the old EN/中文 pill, theme toggle, Demo button, Sign up button — all of these should be gone from the top bar.

- [ ] **Step 2: Click the gear icon**

The popover should open below-right of the gear, showing a `LANGUAGE` header with `[EN] [中文]` side-by-side, a divider, then a `THEME` header with a clickable theme toggle.

- [ ] **Step 3: Interact with the popover**

- Click `中文` → route should switch to `/zh/` and popover closes.
- Open it again → click theme toggle → theme flips and popover closes.
- Open it again → press `Escape` → popover closes.
- Open it again → click outside it → popover closes.

- [ ] **Step 4: Click through every top-level nav link**

Home / Product (dropdown → B2C, B2B) / Pricing / Community (dropdown → Blog, Forum, FAQ) / Docs / Contact. Each should navigate correctly and the active-state underline should appear on the correct link.

- [ ] **Step 5: Log in (or use an existing session) and verify the user menu still works**

If not already signed in, navigate to `/login` and sign in as an existing user. After login, the right cluster should show `Buy Now` + user avatar pill + gear icon. Click the avatar → dashboard + admin (if admin) + log out options render correctly. Log out returns you to the unauthenticated state.

- [ ] **Step 6: Open the skip-nav link by pressing Tab from a fresh page load**

Focus order: `Skip to main content` → Logo → Home → Product trigger → (chevron still visible) → Pricing → Community trigger → Docs → Contact → Buy Now → Log in / avatar → Settings trigger. No hidden/dead focus stops.

- [ ] **Step 7: Final build + commit marker (empty commit if everything green)**

Run: `cd website/frontend && npm run build`
Expected: 26 static pages generated, no warnings about missing translations.

If the build is clean and manual checks all pass, no additional commit is needed. Proceed to deploy per CLAUDE.md.

---

## Task 7: Deploy and update CLAUDE.md session log

**Files:**
- Modify: `CLAUDE.md` (replace the single `## Last session` bullet, per project convention)

- [ ] **Step 1: Deploy frontend**

Run: `cd website/frontend && SFTP_PASSWORD='Gcss123.' npm run deploy`
Expected: `1321+ files uploaded` in ~7–10 minutes.

- [ ] **Step 2: Smoke test**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://47.242.75.250/api/products/plans`
Expected: `200`.

Open http://47.242.75.250/en/ in a browser, confirm the new header renders correctly.

- [ ] **Step 3: Update CLAUDE.md's `## Last session` bullet**

Replace the existing bullet under `## Last session` with a new one for today. Per the project's session-log rule: **replace, don't append** — keep only one entry.

Example content:

```markdown
- 2026-04-24 (nav cleanup): Desktop right-cluster collapsed from 7 controls to 3 (Buy Now / Log in or avatar / new Settings popover containing EN-中文 switcher and theme toggle). Demo and Sign up removed from top bar (still reachable via footer and /login page respectively). Mobile drawer CTA row rebuilt from single flex-row of four uneven buttons to stacked: Buy Now (full) over Demo (full) over Login|Signup (50/50, collapses to Log out when authenticated). All mobile CTA buttons now share a uniform ≥48 px touch target. New `SettingsPopover.tsx` component with click-outside + Escape close, reuses `usePathname`/`useRouter`/`useThemeContext`. Build green, deployed.
```

- [ ] **Step 4: Commit the log update**

```bash
git add CLAUDE.md
git commit -m "docs: update session log — nav cleanup"
```

---

## Self-review results

**Spec coverage:**
- Spec success criterion 1 (≥1025 px: 3 elements on right) → Task 4 Step 2.
- Spec success criterion 2 (settings popover open/close/Esc) → Task 2 Steps 1–2, Task 6 Steps 2–3.
- Spec success criterion 3 (mobile stacked CTA, ≥48 px) → Task 5 Steps 1–2.
- Spec success criterion 4 (logged-in mobile collapses to one Log out) → Task 5 Step 1 (conditional render) + Step 2 (`.mobile-nav-cta-auth > *` rule auto-widens single child).
- Spec success criterion 5 (no regressions: dropdowns, keyboard, skip-link, isActive) → Task 6 Steps 4, 5, 6.
- Spec success criterion 6 (EN/ZH in sync) → Task 1.
- Spec success criterion 7 (build green) → Task 4 Step 5, Task 5 Step 4, Task 6 Step 7.

**Placeholder scan:** No TBD/TODO/handwaves. Every code block is complete.

**Type consistency:** Component name `SettingsPopover` used consistently. All i18n keys (`settings`, `settingsLang`, `settingsTheme`) used as declared. Class names `.settings-trigger`, `.settings-popover`, `.settings-popover-section`, `.settings-popover-label`, `.settings-popover-lang`, `.settings-popover-theme`, `.settings-popover-divider`, `.mobile-nav-cta-auth` used consistently across Tasks 2, 3, 5.

**Known ambiguity resolved inline:** Task 4 Step 3 keeps `switchLocale` + `theme/toggleTheme` in Header.tsx because the mobile drawer's `.mobile-nav-settings` block still uses them — called out explicitly.
