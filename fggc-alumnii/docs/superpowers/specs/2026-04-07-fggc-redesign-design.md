# FGGC Alumni Website — Visual Redesign Spec
**Date:** 2026-04-07  
**Scope:** Pure visual redesign — no changes to backend, API routes, JS logic, or functionality.

---

## 1. Constraint: Functionality is Frozen

Every existing behaviour remains exactly as-is:
- All API calls (`api.get()`, `api.post()`, etc.)
- Auth flow (JWT in localStorage, login/logout)
- Upload handlers (multer, `handleUpload`, `withLoadingBtn`)
- Payment status computation (`getEffectiveStatus`, month chips)
- Admin reminder logic (send all / send individual)
- Gallery lightbox (`openLightbox` / `closeLightbox`)
- Document upload and download pills

The redesign touches **only** HTML structure (layout wrappers, class names) and CSS (styles.css + inline styles).

---

## 2. Design Direction: Warm Glass

**Palette (unchanged):**
| Token | Value | Usage |
|---|---|---|
| `--navy` | `#0D2B4E` | Primary brand, dark backgrounds, headings |
| `--sky` | `#5BAACC` | Accent, CTAs on dark, active indicators |
| `--cream` | `#F7F3ED` | Page backgrounds (light pages) |
| `--pearl` | `#FEFCF8` | Near-white text on dark |
| `--text-mid` | `#7A7A8C` | Secondary text |
| `--text-body` | `#5A5A6A` | Body paragraphs |

**Typography (unchanged):**
- Headings: Playfair Display (600, 700)
- Body / UI: Inter (400, 500, 600, 700)

**Glass card recipe:**
```css
background: rgba(255,255,255,0.60);
backdrop-filter: blur(14px);
border: 1px solid rgba(255,255,255,0.92);
border-radius: 18px;
box-shadow: 0 8px 40px rgba(13,43,78,0.09);
```

**Dark glass variant** (hero card, login card):
```css
background: rgba(255,255,255,0.10);
border: 1px solid rgba(255,255,255,0.18);
box-shadow: 0 16px 56px rgba(0,0,0,0.25);
```

**Ambient blobs:** absolutely-positioned circles with `filter: blur(40px)` and low-opacity `rgba` fills. Decorative only, `pointer-events: none`.

---

## 3. Navigation

**Style:** Floating Glass Pill — sticky, full-width, hovers above page content.  
**Light variant** (cream pages): `rgba(255,255,255,0.72)` background, navy text.  
**Dark variant** (navy pages): `rgba(255,255,255,0.11)` background, sky-blue logo.  
**Active link:** slightly bolder, 4px sky-blue dot indicator below.  
**Login CTA:** navy pill (`#0D2B4E` bg, `#5BAACC` text) on light pages; sky pill (`#5BAACC` bg, `#0D2B4E` text) on dark pages.  
**Mobile:** collapses to hamburger; nav links become a full-width glass drawer below the pill.

---

## 4. Pages

### 4.1 Homepage (`index.html`)
**Hero section** — full navy background (`#0D2B4E` → `#0a2540`):
- Dark glass pill nav
- Centred frosted glass card: chapter pill badge, Playfair Display H1 "Welcome Home, Alumni!", sub-copy, "Join the Community →" sky CTA button
- Ambient sky-blue blobs (top-right, bottom-left)

**Below-fold** — warm cream gradient:
- Light glass pill nav (sticky shows here when hero scrolls out)
- Bento grid (3 columns): Focus Story card | Upcoming Events | Weekly Challenges sidebar
- All bento cells are glass cards

### 4.2 About (`about.html`)
- Light glass pill nav
- Warm cream background
- Mission glass card (headline + body copy)
- 3-col stat row: Active Members | Year Founded | Chapter location (navy card)
- Chapter Executives glass card (avatar circles + name + role)

### 4.3 News & Archives (`news.html`)
- Light glass pill nav
- Warm cream background
- Page heading + pill tab switcher (Latest News / Meeting Minutes)
- Horizontal glass cards per item: thumbnail placeholder | title, date, excerpt, optional doc-download pill

### 4.4 Gallery (`gallery.html`)
- Light glass pill nav
- Warm cream background
- Page heading
- CSS columns masonry grid (3 col desktop → 2 → 1)
- Each item: glass card wrapping image + frosted caption bar
- Lightbox stays fully functional (just re-skinned overlay)

### 4.5 Login (`login.html`)
- Full navy background matching homepage hero
- Dark glass pill nav (Home + Sign Up only)
- Centred dark-glass form card: "Welcome Back" heading, email + password inputs, Login button, sign-up link

### 4.6 Sign Up (`signup.html`)
- Same navy background as login
- Dark-glass form card: name, email, password, graduation year, phone, "Create Account" CTA

### 4.7 User Dashboard (`dashboard.html`)
- Light glass pill nav (Home | Dashboard | Logout ghost button)
- Warm cream background
- Greeting heading (Playfair Display)
- 3-col stat row: Payment Status | Months Paid | Graduation Year
- Monthly breakdown glass card: 12-chip grid (paid=green, unpaid=muted, current=sky border)

### 4.8 PRO Admin Dashboard (`admin-dashboard.html`)
- Light glass pill nav with "PRO" badge chip
- Warm cream background
- 4-col stat row: Total Members | Paid | Pending | Overdue
- "Send Reminder to All Unpaid" red-tinted button (top-right of table)
- Member table: glass card wrapper, navy header row, per-row Remind button
- Upload section (2-col grid): Post News/Story/Minutes form | Gallery Upload + Create Event form
- All form fields styled as glass inputs; file drop zones dashed

### 4.9 Financial Admin Dashboard (`admin-finance.html`) — *new page*
- Dark navy background (matches login/hero)
- Dark glass pill nav with "FINANCE" badge chip
- 3-col frosted stat cards: Fully Paid | 1–2 Behind | 3+ Overdue
- Payment table: dark glass table wrapper, monthly mini-chips (green=paid, muted=unpaid), status badge, Edit button per row
- Note: this page does not currently exist as an HTML file. It needs to be created as a new file wired up to the existing `/api/admin-finance/` routes. The existing backend logic is preserved; only the HTML shell and styling are new.

---

## 5. Shared Components

| Component | Implementation |
|---|---|
| Glass card | `.glass-card` CSS class in styles.css |
| Dark glass card | `.glass-card.dark-glass` modifier |
| Glass pill nav | `.glass-nav` + `.light` / `.dark` variants |
| Status badge | `.status-badge` + `.status-paid` / `.status-pending` / `.status-overdue` |
| Month chip | `.month-chip` + `.paid` / `.unpaid` / `.current` |
| Ambient blob | `.blob` absolute-positioned div |
| Pill tab | `.pill-tab` + `.active` |

All components defined once in `frontend/css/styles.css` (full replacement).

---

## 6. Implementation Approach

A single CSS file replacement + HTML restructure per page.  
**No JS changes.** Every event listener, API call, and DOM id/class that JS references must be preserved exactly. Only add new wrapper/layout classes — never rename or remove IDs that JS targets.

**File scope:**
- `frontend/css/styles.css` — full replacement with Warm Glass design tokens + components
- `frontend/index.html` — layout restructure (hero + bento), preserve all JS hooks
- `frontend/about.html` — new file (static, no JS needed)
- `frontend/news.html` — layout + glass card wrappers, preserve JS hooks
- `frontend/gallery.html` — layout + masonry wrappers, preserve lightbox hooks
- `frontend/login.html` — dark hero wrapper + glass form card, preserve JS hooks
- `frontend/signup.html` — same dark wrapper as login, preserve JS hooks
- `frontend/dashboard.html` — glass stat/chip layout, preserve JS hooks
- `frontend/admin-dashboard.html` — glass table + upload sections, preserve all JS hooks
- `frontend/admin-finance.html` — **new file**, dark glass table layout, wired to existing `/api/admin-finance/` backend routes

---

## 7. Out of Scope

- No backend changes
- No JS logic changes
- No API or route changes
- No database changes
- No new features
- No mobile-first responsive overhaul (basic responsiveness only, as currently exists)
