# Mobile View Design — FGGC Alumni Website

**Date:** 2026-05-08
**Status:** Approved

## Overview

Add complete mobile responsiveness to the FGGC Gboko Alumni website. The site currently has partial media queries at 768px and 960px that are incomplete. The approach is to extend the existing `styles.css` — fixing and completing those breakpoints, adding new mobile-specific components, and ensuring all 7+ pages render correctly on phones.

No new CSS files, no framework changes. All additions go into `styles.css` within the existing breakpoint structure.

## Breakpoints

| Breakpoint | Target |
|---|---|
| `max-width: 960px` | Tablets (already exists, extend) |
| `max-width: 768px` | Mobile phones (already exists, extend) |
| `max-width: 480px` | Small phones — padding and font-size tweaks only |

## Navigation (all pages)

**Problem:** The floating glass pill nav does not adapt to small screens.

**Solution:**
- Hide `.nav-pill` (or equivalent nav container) on mobile (`max-width: 768px`)
- Add a fixed bottom navigation bar (`.mobile-bottom-nav`) to all HTML pages
- 5 tabs: Home, About, Gallery, News, Login (or Dashboard when logged in)
- Active tab highlighted in sky blue (`#5BAACC`); inactive tabs in muted white
- Bar background: navy (`#0D2B4E`) with backdrop blur, matching the site's glass aesthetic
- Border-top: `1px solid rgba(91, 170, 204, 0.2)`
- Height: ~60px fixed at bottom of viewport
- Hidden on desktop with `@media (min-width: 769px) { .mobile-bottom-nav { display: none; } }`
- All pages get `padding-bottom: 70px` on mobile to prevent content hiding behind the bar

## Homepage (`index.html`)

**Problem:** Bento grid with `grid-template-columns: 1fr 1fr 300px` breaks on small screens.

**Solution (≤768px):**
- Bento grid → single column, stacking order: focus story → events sidebar → challenges widget
- Events sidebar: `width: 100%`, loses fixed 300px constraint
- Weekly challenges widget: full width
- Hero section: reduced vertical padding, heading uses existing `clamp()` sizing
- Decorative floating blobs: `display: none` (they overflow and clip on mobile)
- Stat counters row: switch to `grid-template-columns: repeat(2, 1fr)` (2×2 grid)

## Dashboard (`dashboard.html`)

**Problem:** 4-column dues grid (`repeat(4, 1fr)`) is unreadable on mobile.

**Solution (≤768px):**
- Profile header and payment status badge: stack vertically, center-aligned
- Stat summary cards: stay at 2-column (verify existing CSS works correctly)
- Monthly dues grid: convert to horizontal scroll strip
  - Container: `display: flex; overflow-x: auto; gap: 12px; padding-bottom: 8px; -webkit-overflow-scrolling: touch`
  - Individual due cards: `flex-shrink: 0; width: 140px` (fixed width, cards don't compress)
  - Hide scrollbar visually but keep scroll functional
- Quick action buttons: `width: 100%; display: block` (stack full-width)

## Gallery (`gallery.html`)

**Problem:** 3-column masonry (`columns: 3`) may not fully collapse cleanly.

**Solution (≤768px):**
- Verify `columns: 1` is applied and rendering correctly
- Lightbox close button: minimum touch target of 44×44px
- Image captions: always visible (remove any hover-only visibility rules)
- Video badge indicator: ensure visible and legible at small sizes

## News (`news.html`)

**Problem:** Pill tab switcher and news item layouts don't adapt to narrow screens.

**Solution (≤768px):**
- Tab switcher: `display: flex; width: 100%` — each tab takes equal width (`flex: 1`)
- News item layout: image stacks above text (switch from `display: flex; flex-direction: row` to `flex-direction: column`)
- News item image: `width: 100%; height: auto`
- Document download buttons: `width: 100%; text-align: center`

## Admin Dashboard (`admin-dashboard.html`)

**Problem:** Wide member table and multi-column finance grid don't fit on mobile.

**Solution (≤768px):**
- Member table wrapper: `overflow-x: auto; -webkit-overflow-scrolling: touch`
- Table itself: `min-width: 600px` so it retains readable column widths while scrolling
- Finance overview grid: collapse to single column
- Summary stat cards: `grid-template-columns: repeat(2, 1fr)`

## Admin Finance (`admin-finance.html`)

**Solution (≤768px):**
- Any data tables: same horizontal scroll treatment as admin dashboard
- Summary stats: 2-column grid

## Auth Pages (`login.html`, `signup.html`, `forgot-password.html`, `reset-password.html`)

**Problem:** Form containers may have fixed widths or excess padding on small screens.

**Solution (≤768px):**
- Form container: `width: 100%; max-width: 100%; margin: 0; border-radius: 0` or `16px` side margins
- Input fields: `width: 100%; box-sizing: border-box`
- Submit buttons: `width: 100%`
- Reduce top/bottom padding on the page wrapper

## About (`about.html`)

**Solution (≤768px):**
- Statistics cards (members, founded, location): `grid-template-columns: repeat(2, 1fr)`
- Mission/vision text sections: single column, full width
- Any side-by-side content blocks: stack vertically

## Small Phone Pass (≤480px)

Applied globally — no layout changes, only:
- Reduce base font size by ~1–2px where headings feel oversized
- Tighten horizontal padding on cards and sections (`padding: 16px` → `padding: 12px`)
- Ensure no horizontal overflow on any page (check with `overflow-x: hidden` on `body` if needed)

## Implementation Notes

- All changes go into `frontend/css/styles.css` within the existing `@media` blocks
- The `.mobile-bottom-nav` HTML block must be added to all 11 HTML files
- The bottom nav active state is controlled by a `data-page` attribute or by adding an `active` class via JS (matching the current page URL)
- The floating pill nav hidden class: confirm the exact selector in the current CSS before hiding it
- Test on Chrome DevTools mobile emulation (iPhone SE 375px, iPhone 14 390px, Pixel 7 412px) before marking complete
