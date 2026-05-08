# Mobile View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page of the FGGC Alumni site fully usable on mobile phones by extending the existing CSS and adding a bottom navigation bar.

**Architecture:** All CSS changes go into `fggc-alumnii/frontend/css/styles.css` inside the existing `@media (max-width: 768px)` and `@media (max-width: 960px)` blocks, plus a new `@media (max-width: 480px)` block. A new `.mobile-bottom-nav` HTML block is added to all 11 HTML pages. No new files created.

**Tech Stack:** Vanilla HTML/CSS, no framework. Git repo root is `C:/Users/arnol/OneDrive/Documents/fggcwebproject/`.

---

## File Map

| File | Change |
|---|---|
| `fggc-alumnii/frontend/css/styles.css` | All CSS changes — new nav CSS, updated media query blocks |
| `fggc-alumnii/frontend/index.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/about.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/gallery.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/news.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/login.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/signup.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/dashboard.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/admin-dashboard.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/admin-finance.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/forgot-password.html` | Add mobile bottom nav block |
| `fggc-alumnii/frontend/reset-password.html` | Add mobile bottom nav block |

---

## Task 1: Add mobile bottom nav CSS

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — insert after line 105 (after the `a:hover` rule, before the `FLOATING GLASS PILL NAV` comment block)

- [ ] **Step 1: Insert the `.mobile-bottom-nav` CSS block**

Open `fggc-alumnii/frontend/css/styles.css`. Find this line (around line 106):

```css
/* ══════════════════════════════════
   FLOATING GLASS PILL NAV
══════════════════════════════════ */
```

Insert the following block **immediately before** that comment:

```css
/* ══════════════════════════════════
   MOBILE BOTTOM NAV
══════════════════════════════════ */
.mobile-bottom-nav {
    display: none;
}

@media (max-width: 768px) {
    .mobile-bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 300;
        background: rgba(13, 43, 78, 0.97);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-top: 1px solid rgba(91, 170, 204, 0.2);
        height: 60px;
        align-items: stretch;
    }

    .mobile-nav-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: rgba(255, 255, 255, 0.45);
        text-decoration: none;
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        transition: color 0.2s;
        padding: 6px 0;
    }

    .mobile-nav-tab.active,
    .mobile-nav-tab:hover {
        color: var(--sky);
    }

    .mobile-nav-tab svg {
        stroke: currentColor;
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/arnol/OneDrive/Documents/fggcwebproject"
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: add mobile bottom nav CSS"
```

---

## Task 2: Replace nav-pill mobile rules and add body padding

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — update the `@media (max-width: 768px)` block (currently around line 1139, will have shifted due to Task 1 insertion)

The existing 768px block has complex rules that make `.nav-pill` go vertical. Since we're hiding it on mobile and replacing it with the bottom nav, those rules are dead weight and the `display: none` must come first.

- [ ] **Step 1: Replace the nav-pill rules inside the 768px block**

Find the `@media (max-width: 768px)` block. It currently starts with:

```css
@media (max-width: 768px) {
    .nav-pill {
        flex-direction: column;
        border-radius: var(--r-lg);
        margin: 0.75rem 1rem 0;
        top: 0.75rem;
        gap: 0.75rem;
        padding: 0.85rem 1.25rem;
    }

    .nav-links-list {
        flex-wrap: wrap;
        justify-content: center;
    }

    .nav-pill .auth-buttons {
        flex-direction: column;
        width: 100%;
    }

    .nav-pill .auth-buttons .btn {
        width: 100%;
        padding: 0.65rem;
        font-size: 0.92rem;
    }

    .page-below {
        padding: 1.5rem 1rem;
    }
```

Replace the four `.nav-pill` / `.nav-links-list` / `.nav-pill .auth-buttons` / `.nav-pill .auth-buttons .btn` rules with these two rules, keeping `.page-below` and everything after it intact:

```css
@media (max-width: 768px) {
    .nav-pill {
        display: none;
    }

    body {
        padding-bottom: 70px;
    }

    .page-below {
        padding: 1.5rem 1rem;
    }
```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: hide desktop nav on mobile, add body padding for bottom nav"
```

---

## Task 3: Add mobile bottom nav HTML to all 11 pages

**Files:** All 11 HTML files in `fggc-alumnii/frontend/`

The bottom nav HTML block and active-state script must be inserted immediately before `</body>` on every page. The `data-page` attribute on each tab must match the filename without `.html`.

- [ ] **Step 1: Add the nav block to `index.html`**

Find `</body>` in `index.html` and insert immediately before it:

```html
    <!-- Mobile bottom navigation -->
    <nav class="mobile-bottom-nav">
        <a href="index.html" class="mobile-nav-tab" data-page="index">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
        </a>
        <a href="about.html" class="mobile-nav-tab" data-page="about">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>About</span>
        </a>
        <a href="gallery.html" class="mobile-nav-tab" data-page="gallery">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Gallery</span>
        </a>
        <a href="news.html" class="mobile-nav-tab" data-page="news">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>News</span>
        </a>
        <a href="login.html" class="mobile-nav-tab" data-page="login">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Login</span>
        </a>
    </nav>
    <script>
    (function() {
        var page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        var tab = document.querySelector('.mobile-nav-tab[data-page="' + page + '"]');
        if (tab) tab.classList.add('active');
    })();
    </script>
```

- [ ] **Step 2: Repeat for the remaining 10 HTML files**

Add the identical block above (the full `<nav class="mobile-bottom-nav">` + `<script>`) before `</body>` in each of these files. The block is identical on every page — the inline script reads the URL to set the active tab automatically, so no per-page change is needed.

Files to update:
- `about.html`
- `gallery.html`
- `news.html`
- `login.html`
- `signup.html`
- `dashboard.html`
- `admin-dashboard.html`
- `admin-finance.html`
- `forgot-password.html`
- `reset-password.html`

- [ ] **Step 3: Commit**

```bash
git add fggc-alumnii/frontend/
git commit -m "feat: add mobile bottom nav to all pages"
```

---

## Task 4: Hide decorative blobs and fix homepage on mobile

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — add to the `@media (max-width: 768px)` block

Blobs overflow and clip badly on small screens. The bento grid at 960px already collapses to 1 column, but at 768px we need full-width sidebar and no blobs.

- [ ] **Step 1: Add blob and bento fixes to the 768px block**

Inside the existing `@media (max-width: 768px)` block, add these rules (after the `body { padding-bottom: 70px }` rule added in Task 2):

```css
    /* Hide decorative blobs on mobile — they clip and overflow */
    .blob {
        display: none;
    }

    /* Bento grid: already 1-col at 960px, ensure sidebar is full-width at 768px */
    .bento-sidebar {
        width: 100%;
    }

    /* Hero card: tighten for small screens */
    .hero-card-wrap {
        padding: 1rem;
    }
```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: hide blobs on mobile, fix bento sidebar width"
```

---

## Task 5: Dashboard — horizontal scroll strip for monthly dues

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — add to the `@media (max-width: 768px)` block

The `.user-month-grid` uses `repeat(4, 1fr)` which renders 4 tiny columns on mobile. Convert it to a horizontal flex scroll strip.

- [ ] **Step 1: Add dues grid override to the 768px block**

Inside `@media (max-width: 768px)`, add:

```css
    /* Monthly dues: horizontal scroll strip instead of 4-column grid */
    .user-month-grid {
        display: flex;
        flex-direction: row;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        gap: 0.6rem;
        padding-bottom: 6px;
        /* Hide scrollbar visually but keep it functional */
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .user-month-grid::-webkit-scrollbar {
        display: none;
    }

    .month-box {
        flex-shrink: 0;
        width: 80px;
        padding: 0.65rem 0.25rem;
    }
```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: dashboard dues grid becomes horizontal scroll strip on mobile"
```

---

## Task 6: News — full-width pill tabs and stacked news items

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — add to the `@media (max-width: 768px)` block

`.pill-tabs` uses `display: flex; gap: 0.5rem` — tabs don't expand to fill width. `.news-item` uses `display: flex` with a side-by-side image and text — image needs to stack above text on mobile.

- [ ] **Step 1: Add news fixes to the 768px block**

Inside `@media (max-width: 768px)`, add:

```css
    /* Pill tabs: full-width equal tabs */
    .pill-tabs {
        gap: 0.35rem;
    }

    .news-tab {
        flex: 1;
        text-align: center;
        padding: 0.5rem 0.5rem;
    }

    /* News items: stack image above text */
    .news-item {
        flex-direction: column;
        gap: 0.75rem;
    }

    .news-item img {
        width: 100%;
        height: 180px;
        border-radius: var(--r-md);
    }
```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: news tabs full-width, news items stack vertically on mobile"
```

---

## Task 7: Admin table — enforce min-width for horizontal scroll

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — add to the `@media (max-width: 768px)` block

The admin table wrapper in `admin-dashboard.html` already has `overflow-x: auto` (line 66 in admin-dashboard.html). However, the `table` itself has no `min-width`, so columns still get crushed. Adding `min-width` forces the table to stay readable while the wrapper scrolls.

- [ ] **Step 1: Add table min-width to the 768px block**

Inside `@media (max-width: 768px)`, add:

```css
    /* Admin table: enforce min-width so columns stay readable inside the existing overflow-x wrapper */
    table {
        min-width: 620px;
        border-radius: 0;
    }
```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: admin table min-width for horizontal scroll on mobile"
```

---

## Task 8: Auth pages — fix form container width on mobile

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — update existing form-container rule in the `@media (max-width: 768px)` block

The existing 768px block already has:
```css
    .form-container,
    .form-container--dark {
        padding: 1.75rem 1.25rem;
    }
```

This only reduces padding but doesn't fix width. The form containers need constrained width with side margins to prevent edge-to-edge stretching or overflow.

- [ ] **Step 1: Update the existing form-container rule in the 768px block**

Find and replace the existing rule:

```css
    .form-container,
    .form-container--dark {
        padding: 1.75rem 1.25rem;
    }
```

With:

```css
    .form-container,
    .form-container--dark {
        padding: 1.75rem 1.25rem;
        width: calc(100% - 32px);
        max-width: 100%;
        margin-left: 16px;
        margin-right: 16px;
        box-sizing: border-box;
    }
```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: fix auth form container width on mobile"
```

---

## Task 9: Add 480px small-phone pass

**Files:**
- Modify: `fggc-alumnii/frontend/css/styles.css` — add a new `@media (max-width: 480px)` block after the existing 768px block (before the gallery video thumbnails comment)

- [ ] **Step 1: Insert the 480px block**

Find this comment in `styles.css` (around the line after the 768px closing brace):

```css
/* Gallery video thumbnails */
```

Insert immediately before it:

```css
@media (max-width: 480px) {
    /* Tighten padding on cards and main content areas */
    .glass-card {
        padding: 1.1rem !important;
    }

    main {
        padding: 1rem 0.75rem;
    }

    .page-below {
        padding: 1rem 0.75rem;
    }

    /* Prevent any horizontal overflow */
    body {
        overflow-x: hidden;
    }

    /* Stat grid stays single column on very small phones */
    .stat-card-grid {
        grid-template-columns: 1fr;
    }

    /* Hero card: minimal padding */
    .hero-card {
        padding: 1.25rem 1rem;
    }
}

```

- [ ] **Step 2: Commit**

```bash
git add fggc-alumnii/frontend/css/styles.css
git commit -m "feat: add 480px small-phone pass with padding tweaks and overflow fix"
```

---

## Task 10: Visual verification in Chrome DevTools

No code changes — this task is purely verification. Open Chrome, press F12 → Toggle Device Toolbar (Ctrl+Shift+M).

- [ ] **Step 1: Test each page at iPhone SE size (375px wide)**

Load each URL (open `index.html` directly in browser or via local server) and check:

| Page | What to verify |
|---|---|
| `index.html` | Bottom nav visible, desktop nav gone, bento cards stacked, no horizontal scroll |
| `about.html` | Bottom nav active on "About", cards stacked, no overflow |
| `gallery.html` | Bottom nav active on "Gallery", 1-column masonry, lightbox close button tappable |
| `news.html` | Tabs fill full width, news images stack above text, bottom nav active |
| `login.html` | Form centered with 16px side margins, bottom nav visible |
| `signup.html` | Same as login |
| `forgot-password.html` | Form readable |
| `reset-password.html` | Form readable |
| `dashboard.html` | Dues cards scroll horizontally, bottom nav active on "Login" tab (or update data-page to "dashboard") |
| `admin-dashboard.html` | Member table scrolls horizontally with readable columns |
| `admin-finance.html` | No overflow |

- [ ] **Step 2: Test at Pixel 7 size (412px wide)**

Repeat the same checks — pay special attention to the homepage hero card and the news items.

- [ ] **Step 3: Fix any issues found**

For each visual problem found, identify the selector and add/adjust the relevant rule in `styles.css` inside the appropriate media block. Commit each fix separately with a descriptive message.

- [ ] **Step 4: Final commit**

```bash
git add fggc-alumnii/frontend/
git commit -m "fix: mobile view verification fixes"
```

---

## Notes for the implementer

- **dashboard.html `data-page`:** The bottom nav's Login tab will be active on the dashboard page because `dashboard.html` doesn't match any `data-page`. If you want the correct tab active on dashboard, change `data-page="login"` to `data-page="dashboard"` on the Login tab anchor and add `<a href="dashboard.html" ...>` as a separate tab — or accept that no tab is active on dashboard/admin pages (the auth.js already shows a "Dashboard" link in the desktop nav dynamically).
- **`z-index: 9999 !important` rule:** The existing 768px block has a blanket rule `button, .btn, input, select, a { position: relative !important; z-index: 9999 !important }`. This was added to fix a click-through issue. Leave it as-is — the bottom nav uses `z-index: 300` which is below 9999, so interactive elements inside the bottom nav will still be clickable.
- **Test the bottom nav on auth pages:** Login/signup pages use `.page-hero` as a full-page background. Make sure `body { padding-bottom: 70px }` gives enough room that the form isn't hidden behind the bottom nav on very short phones.
