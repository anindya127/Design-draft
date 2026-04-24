# Navigation cleanup — design

**Date:** 2026-04-24
**Scope:** `website/frontend/src/components/layout/Header.tsx` + mobile nav CSS in `website/frontend/src/app/styles/` (`components.css`, `pages.css`).
**Goal:** Fix two concrete nav issues — desktop clutter (too many CTA-shaped controls competing at equal weight) and mobile drawer CTA row (4 uneven buttons on one flex line).

## Current problems

1. **Desktop right-cluster crowding** (≥1025 px). The `.header-actions` region renders all of: `EN | 中文` pill, theme toggle, Demo (outlined gold), Buy Now (solid gold), Login (text), Sign up (outlined gold). Or, logged in: same set minus Login/Sign up, plus user-menu pill. Result: 4 CTA-shaped controls + 2-button lang pill + 1 icon button = 7 equal-weight targets, no hierarchy, Buy Now can't lead.
2. **Mobile drawer CTA row broken** (≤1024 px). `.mobile-nav-cta` is a single flex row containing `Buy Now + Demo + Login + Sign up` when logged out. Only `.btn-demo` and `.btn-login` have `flex: 1` and `min-height: 48px` inside the mobile media block; `.btn-buy` and `.btn-signup` inherit desktop rules (8 px padding, no flex sizing). On a 375 px phone this yields uneven heights, uneven widths, and likely overflow.

## Approach — "Strip & hide" (user-approved)

### Desktop (≥1025 px)

Right-cluster becomes a 3-slot layout:

| Slot | Content |
|---|---|
| Primary CTA | **Buy Now** — gold solid pill (unchanged styling) |
| Account entry | **Log in** text link **OR** user avatar menu (when authenticated) |
| Settings | New `⚙` icon button → opens a small popover containing EN/中文 switcher and theme toggle |

Removed from top bar:
- **Demo** button — stays in footer, in-page CTA sections. Reason: it is a secondary value prop, not a conversion-critical primary action.
- **Sign up** button — promoted via the Login page's "Create account" link (already exists). Reason: two auth buttons at top dilute the Log-in click target; new users can reach registration in one extra click.
- **Inline lang-switcher pill** — behavior preserved inside the settings popover. Reason: most visitors never switch language mid-session; surfacing it full-time consumes ~120 px.
- **Standalone theme toggle button** — same reasoning, moved into settings popover.

Net: 7 visual targets → 3 visual targets on the right.

### Mobile (≤1024 px)

`.mobile-nav-cta` becomes a **vertical stack** not a single row:

```
┌────────────────────────────┐
│      Buy Now (primary)     │  <- full width, gold
├────────────────────────────┤
│      Demo (outlined)       │  <- full width, outlined
├───────────────┬────────────┤
│   Log in      │  Sign up   │  <- 50/50, flex:1 each
└───────────────┴────────────┘
```

Logged in, the bottom row collapses to a single full-width **Log out**.

All buttons: `min-height: 48px`, uniform `padding: 12px 16px`, `font-size: 0.9rem`. This matches existing `.btn-demo` mobile treatment.

The lang switcher + theme toggle in `.mobile-nav-settings` below the CTA block stay as-is (they were already correct).

### Settings popover (new, desktop only)

- Trigger: a 36×36 icon button (`⚙` gear SVG), same visual weight as the current `.theme-toggle`.
- Panel: absolute-positioned beneath trigger, `min-width: 200px`, glass bg, matches `.user-menu-dropdown` visual language.
- Contents: a "Language" label + `[EN] [中文]` segmented buttons, then a "Theme" label + current theme-toggle button inline. No other items.
- Behavior: click trigger to toggle open; click outside to close; Escape to close; focus ring on trigger; tab order includes inner buttons.
- Reuses existing `.user-menu-dropdown` CSS pattern — same blur, border, shadow, radius.

## Out of scope

- Header dropdown dark-on-light bug (the `.nav-dropdown-menu` uses `var(--dark-elevated)` which reads dark in light mode). Noted for a future pass; not fixing here unless trivial.
- Mobile drawer slide-in animation — already works.
- Logo, Home/Product/Pricing/Community/Docs/Contact links — unchanged.
- User menu dropdown for authenticated users — unchanged.

## Files expected to change

- `website/frontend/src/components/layout/Header.tsx` — restructure `.header-actions` JSX: remove `.btn-demo` + `.auth-links .btn-signup` at desktop scope, wrap lang-switcher + theme-toggle in a new `<SettingsPopover>` component, add settings trigger button.
- `website/frontend/src/app/styles/components.css` — rules for `.settings-trigger`, `.settings-popover`; remove now-unused desktop rules for `.header-actions .btn-demo` and `.header-actions .btn-signup` (kept in mobile media block).
- `website/frontend/src/app/styles/pages.css` — mobile `.mobile-nav-cta` rules: change to column layout; add full-width rules for `.btn-buy`, `.btn-signup`; split the login/signup pair into a sub-row.
- `website/frontend/messages/en.json` + `zh.json` — add `nav.settings` + `nav.settingsLang` + `nav.settingsTheme` keys.

## Success criteria

1. At ≥1025 px, `.header-actions` shows at most 3 visible elements on the right: Buy Now, Log in/avatar, settings icon.
2. Clicking settings icon opens a panel containing both language buttons and the theme toggle; clicking outside closes it; Escape closes it.
3. At ≤1024 px, the mobile drawer's CTA block renders Buy Now (full-width) above Demo (full-width) above a Login/Sign-up pair (50/50). All buttons have ≥48 px touch height.
4. Logged-in mobile state: Buy Now, Demo, Log out — the bottom row collapses to one full-width button.
5. No regressions: existing nav dropdowns still open on hover/focus/click; keyboard tab order still works; skip-link still functions; `isActive()` highlighting unchanged.
6. EN/ZH translations in sync for all new keys.
7. Existing `go test ./...` passes; `npm run build` succeeds.

## Non-goals / won't change

- Overall header height / glass background.
- Footer, sidebar, or page-body navigation.
- Locale routing logic.
- Auth flow.
