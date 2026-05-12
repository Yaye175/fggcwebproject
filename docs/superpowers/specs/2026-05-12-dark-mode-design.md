# Dark Mode Design — FGGC Alumni Website

**Date:** 2026-05-12
**Status:** Approved

## Overview

Add a dark mode toggle to every page of the FGGC Alumni website. The implementation uses CSS custom property overrides driven by a `data-theme="dark"` attribute on `<html>`. A floating circular button in the bottom-right corner lets users toggle between light and dark. Preference is persisted in `localStorage` and automatically respects the OS `prefers-color-scheme` setting on first visit.

## Approach

- **CSS-variable-driven:** All colours flow through existing CSS tokens. A `[data-theme="dark"]` block in `styles.css` redefines the tokens — no component-level changes needed.
- **Flash-free:** A tiny inline script in `<head>` (before CSS loads) sets the attribute immediately, preventing any flash of the wrong theme.
- **Persistent:** `localStorage` key `fggc-theme` stores `"light"` or `"dark"`. On first visit, `prefers-color-scheme` is checked; if neither is available, light mode is the default.

## Dark Mode Colour Tokens

| Token | Light Mode | Dark Mode |
|---|---|---|
| `--cream` | `#F7F3ED` | `#0D1B2E` |
| `--cream-deep` | `#EDE5D8` | `#091520` |
| `--pearl` | `#FEFCF8` | `#112338` |
| `--navy` | `#0D2B4E` | `#E8E4DC` |
| `--text-dark` | `#3D3D3D` | `#E8E4DC` |
| `--text-mid` | `#7A7A8C` | `#9AADBE` |
| `--text-body` | `#5A5A6A` | `#B8C8D8` |
| `--border-color` | `#E5DDD3` | `rgba(91, 170, 204, 0.15)` |
| `--sky` | `#5BAACC` | `#5BAACC` (unchanged) |
| `--green` | `#2E8B57` | `#2E8B57` (unchanged) |
| `--danger` | `#D9534F` | `#D9534F` (unchanged) |
| `--shadow-card` | `0 8px 40px rgba(13,43,78,0.09)` | `0 8px 40px rgba(0,0,0,0.35)` |
| `--shadow-raised` | `0 16px 56px rgba(0,0,0,0.20)` | `0 16px 56px rgba(0,0,0,0.55)` |
| `--shadow-nav` | `0 4px 24px rgba(13,43,78,0.10)` | `0 4px 24px rgba(0,0,0,0.40)` |

## Component-Level Overrides

Several components use hardcoded `rgba(255,255,255,...)` values that cannot be driven by tokens alone. These get explicit `[data-theme="dark"]` overrides:

| Selector | Dark override |
|---|---|
| `.glass-card` | `background: rgba(255,255,255,0.05); border-color: rgba(91,170,204,0.15)` |
| `.glass-card--dark` | `background: rgba(255,255,255,0.03); border-color: rgba(91,170,204,0.12)` |
| `.nav-pill--light` | `background: rgba(255,255,255,0.06); border-color: rgba(91,170,204,0.15)` |
| `.nav-pill--dark` | `background: rgba(255,255,255,0.04)` |
| `table` | `background: rgba(255,255,255,0.04)` |
| `.news-item` | `background: rgba(255,255,255,0.04); border-color: rgba(91,170,204,0.12)` |
| `.form-container` | `background: rgba(255,255,255,0.04)` |
| `.form-container--dark` | unchanged (already dark) |
| `.news-tab:not(.active)` | `background: rgba(255,255,255,0.08)` |
| `tbody tr:hover` | `background: rgba(91,170,204,0.08)` |
| `th` | `background: rgba(13,43,78,0.8)` |

## Theme Toggle Button

**Placement:** Fixed, bottom-right corner of every page.

**Desktop:** `bottom: 2rem; right: 2rem`

**Mobile (≤768px):** `bottom: calc(70px + env(safe-area-inset-bottom) + 1rem); right: 1rem` — sits above the bottom nav bar.

**Appearance:**
- 44×44px circle
- Light mode: navy background (`var(--navy)`), moon SVG icon in cream
- Dark mode: sky blue background (`#5BAACC`), sun SVG icon in navy
- `z-index: 250` (below modals at 10000, below nav at 300 — but above page content)
- Hover: slight scale-up and shadow lift
- `aria-label="Toggle dark mode"`

**Icon swap:**
- `.theme-icon-moon` visible in light mode, hidden in dark
- `.theme-icon-sun` hidden in light mode, visible in dark
- Controlled by `[data-theme="dark"] .theme-icon-*` CSS rules

## JavaScript: `theme.js`

New file at `fggc-alumnii/frontend/js/theme.js`.

```js
(function () {
    function getTheme() {
        var stored = localStorage.getItem('fggc-theme');
        if (stored === 'dark' || stored === 'light') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        var btn = document.getElementById('theme-toggle');
        if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    window.toggleTheme = function () {
        var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('fggc-theme', next);
        applyTheme(next);
    };

    applyTheme(getTheme());
})();
```

## Inline Flash-Prevention Script

Added to `<head>` of all 11 HTML files as the **first child of `<head>`** (before the CSS `<link>`):

```html
<script>try{var t=localStorage.getItem('fggc-theme')||( window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}</script>
```

Minified for minimal parse cost. Wrapped in `try/catch` so localStorage errors (private browsing restrictions) don't break the page.

## Toggle Button HTML

Added to all 11 HTML files immediately before `</body>`:

```html
    <!-- Dark mode toggle -->
    <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="Switch to dark mode">
        <svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>
    <script src="js/theme.js"></script>
```

Note: `theme.js` is loaded here (end of body) for the toggle function. The flash-prevention script in `<head>` is separate and handles the initial theme application before CSS loads.

## Files Changed

| File | Change |
|---|---|
| `fggc-alumnii/frontend/css/styles.css` | Add `[data-theme="dark"]` CSS block + toggle button CSS |
| `fggc-alumnii/frontend/js/theme.js` | NEW — theme detection, toggle, localStorage |
| All 11 HTML files | Inline flash-prevention script in `<head>` + button + `theme.js` script before `</body>` |

## Implementation Notes

- The `[data-theme="dark"]` CSS block goes near the top of `styles.css`, immediately after the `:root` token block and before the `/* Reset */` comment — so dark tokens take effect before any component CSS.
- Test in Chrome DevTools with `prefers-color-scheme: dark` emulation (Rendering tab → Emulate CSS media feature) to verify auto-detection.
- Test in private/incognito mode to verify the `try/catch` in the flash-prevention script handles restricted `localStorage`.
- The hero sections on index.html, login.html, and signup.html already use a navy background (`page-hero` class) — in dark mode these will remain visually unchanged, which is correct.
