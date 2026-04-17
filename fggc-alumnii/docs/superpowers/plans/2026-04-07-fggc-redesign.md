# FGGC Alumni Website — Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old navy header + flat card layout with Warm Glass — floating glass pill nav, frosted glass cards, dark navy hero sections — across all 9 existing pages, plus create one new `admin-finance.html` page, touching only HTML and CSS.

**Architecture:** Single global stylesheet replacement (`frontend/css/styles.css`) provides all design tokens and reusable components. Each HTML page is then restructured page-by-page: the old `<header>` element is replaced with a `<nav class="nav-pill">`, page sections gain glass card wrappers, and dark-hero pages gain a navy `<div class="page-hero">` wrapper. No JavaScript files are modified.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, backdrop-filter, CSS grid/columns), Google Fonts (Playfair Display + Inter). No build tools.

---

## Critical: JS Hooks — Never Rename These

The following IDs and classes are read or written by existing JS. Renaming or removing them breaks functionality:

| ID / Class | Used by | Purpose |
|---|---|---|
| `#auth-links` | auth.js | Container where Login/Logout buttons are injected |
| `#login-form` | auth.js | Login form submission |
| `#signup-form` | auth.js | Sign-up form submission |
| `#error-message` | auth.js | Error text display |
| `#email`, `#password` | auth.js | Login inputs |
| `#first_name`, `#last_name`, `#graduation_year` | auth.js | Sign-up inputs |
| `#story-container` | index.html inline JS | Story content injected |
| `#events-container` | index.html inline JS | Events injected |
| `.news-tab[data-type]` | news.html inline JS | Tab click handler |
| `#news-container` | news.html inline JS | News items injected |
| `#gallery-container` | gallery.html inline JS | Gallery items injected |
| `.gallery-item[data-index]` | gallery.html inline JS | Lightbox click handler |
| `#lightbox`, `#lightbox.open` | gallery.html inline JS | Lightbox show/hide |
| `#lightbox-img`, `#lightbox-caption`, `#lightbox-close` | gallery.html inline JS | Lightbox elements |
| `#profile-name`, `#profile-email` | dashboard.js | Profile text |
| `#monthly-status`, `#payment-status`, `#current-year` | dashboard.js | Payment display |
| `#monthly-grid` | dashboard.js | Month chip container |
| `.month-box`, `.month-box.paid`, `.month-box.unpaid` | dashboard.js | Month styling |
| `.badge`, `.badge-paid`, `.badge-unpaid` | dashboard.js | Payment badge |
| `#users-table-body` | admin-dashboard.js | Table rows injected |
| `#status-filter` | admin-dashboard.js | Filter select |
| `#send-all-reminders-btn` | admin-dashboard.js | Bulk reminder |
| `.status-badge`, `.status-paid`, `.status-pending`, `.status-overdue` | admin-dashboard.js | Status chips |
| `.action-btn[data-action]`, `.reminder-btn` | admin-dashboard.js | Per-row buttons |
| `#payment-modal` | admin-dashboard.js | Modal (toggled via `style.display`) |
| `#modal-close-btn`, `#save-payment-btn` | admin-dashboard.js | Modal buttons |
| `.month-check`, `.preset-btn[data-preset]` | admin-dashboard.js | Month checkboxes & presets |
| `#tab-users-btn`, `#tab-pro-btn` | admin-dashboard.html inline JS | Tab switchers |
| `#tab-users`, `#tab-pro` | admin-dashboard.html inline JS | Tab sections |
| `#nav-admin-title` | admin-dashboard.html inline JS | Role label |
| `#pro-news-form`, `#pro-event-form`, `#pro-gallery-form` | admin-dashboard.html inline JS | Upload forms |
| `#news-type`, `#news-title`, `#news-content`, `#news-image`, `#news-document` | admin-dashboard.html inline JS | News form inputs |
| `#event-title`, `#event-date`, `#event-location`, `#event-description` | admin-dashboard.html inline JS | Event form inputs |
| `#gallery-caption`, `#gallery-image` | admin-dashboard.html inline JS | Gallery form inputs |

---

## File Map

| File | Action | Notes |
|---|---|---|
| `frontend/css/styles.css` | **Replace** | Full Warm Glass design system |
| `frontend/index.html` | **Modify** | New nav + dark hero + glass bento |
| `frontend/about.html` | **Modify** | New nav + glass card sections |
| `frontend/news.html` | **Modify** | New nav + pill tabs + glass items |
| `frontend/gallery.html` | **Modify** | New nav + masonry glass items |
| `frontend/login.html` | **Modify** | New dark nav + dark glass form |
| `frontend/signup.html` | **Modify** | New dark nav + dark glass form |
| `frontend/dashboard.html` | **Modify** | New nav + glass stat cards |
| `frontend/admin-dashboard.html` | **Modify** | New nav + glass table + glass forms |
| `frontend/admin-finance.html` | **Create** | New dark page, loads admin-dashboard.js |

---

## Task 1: Replace `frontend/css/styles.css`

**Files:**
- Modify: `frontend/css/styles.css`

- [ ] **Step 1: Replace the entire file with this content**

```css
/* ============================================================
   FGGC Alumni — Warm Glass Design System
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

/* ── Design Tokens ── */
:root {
    /* Core palette */
    --navy:       #0D2B4E;
    --sky:        #5BAACC;
    --cream:      #F7F3ED;
    --cream-deep: #EDE5D8;
    --pearl:      #FEFCF8;
    --green:      #2E8B57;
    --danger:     #D9534F;
    --text-dark:  #3D3D3D;
    --text-mid:   #7A7A8C;
    --text-body:  #5A5A6A;

    /* Legacy aliases — kept because JS-injected HTML uses var(--primary-navy) etc. */
    --primary-navy:      #0D2B4E;
    --secondary-skyblue: #5BAACC;
    --accent-green:      #2E8B57;
    --danger-red:        #D9534F;
    --text-muted:        #7A7A8C;
    --text-light:        #FFFFFF;
    --bg-cream:          #F7F3ED;
    --bg-pearl:          #FEFCF8;
    --bg-white:          #FEFCF8;
    --bg-light:          #F7F3ED;
    --border-color:      #E5DDD3;

    /* Radii */
    --r-sm:   10px;
    --r-md:   14px;
    --r-lg:   18px;
    --r-pill: 50px;

    /* Shadows */
    --shadow-card:   0 8px 40px rgba(13,43,78,0.09);
    --shadow-raised: 0 16px 56px rgba(0,0,0,0.20);
    --shadow-nav:    0 4px 24px rgba(13,43,78,0.10);
    --shadow-modal:  0 16px 56px rgba(13,43,78,0.16);
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Base ── */
body {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background: var(--cream);
    color: var(--text-dark);
    line-height: 1.65;
    min-height: 100vh;
}

/* ── Typography ── */
h1, h2, h3, h4 {
    font-family: 'Playfair Display', Georgia, serif;
    color: var(--navy);
    line-height: 1.25;
    margin-bottom: 0.75rem;
}
h1 { font-size: clamp(1.9rem, 4vw, 2.75rem); }
h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); }
h3 { font-size: clamp(1.1rem, 2vw, 1.35rem); }
p  { margin-bottom: 0.75rem; }
p:last-child { margin-bottom: 0; }
a  { text-decoration: none; color: var(--navy); transition: color 0.2s; }
a:hover { color: var(--sky); }

/* ══════════════════════════════════
   FLOATING GLASS PILL NAV
══════════════════════════════════ */
.nav-pill {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 1.5rem;
    border-radius: var(--r-pill);
    margin: 1.25rem 1.75rem 0;
    position: sticky;
    top: 1rem;
    z-index: 200;
    gap: 1.5rem;
}
.nav-pill--light {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    box-shadow: var(--shadow-nav);
}
.nav-pill--dark {
    background: rgba(255,255,255,0.11);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}

/* Logo */
.nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 0.95rem;
    font-weight: 700;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.nav-pill--light .nav-logo { color: var(--navy); }
.nav-pill--dark  .nav-logo { color: var(--sky); }
.nav-logo-img { height: 28px; border-radius: 4px; }

/* Nav links list */
.nav-links-list {
    list-style: none;
    display: flex;
    gap: 0.25rem;
    flex: 1;
    justify-content: center;
}
.nav-link {
    font-size: 0.88rem;
    font-weight: 500;
    padding: 0.38rem 0.85rem;
    border-radius: var(--r-pill);
    transition: background 0.2s, color 0.2s;
}
.nav-pill--light .nav-link         { color: var(--text-mid); }
.nav-pill--light .nav-link:hover,
.nav-pill--light .nav-link.active  { color: var(--navy); background: rgba(91,170,204,0.12); }
.nav-pill--dark  .nav-link         { color: rgba(255,255,255,0.6); }
.nav-pill--dark  .nav-link:hover,
.nav-pill--dark  .nav-link.active  { color: #fff; background: rgba(255,255,255,0.12); }

/* Auth-links container inside nav */
.nav-pill .auth-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
}

/* Badge chips (PRO / FINANCE) */
.nav-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.18rem 0.55rem;
    border-radius: 8px;
}
.nav-badge--pro     { background: var(--navy); color: var(--sky); }
.nav-badge--finance { background: rgba(91,170,204,0.2); color: var(--sky); border: 1px solid rgba(91,170,204,0.3); }

/* ══════════════════════════════════
   BUTTONS
══════════════════════════════════ */
.btn {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    border-radius: var(--r-lg);
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.88rem;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    letter-spacing: 0.01em;
}
.btn:hover   { transform: translateY(-1px); box-shadow: var(--shadow-raised); }
.btn:active  { transform: translateY(0); }

.btn-primary { background: var(--sky); color: var(--navy); }
.btn-primary:hover { background: #76C2DF; color: var(--navy); }

.btn-secondary {
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.55);
    color: var(--text-light);
}
.btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: var(--text-light); }

/* Secondary btn on light pages */
main .btn-secondary,
.modal-content .btn-secondary {
    border-color: var(--navy);
    color: var(--navy);
}
main .btn-secondary:hover,
.modal-content .btn-secondary:hover { background: rgba(13,43,78,0.07); }

/* Buttons inside nav pill — override to match nav context */
.nav-pill--light .auth-buttons .btn-secondary {
    border: 1.5px solid var(--navy);
    color: var(--navy);
    background: transparent;
    font-size: 0.8rem;
    padding: 0.38rem 0.9rem;
}
.nav-pill--light .auth-buttons .btn-primary {
    background: var(--navy);
    color: var(--sky);
    font-size: 0.8rem;
    padding: 0.38rem 0.9rem;
    border-radius: var(--r-pill);
}
.nav-pill--dark .auth-buttons .btn-secondary {
    border: 1.5px solid rgba(255,255,255,0.4);
    color: rgba(255,255,255,0.8);
    background: transparent;
    font-size: 0.8rem;
    padding: 0.38rem 0.9rem;
}
.nav-pill--dark .auth-buttons .btn-primary {
    background: var(--sky);
    color: var(--navy);
    font-size: 0.8rem;
    padding: 0.38rem 0.9rem;
    border-radius: var(--r-pill);
}

.btn-danger { background: var(--danger); color: #fff; }
.btn-navy   { background: var(--navy); color: var(--sky); }

/* ══════════════════════════════════
   GLASS CARDS
══════════════════════════════════ */
.glass-card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.92);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-card);
}
.glass-card--dark {
    background: rgba(255,255,255,0.10);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: var(--shadow-raised);
}

/* Legacy .card kept — JS-injected event cards use class="card" */
.card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.92);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-card);
    padding: 1.5rem;
    transition: box-shadow 0.25s, transform 0.25s;
}
.card:hover { box-shadow: var(--shadow-raised); transform: translateY(-2px); }
.card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
    margin-bottom: 0.85rem;
}

/* ── Ambient blobs ── */
.blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    pointer-events: none;
}

/* ══════════════════════════════════
   PAGE HEROES (dark navy sections)
══════════════════════════════════ */
.page-hero {
    background: linear-gradient(160deg, #0D2B4E 0%, #112f57 60%, #0a2540 100%);
    position: relative;
    overflow: hidden;
    padding-bottom: 3rem;
}
.page-hero .blob-1 {
    top: -40px; right: -40px;
    width: 220px; height: 220px;
    background: rgba(91,170,204,0.13);
}
.page-hero .blob-2 {
    bottom: -60px; left: -30px;
    width: 260px; height: 260px;
    background: rgba(91,170,204,0.07);
}

/* ── Hero glass card (homepage / login / signup centred card) ── */
.hero-card-wrap {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    padding: 2.5rem 2rem 0.5rem;
}
.hero-card {
    text-align: center;
    padding: 2.25rem 2.75rem;
    max-width: 520px;
    width: 100%;
}
.hero-pill-badge {
    display: inline-block;
    background: rgba(91,170,204,0.18);
    color: var(--sky);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.3rem 0.9rem;
    border-radius: 20px;
    margin-bottom: 1rem;
    border: 1px solid rgba(91,170,204,0.3);
}
.hero-card h1 {
    color: var(--pearl);
    font-size: clamp(2rem, 5vw, 3rem);
    margin-bottom: 0.85rem;
}
.hero-card p {
    color: rgba(255,255,255,0.58);
    font-size: 0.95rem;
    line-height: 1.7;
    max-width: 380px;
    margin: 0 auto 1.5rem;
}

/* ══════════════════════════════════
   BELOW-FOLD (warm cream sections)
══════════════════════════════════ */
.page-below {
    background: linear-gradient(160deg, var(--cream) 0%, var(--cream-deep) 100%);
    position: relative;
    overflow: hidden;
    padding: 2.5rem 2rem;
}
.page-below .blob-3 {
    top: -40px; right: -20px;
    width: 200px; height: 200px;
    background: rgba(91,170,204,0.11);
}
.page-below .blob-4 {
    bottom: -50px; left: -30px;
    width: 220px; height: 220px;
    background: rgba(13,43,78,0.05);
}

/* ══════════════════════════════════
   MAIN LAYOUT
══════════════════════════════════ */
main {
    max-width: 1240px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
    width: 100%;
}

.page-heading { margin-bottom: 1.5rem; }
.page-heading h1 { margin-bottom: 0.25rem; }
.page-heading p  { color: var(--text-mid); font-size: 0.9rem; }

/* Section label with ruled line */
.section-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
}
.section-label h2 { margin-bottom: 0; }
.section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(13,43,78,0.12);
}

/* ══════════════════════════════════
   BENTO GRID (homepage)
══════════════════════════════════ */
.bento-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 300px;
    gap: 1.25rem;
}
.bento-story   { grid-column: 1; grid-row: 1; }
.bento-events  { grid-column: 2; grid-row: 1; }
.bento-sidebar { grid-column: 3; grid-row: 1; }

.story-img {
    width: 100%; height: 220px;
    object-fit: cover;
    border-radius: var(--r-md);
    margin-bottom: 1rem;
    display: block;
}

/* Event cards */
.event-card {
    padding: 1rem 1.25rem;
    border-radius: var(--r-md);
    margin-bottom: 0.75rem;
    border-top: 2.5px solid var(--sky);
}
.event-date-label {
    color: var(--sky);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.3rem;
}

/* Sidebar game widget */
.game-widget {
    background: rgba(255,255,255,0.45);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: var(--r-md);
    padding: 1rem;
    margin-bottom: 0.75rem;
}

/* ══════════════════════════════════
   NEWS PAGE
══════════════════════════════════ */
/* Pill tab switcher */
.pill-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}
/* Keep .news-tab class since JS uses querySelectorAll('.news-tab') */
.news-tab {
    padding: 0.4rem 1.1rem;
    border-radius: var(--r-pill);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: 'Inter', sans-serif;
    transition: background 0.2s, color 0.2s;
}
.news-tab.active      { background: var(--navy); color: var(--sky); }
.news-tab:not(.active){ background: rgba(255,255,255,0.55); color: var(--text-mid); border: 1px solid rgba(255,255,255,0.9); }

/* News items — JS injects class="news-item" into #news-container */
.news-list { display: flex; flex-direction: column; gap: 1rem; }

/* JS-injected: class="news-item" */
.news-item {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.92);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-card);
    padding: 1rem 1.25rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    transition: box-shadow 0.2s, transform 0.2s;
}
.news-item:hover { box-shadow: var(--shadow-raised); transform: translateY(-2px); }
.news-item img {
    width: 120px; height: 100px;
    object-fit: cover;
    border-radius: var(--r-md);
    flex-shrink: 0;
}
.news-content { flex: 1; }
.news-date { font-size: 0.78rem; color: var(--text-mid); margin-bottom: 0.4rem; }

/* Document download button — injected by news.html JS */
.btn-secondary { border-color: var(--navy); color: var(--navy); }

/* ══════════════════════════════════
   GALLERY
══════════════════════════════════ */
/* Keep .gallery-grid since JS references container with this class */
.gallery-grid {
    columns: 3;
    column-gap: 1rem;
}
/* Keep .gallery-item since JS adds event listeners via this class */
.gallery-item {
    break-inside: avoid;
    margin-bottom: 1rem;
    border-radius: var(--r-md);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    border: 1px solid rgba(255,255,255,0.9);
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.2s;
}
.gallery-item:hover { box-shadow: var(--shadow-raised); transform: translateY(-3px); }
.gallery-item img {
    width: 100%;
    display: block;
    max-height: 280px;
    object-fit: cover;
}
.gallery-item .gal-caption {
    background: rgba(255,255,255,0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 0.4rem 0.65rem;
    font-size: 0.78rem;
    color: var(--text-dark);
    font-weight: 500;
}

/* Lightbox — keep all IDs intact */
#lightbox {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(13,43,78,0.88);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 9999;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
}
#lightbox.open { display: flex; }
#lightbox-img {
    max-width: 90vw;
    max-height: 85vh;
    border-radius: var(--r-md);
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    object-fit: contain;
}
#lightbox-caption {
    position: fixed;
    bottom: 2rem; left: 50%;
    transform: translateX(-50%);
    color: rgba(255,255,255,0.9);
    font-size: 0.9rem;
    background: rgba(0,0,0,0.45);
    padding: 0.4rem 1.2rem;
    border-radius: var(--r-pill);
    white-space: nowrap;
}
#lightbox-close {
    position: fixed;
    top: 1.25rem; right: 1.5rem;
    background: rgba(255,255,255,0.15);
    border: none;
    color: white;
    font-size: 1.6rem;
    line-height: 1;
    width: 2.5rem; height: 2.5rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
}
#lightbox-close:hover { background: rgba(255,255,255,0.3); }

/* ══════════════════════════════════
   FORMS (login, signup)
══════════════════════════════════ */
.form-container {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.92);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-card);
    padding: 2.5rem;
    max-width: 420px;
    margin: 2.5rem auto;
}

/* Dark glass form (login / signup page) */
.form-container--dark {
    background: rgba(255,255,255,0.10);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.18);
    box-shadow: var(--shadow-raised);
    padding: 2.25rem 2rem;
    max-width: 360px;
    width: 100%;
    border-radius: var(--r-lg);
}
.form-container--dark h2 { color: var(--pearl); }
.form-container--dark label { color: rgba(255,255,255,0.65) !important; }

.form-group { margin-bottom: 1.25rem; }
.form-group label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 500;
    font-size: 0.88rem;
    color: var(--text-dark);
}
.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.7rem 1rem;
    border: 1.5px solid var(--border-color);
    border-radius: var(--r-sm);
    font-family: 'Inter', sans-serif;
    font-size: 0.92rem;
    background: rgba(255,255,255,0.7);
    color: var(--text-dark);
    transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--sky);
    box-shadow: 0 0 0 3px rgba(91,170,204,0.18);
}
/* Dark form inputs */
.form-container--dark .form-group input,
.form-container--dark .form-group select {
    background: rgba(255,255,255,0.10);
    border-color: rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.85);
}
.form-container--dark .form-group input::placeholder { color: rgba(255,255,255,0.35); }
.form-container--dark .form-group input:focus {
    border-color: var(--sky);
    box-shadow: 0 0 0 3px rgba(91,170,204,0.2);
}

/* ══════════════════════════════════
   DASHBOARD — stat cards & months
══════════════════════════════════ */
.dashboard-grid,
.admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
    margin-top: 1.5rem;
}

.stat-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}

/* Keep .badge, .badge-paid, .badge-unpaid — dashboard.js injects these */
.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: var(--r-pill);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.03em;
}
.badge-paid   { background: rgba(46,139,87,0.15); color: var(--green); border: 1px solid rgba(46,139,87,0.3); }
.badge-unpaid { background: rgba(91,170,204,0.15); color: var(--navy); border: 1px solid rgba(91,170,204,0.3); }

/* Keep .user-month-grid, .month-box, .month-box.paid, .month-box.unpaid — dashboard.js writes these */
.user-month-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-top: 0.85rem;
}
.month-box {
    text-align: center;
    padding: 0.5rem 0.25rem;
    border-radius: var(--r-sm);
    font-size: 0.78rem;
    font-weight: 700;
    border: 1.5px solid var(--border-color);
}
.month-box.paid {
    background: var(--green);
    color: white;
    border-color: var(--green);
}
.month-box.unpaid {
    background: rgba(13,43,78,0.05);
    color: var(--text-mid);
}

/* ══════════════════════════════════
   ADMIN TABLE
══════════════════════════════════ */
table {
    width: 100%;
    border-collapse: collapse;
    background: rgba(255,255,255,0.62);
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: var(--shadow-card);
}
th, td {
    padding: 0.85rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.88rem;
}
th {
    background: var(--navy);
    color: var(--sky);
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
tr:last-child td { border-bottom: none; }
tbody tr:hover    { background: rgba(91,170,204,0.06); }

/* Keep .status-badge + variants — admin-dashboard.js injects these */
.status-badge {
    display: inline-block;
    padding: 0.22rem 0.65rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
}
.status-paid    { background: rgba(46,139,87,0.14); color: var(--green); }
.status-pending { background: rgba(91,170,204,0.15); color: var(--navy); }
.status-overdue { background: rgba(217,83,79,0.12); color: var(--danger); }

/* Filter controls */
.filter-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
}
.status-select {
    padding: 0.45rem 0.75rem;
    border-radius: var(--r-sm);
    border: 1.5px solid var(--border-color);
    background: rgba(255,255,255,0.7);
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
    color: var(--text-dark);
}

/* ══════════════════════════════════
   PAYMENT MODAL
══════════════════════════════════ */
/* Keep .modal-overlay — JS sets display:flex / none directly */
.modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(13,43,78,0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 10000;
    justify-content: center;
    align-items: center;
}
.modal-content {
    background: var(--pearl);
    border-radius: var(--r-lg);
    padding: 2rem;
    width: 90%;
    max-width: 520px;
    max-height: 88vh;
    overflow-y: auto;
    box-shadow: var(--shadow-modal);
    position: relative;
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.85rem;
}
.modal-close {
    background: none; border: none;
    font-size: 1.6rem; cursor: pointer;
    color: var(--text-mid); line-height: 1;
    padding: 4px 8px; border-radius: var(--r-sm);
    transition: background 0.2s, color 0.2s;
}
.modal-close:hover { color: var(--danger); background: rgba(217,83,79,0.08); }

/* Preset buttons */
.preset-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
}
.preset-buttons .btn {
    font-size: 0.82rem;
    padding: 0.35rem 0.85rem;
    border-radius: var(--r-pill);
}

/* Month checkboxes grid */
.months-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.55rem;
    margin-bottom: 1.25rem;
}
.month-checkbox-group {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 9px;
    border: 1.5px solid var(--border-color);
    border-radius: var(--r-sm);
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s, border-color 0.2s;
}
.month-checkbox-group:hover {
    background: rgba(91,170,204,0.12);
    border-color: var(--sky);
}
.month-checkbox-group input[type="checkbox"] { accent-color: var(--navy); cursor: pointer; }

/* ══════════════════════════════════
   FOOTER
══════════════════════════════════ */
footer {
    background: var(--navy);
    color: rgba(255,255,255,0.6);
    text-align: center;
    padding: 1.5rem 2rem;
    font-size: 0.85rem;
}
footer a { color: var(--sky); }

/* ══════════════════════════════════
   RESPONSIVE
══════════════════════════════════ */
@media (max-width: 960px) {
    .bento-grid {
        grid-template-columns: 1fr;
    }
    .bento-story, .bento-events, .bento-sidebar {
        grid-column: 1;
        grid-row: auto;
    }
    .stat-card-grid { grid-template-columns: 1fr 1fr; }
    .gallery-grid   { columns: 2; }
}

@media (max-width: 768px) {
    .nav-pill {
        flex-direction: column;
        border-radius: var(--r-lg);
        margin: 0.75rem 1rem 0;
        top: 0.75rem;
        gap: 0.75rem;
        padding: 0.85rem 1.25rem;
    }
    .nav-links-list  { flex-wrap: wrap; justify-content: center; }
    .nav-pill .auth-buttons { flex-direction: column; width: 100%; }
    .nav-pill .auth-buttons .btn { width: 100%; padding: 0.65rem; font-size: 0.92rem; }
    .page-below { padding: 1.5rem 1rem; }
    .hero-card  { padding: 1.5rem 1.25rem; }
    main { padding: 1.5rem 1rem; }
    .stat-card-grid { grid-template-columns: 1fr; }
    .gallery-grid { columns: 1; }
    .form-container, .form-container--dark { padding: 1.75rem 1.25rem; }
    .dashboard-grid, .admin-grid { grid-template-columns: 1fr; }

    button, .btn, input, select, a {
        position: relative !important;
        z-index: 9999 !important;
        cursor: pointer !important;
    }
}
```

- [ ] **Step 2: Verify by opening any page in browser**

Open `frontend/index.html` directly in browser. The page may look incomplete (old `<header>` still exists), but check that:
- Google Fonts load (Playfair Display / Inter)
- No CSS parse errors in browser DevTools console
- CSS variables resolve correctly

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/arnol/OneDrive/Desktop/motherhtml/fggc-alumnii"
git init  # only if no git repo exists
git add frontend/css/styles.css
git commit -m "style: replace global stylesheet with Warm Glass design system"
```

---

## Task 2: Redesign `frontend/index.html`

**Files:**
- Modify: `frontend/index.html`

**JS hooks to preserve:** `#auth-links`, `#story-container`, `#events-container`

- [ ] **Step 1: Replace the entire file with this content**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FGGC Gboko FCT Chapter Alumni | Home</title>
    <meta name="description" content="Welcome to the Federal Government Girls College Alumni Association Official Website for the FCT Chapter.">
    <meta property="og:title" content="FGGC Gboko FCT Chapter Alumni | Home">
    <meta property="og:description" content="Welcome to the Federal Government Girls College Alumni Association Official Website for the FCT Chapter.">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<!-- ── Dark hero section ── -->
<div class="page-hero">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <!-- Floating glass pill nav (dark variant) -->
    <nav class="nav-pill nav-pill--dark">
        <a href="index.html" class="nav-logo">
            <img src="images/logo.png" alt="FGGC Logo" class="nav-logo-img">
            FGGC Alumni
        </a>
        <ul class="nav-links-list">
            <li><a href="index.html" class="nav-link active">Home</a></li>
            <li><a href="about.html" class="nav-link">About</a></li>
            <li><a href="news.html" class="nav-link">News</a></li>
            <li><a href="gallery.html" class="nav-link">Gallery</a></li>
        </ul>
        <div class="auth-buttons" id="auth-links"></div>
    </nav>

    <!-- Centred frosted hero card -->
    <div class="hero-card-wrap">
        <div class="glass-card--dark hero-card">
            <div class="hero-pill-badge">FGGC Gboko &middot; FCT Chapter</div>
            <h1>Welcome Home,<br>Alumni!</h1>
            <p>Connect with old friends, stay updated on events, play our weekly games, and support the next generation of leaders.</p>
            <a href="signup.html" class="btn btn-primary">Join the Community &rarr;</a>
        </div>
    </div>
</div>

<!-- ── Below fold: warm cream ── -->
<div class="page-below">
    <div class="blob blob-3"></div>
    <div class="blob blob-4"></div>

    <div class="bento-grid">

        <!-- Focus Story -->
        <section class="bento-story" id="latest-story">
            <div class="section-label"><h2>Focus Story</h2></div>
            <div class="glass-card" style="padding:1.5rem;" id="story-container">
                <p style="color:var(--text-muted);">Loading the latest story&hellip;</p>
            </div>
        </section>

        <!-- Upcoming Events -->
        <section class="bento-events" id="upcoming-events">
            <div class="section-label"><h2>Upcoming Events</h2></div>
            <div id="events-container">
                <p style="color:var(--text-muted);">Loading events&hellip;</p>
            </div>
        </section>

        <!-- Sidebar: Weekly Challenges -->
        <aside class="bento-sidebar">
            <div class="section-label"><h2 style="font-size:1.1rem;">Weekly Challenges</h2></div>
            <div class="game-widget">
                <h3 style="margin-bottom:0.85rem;">Sudoku</h3>
                <iframe src="https://show.websudoku.com/?level=1" width="100%" height="380" frameborder="0"
                    style="border-radius:var(--r-sm);border:1.5px solid var(--border-color);overflow:hidden;display:block;"></iframe>
            </div>
            <div class="game-widget">
                <h3 style="margin-bottom:0.85rem;">Crossword</h3>
                <div style="border:1.5px solid var(--border-color);border-radius:var(--r-sm);padding:1.5rem;background:rgba(255,255,255,0.45);display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center;">
                    <p style="color:var(--text-muted);font-size:0.85rem;line-height:1.55;">Direct embedding is disabled by the provider. Play the daily crossword in a new tab.</p>
                    <a href="https://www.boatloadpuzzles.com/playcrossword" target="_blank" class="btn btn-navy">Play Daily Crossword &rarr;</a>
                </div>
            </div>
        </aside>
    </div>
</div>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', async () => {
        // Load Latest Story
        const storyContainer = document.getElementById('story-container');
        try {
            const story = await api.get('/news/latest-story');
            if (!story) {
                storyContainer.innerHTML = '<p>No focus story available at the moment. Please check back later.</p>';
            } else {
                storyContainer.innerHTML = `
                    ${story.imageData ? `<img src="${story.imageData}" alt="Story Image" class="story-img">` : ''}
                    <h3 style="margin-bottom:0.5rem;">${story.title}</h3>
                    <div style="color:var(--text-muted);font-size:0.82rem;margin-bottom:1rem;">Published ${new Date(story.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
                    <p style="white-space:pre-line;line-height:1.75;">${story.content}</p>
                `;
            }
        } catch (err) {
            console.error(err);
            storyContainer.innerHTML = '<p>Could not load the latest story.</p>';
        }

        // Load Events
        const eventsContainer = document.getElementById('events-container');
        try {
            const events = await api.get('/events');
            if (events.length === 0) {
                eventsContainer.innerHTML = '<p>No upcoming events at this time.</p>';
            } else {
                eventsContainer.innerHTML = events.map(event => `
                    <div class="glass-card event-card">
                        <div class="event-date-label">${new Date(event.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})} &bull; ${event.location || 'TBA'}</div>
                        <h3 style="font-size:1rem;margin-bottom:0.35rem;">${event.title}</h3>
                        <p style="color:var(--text-mid);font-size:0.85rem;">${event.description}</p>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error(error);
            eventsContainer.innerHTML = '<p>Failed to load events. Please try again later.</p>';
        }
    });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify visually**

Open `frontend/index.html` in browser. Check:
- Dark navy hero with frosted card centred
- Light glass pill nav shows at top of hero, changes on scroll
- Warm cream below-fold with bento grid
- Story and events load from API (if backend running)

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "style: redesign homepage with dark hero + glass bento layout"
```

---

## Task 3: Redesign `frontend/about.html`

**Files:**
- Modify: `frontend/about.html`

**JS hooks to preserve:** `#auth-links`

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us | FGGC Gboko FCT Chapter Alumni</title>
    <meta name="description" content="Learn about the FGGC Gboko FCT Chapter Alumni Association, our mission, history, and alma mater.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<!-- Light glass pill nav -->
<nav class="nav-pill nav-pill--light">
    <a href="index.html" class="nav-logo">
        <img src="images/logo.png" alt="FGGC Logo" class="nav-logo-img">
        FGGC Alumni
    </a>
    <ul class="nav-links-list">
        <li><a href="index.html" class="nav-link">Home</a></li>
        <li><a href="about.html" class="nav-link active">About</a></li>
        <li><a href="news.html" class="nav-link">News</a></li>
        <li><a href="gallery.html" class="nav-link">Gallery</a></li>
    </ul>
    <div class="auth-buttons" id="auth-links"></div>
</nav>

<main>
    <div class="page-heading">
        <h1>About the FCT Chapter</h1>
        <p>The Federal Government Girls&rsquo; College Gboko Alumnae Association — FCT Chapter.</p>
    </div>

    <!-- Mission -->
    <div class="glass-card" style="padding:1.75rem 2rem;margin-bottom:1.25rem;">
        <div style="color:var(--sky);font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">Our Mission &amp; Vision</div>
        <h2 style="font-size:1.4rem;margin-bottom:0.75rem;">Connecting, Celebrating &amp; Giving Back</h2>
        <p>We are a registered chapter of the FGGC Gboko Alumnae Association, dedicated to fostering lifelong bonds among old girls, supporting the institution, and mentoring the next generation of female leaders in Nigeria.</p>
    </div>

    <!-- Vision / Mission split -->
    <div class="dashboard-grid" style="margin-top:0;margin-bottom:1.25rem;">
        <div class="glass-card" style="padding:1.5rem;border-left:3.5px solid var(--sky);">
            <h3>Our Vision</h3>
            <p>To cultivate an empowered and globally impactful network of women, rooted in the excellence nurtured at FGGC Gboko.</p>
        </div>
        <div class="glass-card" style="padding:1.5rem;border-left:3.5px solid var(--green);">
            <h3>Our Mission</h3>
            <p>To foster lifelong connections among alumnae, support continuous development of our school, and provide mentorship for current students across generations.</p>
        </div>
    </div>

    <!-- Stats row -->
    <div class="stat-card-grid" style="margin-bottom:1.25rem;">
        <div class="glass-card" style="padding:1.25rem;text-align:center;">
            <div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:var(--navy);">200+</div>
            <div style="color:var(--text-mid);font-size:0.82rem;font-weight:600;">Active Members</div>
        </div>
        <div class="glass-card" style="padding:1.25rem;text-align:center;">
            <div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:var(--navy);">1985</div>
            <div style="color:var(--text-mid);font-size:0.82rem;font-weight:600;">School Founded</div>
        </div>
        <div class="glass-card" style="padding:1.25rem;text-align:center;background:var(--navy);">
            <div style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700;color:var(--sky);">FCT</div>
            <div style="color:rgba(255,255,255,0.55);font-size:0.82rem;font-weight:600;">Chapter Location</div>
        </div>
    </div>

    <!-- About the school -->
    <div class="glass-card" style="padding:1.75rem 2rem;">
        <h2 style="font-size:1.25rem;margin-bottom:0.85rem;">About FGGC Gboko</h2>
        <p>Federal Government Girls&rsquo; College, Gboko, is one of the premier unity schools in Nigeria, established by the Federal Government to foster national integration among young women from diverse cultural backgrounds. Known for its rigorous academic curriculum and robust extracurricular programs, the institution has continuously produced resilient and trailblazing women breaking barriers across various professional fields globally.</p>
    </div>
</main>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify visually**

Open `frontend/about.html`. Check glass cards, stats row, light nav with "About" active.

- [ ] **Step 3: Commit**

```bash
git add frontend/about.html
git commit -m "style: redesign about page with glass card sections"
```

---

## Task 4: Redesign `frontend/news.html`

**Files:**
- Modify: `frontend/news.html`

**JS hooks to preserve:** `#auth-links`, `.news-tab[data-type]`, `#news-container`

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>News &amp; Archives | FGGC Gboko FCT Chapter</title>
    <meta name="description" content="Stay updated with the latest news, stories, and meeting minutes from the FGGC Gboko FCT Chapter Alumni Association.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<nav class="nav-pill nav-pill--light">
    <a href="index.html" class="nav-logo">
        <img src="images/logo.png" alt="FGGC Logo" class="nav-logo-img">
        FGGC Alumni
    </a>
    <ul class="nav-links-list">
        <li><a href="index.html" class="nav-link">Home</a></li>
        <li><a href="about.html" class="nav-link">About</a></li>
        <li><a href="news.html" class="nav-link active">News</a></li>
        <li><a href="gallery.html" class="nav-link">Gallery</a></li>
    </ul>
    <div class="auth-buttons" id="auth-links"></div>
</nav>

<main>
    <div class="page-heading">
        <h1>News &amp; Archives</h1>
        <p>Stay informed with the latest updates and meeting records.</p>
    </div>

    <!-- Pill tabs — .news-tab and data-type preserved for JS -->
    <div class="pill-tabs">
        <button class="news-tab active" data-type="news">Latest News</button>
        <button class="news-tab" data-type="minutes">Meeting Minutes</button>
    </div>

    <!-- #news-container preserved — JS injects .news-item divs here -->
    <div class="news-list" id="news-container">
        <p>Loading&hellip;</p>
    </div>
</main>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const tabs = document.querySelectorAll('.news-tab');
        const container = document.getElementById('news-container');

        const fetchNews = async (type) => {
            container.innerHTML = '<p>Loading&hellip;</p>';
            try {
                const res = await api.get(`/news?type=${type}`);
                if (res.length === 0) {
                    container.innerHTML = '<p>No items found.</p>';
                    return;
                }
                container.innerHTML = res.map(item => `
                    <div class="news-item">
                        ${item.imageData ? `<img src="${item.imageData}" alt="News Image">` : ''}
                        <div class="news-content">
                            <h3>${item.title}</h3>
                            <div class="news-date">${new Date(item.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
                            <p>${item.content.replace(/\n/g,'<br>')}</p>
                            ${item.documentData ? `
                            <a href="${item.documentData}"
                               download="${item.documentName || 'document'}"
                               class="btn btn-secondary"
                               style="display:inline-flex;align-items:center;gap:0.4rem;margin-top:0.75rem;font-size:0.82rem;">
                                &#128196; Download ${item.documentName || 'Document'}
                            </a>` : ''}
                        </div>
                    </div>
                `).join('');
            } catch(e) {
                console.error(e);
                container.innerHTML = '<p>Failed to load data. Please try again later.</p>';
            }
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                fetchNews(e.target.dataset.type);
            });
        });

        fetchNews('news');
    });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify visually**

Open `frontend/news.html`. Check pill tabs, glass news items load, doc download button appears on items with documents.

- [ ] **Step 3: Commit**

```bash
git add frontend/news.html
git commit -m "style: redesign news page with pill tabs and glass news items"
```

---

## Task 5: Redesign `frontend/gallery.html`

**Files:**
- Modify: `frontend/gallery.html`

**JS hooks to preserve:** `#auth-links`, `#gallery-container`, `.gallery-item[data-index]`, `#lightbox`, `#lightbox.open`, `#lightbox-img`, `#lightbox-caption`, `#lightbox-close`

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery | FGGC Gboko FCT Chapter Alumni</title>
    <meta name="description" content="A collection of the proudest moments and events from the FGGC Gboko FCT Chapter Alumni Association.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<nav class="nav-pill nav-pill--light">
    <a href="index.html" class="nav-logo">
        <img src="images/logo.png" alt="FGGC Logo" class="nav-logo-img">
        FGGC Alumni
    </a>
    <ul class="nav-links-list">
        <li><a href="index.html" class="nav-link">Home</a></li>
        <li><a href="about.html" class="nav-link">About</a></li>
        <li><a href="news.html" class="nav-link">News</a></li>
        <li><a href="gallery.html" class="nav-link active">Gallery</a></li>
    </ul>
    <div class="auth-buttons" id="auth-links"></div>
</nav>

<main>
    <div class="page-heading">
        <h1>Memories &amp; Events</h1>
        <p>A collection of our proudest moments. Click any image to view full size.</p>
    </div>

    <!-- #gallery-container preserved — JS injects .gallery-item divs here -->
    <div id="gallery-container" class="gallery-grid">
        <p>Loading gallery&hellip;</p>
    </div>
</main>

<!-- Lightbox — all IDs preserved exactly -->
<div id="lightbox">
    <button id="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="">
    <div id="lightbox-caption"></div>
</div>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script>
    const lightbox        = document.getElementById('lightbox');
    const lightboxImg     = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    function openLightbox(src, caption) {
        lightboxImg.src = src;
        lightboxCaption.textContent = caption;
        lightboxCaption.style.display = caption ? 'block' : 'none';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lightboxImg.src = '';
        document.body.style.overflow = '';
    }

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

    document.addEventListener('DOMContentLoaded', async () => {
        const container = document.getElementById('gallery-container');
        try {
            const images = await api.get('/gallery');
            if (images.length === 0) {
                container.innerHTML = '<p>No images available in the gallery yet.</p>';
                return;
            }
            container.innerHTML = images.map((img, i) => `
                <div class="gallery-item" data-index="${i}">
                    ${img.dataUrl
                        ? `<img src="${img.dataUrl}" alt="${img.caption || 'Alumni Event'}">`
                        : `<div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.85rem;">Image unavailable</div>`
                    }
                    ${img.caption ? `<div class="gal-caption">${img.caption}</div>` : ''}
                </div>
            `).join('');

            container.querySelectorAll('.gallery-item[data-index]').forEach((el, i) => {
                if (!images[i].dataUrl) return;
                el.addEventListener('click', () => openLightbox(images[i].dataUrl, images[i].caption || ''));
            });
        } catch (error) {
            container.innerHTML = '<p>Failed to load gallery images.</p>';
        }
    });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify visually**

Open `frontend/gallery.html`. Check masonry grid, glass items load, lightbox opens and closes on click + Escape.

- [ ] **Step 3: Commit**

```bash
git add frontend/gallery.html
git commit -m "style: redesign gallery with masonry glass grid, keep lightbox"
```

---

## Task 6: Redesign `frontend/login.html`

**Files:**
- Modify: `frontend/login.html`

**JS hooks to preserve (auth.js):** `#login-form`, `#email`, `#password`, `#error-message`, `#auth-links`

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | FGGC Gboko FCT Chapter Alumni</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<!-- Full dark hero background -->
<div class="page-hero" style="min-height:100vh;display:flex;flex-direction:column;">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <!-- Dark nav — minimal (just logo + sign up) -->
    <nav class="nav-pill nav-pill--dark">
        <a href="index.html" class="nav-logo">FGGC Alumni</a>
        <div class="auth-buttons" id="auth-links"></div>
    </nav>

    <!-- Centred form card -->
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;z-index:2;">
        <div class="glass-card--dark form-container--dark">
            <h2 style="margin-bottom:0.3rem;">Welcome Back</h2>
            <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:1.5rem;">Sign in to your alumni account</p>

            <p id="error-message" style="color:#ff8a80;text-align:center;margin-bottom:0.85rem;font-size:0.88rem;min-height:1.2em;"></p>

            <form id="login-form">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" placeholder="you@example.com" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem;">Login &rarr;</button>
            </form>

            <p style="text-align:center;margin-top:1.25rem;font-size:0.85rem;color:rgba(255,255,255,0.45);">
                Don&rsquo;t have an account? <a href="signup.html" style="color:var(--sky);">Sign up here</a>
            </p>
        </div>
    </div>
</div>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify visually and functionally**

Open `frontend/login.html`. Check:
- Full dark navy background
- Dark glass card centred
- Form submits and redirects correctly (test with valid credentials)
- Error message appears for wrong credentials

- [ ] **Step 3: Commit**

```bash
git add frontend/login.html
git commit -m "style: redesign login page with dark glass immersive layout"
```

---

## Task 7: Redesign `frontend/signup.html`

**Files:**
- Modify: `frontend/signup.html`

**JS hooks to preserve (auth.js):** `#signup-form`, `#first_name`, `#last_name`, `#email`, `#password`, `#graduation_year`, `#error-message`, `#auth-links`

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up | FGGC Gboko FCT Chapter Alumni</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<!-- Full dark hero background -->
<div class="page-hero" style="min-height:100vh;display:flex;flex-direction:column;">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <nav class="nav-pill nav-pill--dark">
        <a href="index.html" class="nav-logo">FGGC Alumni</a>
        <div class="auth-buttons" id="auth-links"></div>
    </nav>

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;z-index:2;">
        <div class="glass-card--dark form-container--dark" style="max-width:440px;">
            <h2 style="margin-bottom:0.3rem;">Join the Community</h2>
            <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:1.5rem;">Create your alumni account</p>

            <p id="error-message" style="color:#ff8a80;text-align:center;margin-bottom:0.85rem;font-size:0.88rem;min-height:1.2em;"></p>

            <form id="signup-form">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                    <div class="form-group">
                        <label for="first_name">First Name</label>
                        <input type="text" id="first_name" required>
                    </div>
                    <div class="form-group">
                        <label for="last_name">Last Name</label>
                        <input type="text" id="last_name" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="graduation_year">Graduation Year</label>
                    <input type="number" id="graduation_year" required min="1970" max="2030" placeholder="e.g. 2010">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem;">Create Account &rarr;</button>
            </form>

            <p style="text-align:center;margin-top:1.25rem;font-size:0.85rem;color:rgba(255,255,255,0.45);">
                Already have an account? <a href="login.html" style="color:var(--sky);">Login here</a>
            </p>
        </div>
    </div>
</div>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify visually and functionally**

Open `frontend/signup.html`. Check dark glass form, two-column name row, form submits without errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/signup.html
git commit -m "style: redesign signup page with dark glass layout matching login"
```

---

## Task 8: Redesign `frontend/dashboard.html`

**Files:**
- Modify: `frontend/dashboard.html`

**JS hooks to preserve (dashboard.js):** `#auth-links`, `#profile-name`, `#profile-email`, `#monthly-status`, `#payment-status`, `#current-year`, `#monthly-grid`, `.month-box`, `.month-box.paid`, `.month-box.unpaid`

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Dashboard | FGGC Gboko FCT Chapter Alumni</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<nav class="nav-pill nav-pill--light">
    <a href="index.html" class="nav-logo">
        <img src="images/logo.png" alt="FGGC Logo" class="nav-logo-img">
        FGGC Alumni
    </a>
    <ul class="nav-links-list">
        <li><a href="index.html" class="nav-link">Home</a></li>
        <li><a href="dashboard.html" class="nav-link active">Dashboard</a></li>
    </ul>
    <div class="auth-buttons" id="auth-links"></div>
</nav>

<main>
    <div class="page-heading">
        <h1>My Dashboard</h1>
        <p>Your membership overview for <span id="current-year">2026</span>.</p>
    </div>

    <!-- Stat cards row -->
    <div class="stat-card-grid">
        <!-- Profile card -->
        <div class="glass-card" style="padding:1.5rem;">
            <div style="color:var(--sky);font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">Profile</div>
            <div style="margin-bottom:0.4rem;">
                <strong style="font-size:0.85rem;color:var(--text-mid);">Name</strong>
                <div id="profile-name" style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--navy);font-weight:700;">Loading&hellip;</div>
            </div>
            <div>
                <strong style="font-size:0.85rem;color:var(--text-mid);">Email</strong>
                <div id="profile-email" style="font-size:0.88rem;color:var(--text-body);">Loading&hellip;</div>
            </div>
        </div>

        <!-- Payment status card -->
        <div class="glass-card" style="padding:1.5rem;">
            <div style="color:var(--sky);font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">Payment Status</div>
            <div style="margin-bottom:0.6rem;">
                <strong style="font-size:0.85rem;color:var(--text-mid);">Monthly Status</strong>
                <div id="monthly-status" style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--navy);font-weight:700;">Loading&hellip;</div>
            </div>
            <div>
                <strong style="font-size:0.85rem;color:var(--text-mid);">Dues Badge</strong>
                <div id="payment-status" style="margin-top:0.3rem;">Loading&hellip;</div>
            </div>
        </div>

        <!-- Quick actions card -->
        <div class="glass-card" style="padding:1.5rem;background:var(--navy);">
            <div style="color:rgba(255,255,255,0.5);font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;">Quick Actions</div>
            <button class="btn btn-primary" style="width:100%;margin-bottom:0.65rem;"
                onclick="alert('Payment gateway integration coming soon!')">Pay Dues Now</button>
            <a href="news.html" class="btn" style="width:100%;display:block;text-align:center;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.2);">View News &rarr;</a>
        </div>
    </div>

    <!-- Monthly breakdown -->
    <div class="glass-card" style="padding:1.5rem;margin-top:1.25rem;">
        <div class="section-label" style="margin-bottom:1rem;">
            <h2 style="font-size:1.1rem;">Monthly Dues Breakdown</h2>
        </div>
        <!-- #monthly-grid preserved — dashboard.js injects .month-box divs here -->
        <div id="monthly-grid" class="user-month-grid">
            <div class="month-box">Loading&hellip;</div>
        </div>
    </div>
</main>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script src="js/dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify visually and functionally**

Open `frontend/dashboard.html` (while logged in). Check:
- Glass stat cards render
- Profile name and email appear
- Payment status badge appears
- Month grid shows paid (green) / unpaid chips

- [ ] **Step 3: Commit**

```bash
git add frontend/dashboard.html
git commit -m "style: redesign user dashboard with glass stat cards and month grid"
```

---

## Task 9: Redesign `frontend/admin-dashboard.html`

**Files:**
- Modify: `frontend/admin-dashboard.html`

**JS hooks to preserve:** All IDs in the Critical Hooks table above for admin-dashboard.html.

- [ ] **Step 1: Replace the entire file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | FGGC Gboko FCT Chapter Alumni</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

<!-- Light nav with PRO badge -->
<nav class="nav-pill nav-pill--light">
    <div style="display:flex;align-items:center;gap:0.5rem;">
        <a href="index.html" class="nav-logo">
            <img src="images/logo.png" alt="FGGC Logo" class="nav-logo-img">
            FGGC Alumni
        </a>
        <span class="nav-badge nav-badge--pro" id="nav-admin-title">ADMIN</span>
    </div>
    <ul class="nav-links-list">
        <li><a href="dashboard.html" class="nav-link">My Dashboard</a></li>
        <li><a href="admin-dashboard.html" class="nav-link active">Admin</a></li>
    </ul>
    <div class="auth-buttons" id="auth-links"></div>
</nav>

<main>
    <!-- Tab switcher -->
    <div style="display:flex;gap:0.65rem;margin-bottom:2rem;border-bottom:1px solid var(--border-color);padding-bottom:1rem;">
        <button class="btn btn-primary" id="tab-users-btn">User Management</button>
        <button class="btn btn-secondary" id="tab-pro-btn">PRO Admin Tools</button>
    </div>

    <!-- ═══ TAB: USER MANAGEMENT ═══ -->
    <section id="tab-users">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem;">
            <div>
                <h1 style="font-size:1.6rem;margin-bottom:0.2rem;">User Management</h1>
                <p style="color:var(--text-mid);">Manage registered members and their monthly payment status.</p>
            </div>
        </div>

        <div class="filter-container">
            <label for="status-filter" style="font-weight:600;font-size:0.88rem;">Filter by Status:</label>
            <select id="status-filter" class="status-select">
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
            </select>
            <button id="send-all-reminders-btn" class="btn"
                style="background:var(--danger);color:white;margin-left:auto;">
                Send Reminder to All Unpaid
            </button>
        </div>

        <div style="overflow-x:auto;border-radius:var(--r-lg);">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Member ID</th>
                        <th>Payment Status</th>
                        <th>Months Paid</th>
                        <th>Last Payment</th>
                        <th>Actions</th>
                        <th>Reminder</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                    <tr><td colspan="8">Loading users&hellip;</td></tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- ═══ TAB: PRO ADMIN TOOLS ═══ -->
    <section id="tab-pro" style="display:none;">
        <h1 style="font-size:1.6rem;margin-bottom:0.25rem;">PRO Admin Tools</h1>
        <p style="color:var(--text-mid);margin-bottom:1.75rem;">Upload stories, news, minutes, events, and gallery pictures.</p>

        <div class="admin-grid">

            <!-- Post News / Story / Minutes -->
            <div class="glass-card" style="padding:1.75rem;">
                <h3 style="margin-bottom:1.25rem;">Post News / Story / Minutes</h3>
                <form id="pro-news-form">
                    <input type="hidden" id="pro-token">
                    <div class="form-group">
                        <label>Type</label>
                        <select id="news-type" class="status-select" style="width:100%;">
                            <option value="news">General News</option>
                            <option value="story">Focus Story (Landing Page)</option>
                            <option value="minutes">Meeting Minutes</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="news-title" required>
                    </div>
                    <div class="form-group">
                        <label>Content</label>
                        <textarea id="news-content" rows="4" required
                            style="width:100%;border:1.5px solid var(--border-color);border-radius:var(--r-sm);padding:0.65rem;font-family:'Inter',sans-serif;font-size:0.9rem;background:rgba(255,255,255,0.7);resize:vertical;"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image (Optional)</label>
                        <input type="file" id="news-image" accept="image/*">
                    </div>
                    <div class="form-group">
                        <label>Document (Optional — PDF, DOC, DOCX, TXT)</label>
                        <input type="file" id="news-document" accept=".pdf,.doc,.docx,.txt">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Publish Content</button>
                </form>
            </div>

            <!-- Add Upcoming Event -->
            <div class="glass-card" style="padding:1.75rem;">
                <h3 style="margin-bottom:1.25rem;">Add Upcoming Event</h3>
                <form id="pro-event-form">
                    <div class="form-group">
                        <label>Event Title</label>
                        <input type="text" id="event-title" required>
                    </div>
                    <div class="form-group">
                        <label>Date &amp; Time</label>
                        <input type="datetime-local" id="event-date" required>
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="event-location">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="event-description" rows="3"
                            style="width:100%;border:1.5px solid var(--border-color);border-radius:var(--r-sm);padding:0.65rem;font-family:'Inter',sans-serif;font-size:0.9rem;background:rgba(255,255,255,0.7);resize:vertical;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Create Event</button>
                </form>
            </div>

            <!-- Upload to Gallery -->
            <div class="glass-card" style="padding:1.75rem;">
                <h3 style="margin-bottom:1.25rem;">Upload to Gallery</h3>
                <form id="pro-gallery-form">
                    <div class="form-group">
                        <label>Caption</label>
                        <input type="text" id="gallery-caption">
                    </div>
                    <div class="form-group">
                        <label>Image (Required)</label>
                        <input type="file" id="gallery-image" accept="image/*" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Upload Picture</button>
                </form>
            </div>
        </div>
    </section>
</main>

<!-- Payment Modal — all IDs preserved -->
<div id="payment-modal" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h3 style="margin:0;">Update Monthly Payments</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <p style="margin-bottom:1rem;font-size:0.88rem;color:var(--text-mid);">Select quick options or pick individual months:</p>
        <div class="preset-buttons">
            <button class="btn btn-secondary preset-btn" data-preset="yearly">Yearly</button>
            <button class="btn btn-secondary preset-btn" data-preset="h1">1st Half</button>
            <button class="btn btn-secondary preset-btn" data-preset="h2">2nd Half</button>
            <button class="btn btn-secondary preset-btn" data-preset="q1">Q1</button>
            <button class="btn btn-secondary preset-btn" data-preset="q2">Q2</button>
            <button class="btn btn-secondary preset-btn" data-preset="q3">Q3</button>
            <button class="btn btn-secondary preset-btn" data-preset="q4">Q4</button>
            <button class="btn btn-secondary preset-btn" data-preset="clear"
                style="color:var(--danger);border-color:var(--danger);">Clear All</button>
        </div>
        <div class="months-grid">
            <label class="month-checkbox-group"><input type="checkbox" value="Jan" class="month-check"> Jan</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Feb" class="month-check"> Feb</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Mar" class="month-check"> Mar</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Apr" class="month-check"> Apr</label>
            <label class="month-checkbox-group"><input type="checkbox" value="May" class="month-check"> May</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Jun" class="month-check"> Jun</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Jul" class="month-check"> Jul</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Aug" class="month-check"> Aug</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Sep" class="month-check"> Sep</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Oct" class="month-check"> Oct</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Nov" class="month-check"> Nov</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Dec" class="month-check"> Dec</label>
        </div>
        <button class="btn btn-primary" id="save-payment-btn" style="width:100%;">Save Payments</button>
    </div>
</div>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script src="js/admin-dashboard.js?v=2"></script>
<script>
    // Tab switching logic — preserved exactly
    const tabs = ['users', 'pro'];
    tabs.forEach(tab => {
        document.getElementById(`tab-${tab}-btn`).addEventListener('click', (e) => {
            tabs.forEach(t => {
                document.getElementById(`tab-${t}`).style.display = 'none';
                document.getElementById(`tab-${t}-btn`).classList.replace('btn-primary', 'btn-secondary');
            });
            document.getElementById(`tab-${tab}`).style.display = 'block';
            e.target.classList.replace('btn-secondary', 'btn-primary');
        });
    });

    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (loggedInUser) {
        if (!loggedInUser.is_admin && loggedInUser.is_pro_admin) {
            document.getElementById('tab-users-btn').style.display = 'none';
            document.getElementById('tab-users').style.display = 'none';
            document.getElementById('nav-admin-title').textContent = 'PRO';
            document.getElementById('tab-pro-btn').click();
        } else if (loggedInUser.is_admin && !loggedInUser.is_pro_admin) {
            document.getElementById('tab-pro-btn').style.display = 'none';
        }
    }

    const handleUpload = async (url, formData) => {
        try {
            const res = await fetch(API_URL + url, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });
            const contentType = res.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                data = { message: `Server error (${res.status}) — check that the server is running.` };
                console.error('Non-JSON response:', text.substring(0, 300));
            }
            if (res.ok) { alert('Successfully uploaded!'); return true; }
            else { alert('Error: ' + data.message); return false; }
        } catch (e) {
            alert('Upload failed: ' + e);
            return false;
        }
    };

    const withLoadingBtn = async (form, uploadFn) => {
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Uploading...';
        try {
            const success = await uploadFn();
            if (success) form.reset();
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    };

    document.getElementById('pro-news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await withLoadingBtn(e.target, () => {
            const formData = new FormData();
            formData.append('type',    document.getElementById('news-type').value);
            formData.append('title',   document.getElementById('news-title').value);
            formData.append('content', document.getElementById('news-content').value);
            const img = document.getElementById('news-image').files[0];
            if (img) formData.append('image', img);
            const doc = document.getElementById('news-document').files[0];
            if (doc) formData.append('document', doc);
            return handleUpload('/news', formData);
        });
    });

    document.getElementById('pro-event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await withLoadingBtn(e.target, () => {
            const formData = new FormData();
            formData.append('title',       document.getElementById('event-title').value);
            formData.append('event_date',  document.getElementById('event-date').value);
            formData.append('location',    document.getElementById('event-location').value);
            formData.append('description', document.getElementById('event-description').value);
            return handleUpload('/events', formData);
        });
    });

    document.getElementById('pro-gallery-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await withLoadingBtn(e.target, () => {
            const formData = new FormData();
            formData.append('caption', document.getElementById('gallery-caption').value);
            formData.append('image',   document.getElementById('gallery-image').files[0]);
            return handleUpload('/gallery', formData);
        });
    });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify visually and functionally**

Open `frontend/admin-dashboard.html` as an admin user. Check:
- Glass nav with ADMIN badge
- User Management tab: table loads, filter works, reminder button works, payment modal opens/saves
- PRO tab: upload forms submit correctly
- Role-based tab hiding works (PRO-only admin sees only PRO tab)

- [ ] **Step 3: Commit**

```bash
git add frontend/admin-dashboard.html
git commit -m "style: redesign admin dashboard with glass table and form cards"
```

---

## Task 10: Create `frontend/admin-finance.html`

**Files:**
- Create: `frontend/admin-finance.html`

**Note:** This is a new HTML page for the financial admin role. It loads `admin-dashboard.js` (unchanged) which requires: `#users-table-body`, `#status-filter`, `#send-all-reminders-btn`, `#payment-modal`, `#modal-close-btn`, `#save-payment-btn`, `.month-check`, `.preset-btn`. All are included below.

- [ ] **Step 1: Create the file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finance Admin | FGGC Gboko FCT Chapter Alumni</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <style>
        /* Override body bg to dark navy for finance admin */
        body { background: linear-gradient(160deg, #0D2B4E 0%, #112f57 100%); min-height: 100vh; }
        main { color: rgba(255,255,255,0.85); }
        main h1, main h2, main h3 { color: var(--pearl); }
        main p { color: rgba(255,255,255,0.6); }
        .page-heading p { color: rgba(255,255,255,0.5); }

        /* Dark glass table for finance admin */
        table {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
        }
        th {
            background: rgba(255,255,255,0.10);
            color: var(--sky);
        }
        td {
            color: rgba(255,255,255,0.75);
            border-bottom-color: rgba(255,255,255,0.07);
        }
        tbody tr:hover { background: rgba(91,170,204,0.07); }

        /* Filter row on dark bg */
        .filter-container label  { color: rgba(255,255,255,0.6); }
        .status-select {
            background: rgba(255,255,255,0.10);
            border-color: rgba(255,255,255,0.18);
            color: rgba(255,255,255,0.85);
        }

        /* Stat cards on dark bg */
        .fin-stat {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: var(--r-lg);
            padding: 1.25rem;
        }
        .fin-stat .f-val {
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--sky);
            margin-bottom: 0.2rem;
        }
        .fin-stat .f-lbl {
            font-size: 0.78rem;
            color: rgba(255,255,255,0.5);
            font-weight: 600;
        }
    </style>
</head>
<body>

<!-- Dark glass pill nav with FINANCE badge -->
<nav class="nav-pill nav-pill--dark">
    <div style="display:flex;align-items:center;gap:0.5rem;">
        <a href="index.html" class="nav-logo">FGGC Alumni</a>
        <span class="nav-badge nav-badge--finance">FINANCE</span>
    </div>
    <div class="auth-buttons" id="auth-links"></div>
</nav>

<main>
    <div class="page-heading" style="margin-bottom:1.5rem;">
        <h1>Payment Management</h1>
        <p>Track and update monthly dues for all members.</p>
    </div>

    <!-- Stat cards -->
    <div class="stat-card-grid" style="margin-bottom:1.75rem;" id="fin-stats-row">
        <div class="fin-stat">
            <div class="f-val" id="stat-paid">—</div>
            <div class="f-lbl">Fully Paid</div>
        </div>
        <div class="fin-stat">
            <div class="f-val" style="color:#e67e22;" id="stat-pending">—</div>
            <div class="f-lbl">1–2 Months Behind</div>
        </div>
        <div class="fin-stat">
            <div class="f-val" style="color:var(--danger);" id="stat-overdue">—</div>
            <div class="f-lbl">3+ Months Overdue</div>
        </div>
    </div>

    <div class="filter-container">
        <label for="status-filter">Filter by Status:</label>
        <select id="status-filter" class="status-select">
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
        </select>
        <button id="send-all-reminders-btn" class="btn"
            style="background:var(--danger);color:white;margin-left:auto;">
            Send Reminder to All Unpaid
        </button>
    </div>

    <div style="overflow-x:auto;border-radius:var(--r-lg);">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Member ID</th>
                    <th>Payment Status</th>
                    <th>Months Paid</th>
                    <th>Last Payment</th>
                    <th>Actions</th>
                    <th>Reminder</th>
                </tr>
            </thead>
            <tbody id="users-table-body">
                <tr><td colspan="8">Loading&hellip;</td></tr>
            </tbody>
        </table>
    </div>

    <div style="margin-top:1rem;padding:0.75rem 1rem;background:rgba(91,170,204,0.1);border-radius:var(--r-md);border:1px solid rgba(91,170,204,0.2);font-size:0.85rem;color:rgba(255,255,255,0.55);">
        Click <strong style="color:var(--sky);">Update Payments</strong> next to any member to edit their monthly payment record.
    </div>
</main>

<!-- Payment Modal — all IDs preserved for admin-dashboard.js -->
<div id="payment-modal" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h3 style="margin:0;">Update Monthly Payments</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <p style="margin-bottom:1rem;font-size:0.88rem;color:var(--text-mid);">Select quick options or pick individual months:</p>
        <div class="preset-buttons">
            <button class="btn btn-secondary preset-btn" data-preset="yearly">Yearly</button>
            <button class="btn btn-secondary preset-btn" data-preset="h1">1st Half</button>
            <button class="btn btn-secondary preset-btn" data-preset="h2">2nd Half</button>
            <button class="btn btn-secondary preset-btn" data-preset="q1">Q1</button>
            <button class="btn btn-secondary preset-btn" data-preset="q2">Q2</button>
            <button class="btn btn-secondary preset-btn" data-preset="q3">Q3</button>
            <button class="btn btn-secondary preset-btn" data-preset="q4">Q4</button>
            <button class="btn btn-secondary preset-btn" data-preset="clear"
                style="color:var(--danger);border-color:var(--danger);">Clear All</button>
        </div>
        <div class="months-grid">
            <label class="month-checkbox-group"><input type="checkbox" value="Jan" class="month-check"> Jan</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Feb" class="month-check"> Feb</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Mar" class="month-check"> Mar</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Apr" class="month-check"> Apr</label>
            <label class="month-checkbox-group"><input type="checkbox" value="May" class="month-check"> May</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Jun" class="month-check"> Jun</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Jul" class="month-check"> Jul</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Aug" class="month-check"> Aug</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Sep" class="month-check"> Sep</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Oct" class="month-check"> Oct</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Nov" class="month-check"> Nov</label>
            <label class="month-checkbox-group"><input type="checkbox" value="Dec" class="month-check"> Dec</label>
        </div>
        <button class="btn btn-primary" id="save-payment-btn" style="width:100%;">Save Payments</button>
    </div>
</div>

<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<!-- admin-dashboard.js handles fetchUsers, renderTable, modal, reminders -->
<script src="js/admin-dashboard.js"></script>
<script>
    // After admin-dashboard.js loads users, populate the stat cards
    // Use MutationObserver on #users-table-body to detect when table is populated
    const tableBody = document.getElementById('users-table-body');
    const observer = new MutationObserver(() => {
        const rows = tableBody.querySelectorAll('tr[data-status], tr td .status-badge');
        const paid    = tableBody.querySelectorAll('.status-paid').length;
        const pending = tableBody.querySelectorAll('.status-pending').length;
        const overdue = tableBody.querySelectorAll('.status-overdue').length;
        if (paid + pending + overdue > 0) {
            document.getElementById('stat-paid').textContent    = paid;
            document.getElementById('stat-pending').textContent = pending;
            document.getElementById('stat-overdue').textContent = overdue;
        }
    });
    observer.observe(tableBody, { childList: true, subtree: true });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify visually and functionally**

Open `frontend/admin-finance.html` as an admin user (`is_admin: true`). Check:
- Dark navy background, dark glass nav with FINANCE badge
- Table loads with member payment data
- Filter dropdown works
- Payment modal opens, presets work, save updates the record
- Stat cards update after table loads

- [ ] **Step 3: Commit**

```bash
git add frontend/admin-finance.html
git commit -m "feat: create financial admin dashboard with dark glass design"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Task 1 — styles.css with all design tokens and components
- [x] Task 2 — Homepage: dark hero, glass bento, floating nav
- [x] Task 3 — About: glass card sections, stats, mission/vision
- [x] Task 4 — News: pill tabs, glass items, doc download
- [x] Task 5 — Gallery: masonry grid, lightbox preserved
- [x] Task 6 — Login: dark glass immersive
- [x] Task 7 — Signup: same dark glass layout as login
- [x] Task 8 — User Dashboard: glass stat cards, month grid
- [x] Task 9 — PRO Admin Dashboard: glass table + upload forms
- [x] Task 10 — Financial Admin: new dark page, loads admin-dashboard.js

**Placeholder scan:** No TBDs, no "implement later" phrases.

**Type consistency:** All class names used in later tasks match what's defined in Task 1's CSS. All IDs in tasks match the Critical Hooks table.
