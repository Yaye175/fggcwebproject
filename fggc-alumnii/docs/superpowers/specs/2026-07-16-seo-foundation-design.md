# SEO Foundation — Design

**Date:** 2026-07-16
**Status:** Approved

## Goal

Give the FGGC Gboko FCT Chapter Alumni site a complete, crawler-safe SEO
foundation: rank for relevant searches AND render clean link previews when
shared. The site is static HTML served by Express; there are 4 public content
pages and 7 auth/private pages.

**Canonical base URL:** `https://www.fggcgbokoogaabj.com` (bare domain → www).
Site is live at this domain.

## Scope

**Public / indexable (4):** `index.html` (home), `about.html`, `gallery.html`, `news.html`
**Private / non-content (7):** `login.html`, `signup.html`, `dashboard.html`,
`admin-dashboard.html`, `admin-finance.html`, `forgot-password.html`, `reset-password.html`

## Design

### 1. Per-page `<head>` tags on the 4 public pages
Each public page gets:
- Existing unique `<title>` (kept) + a tailored `<meta name="description">`
- `<link rel="canonical">` — home → `/`, others → `/<page>.html`
- Open Graph: `og:title`, `og:description`, `og:type=website`, `og:url`,
  `og:site_name="FGGC Gboko FCT Chapter Alumni"`, `og:image` (absolute badge URL
  `https://www.fggcgbokoogaabj.com/images/logo.png`), `og:image:alt`, `og:locale=en_US`
- Twitter: card type `summary` (square badge, not `summary_large_image`),
  `twitter:title`, `twitter:description`, `twitter:image`

Descriptions:
- **Home:** Official website of the FGGC Gboko FCT Chapter Alumni Association — reconnect with fellow old girls, catch up on news and events, browse the gallery, and manage your membership dues.
- **About:** Learn about the FGGC Gboko FCT Chapter Alumni Association — our mission, our story, and the community of Federal Government Girls College Gboko old girls in the FCT.
- **Gallery:** Photos and videos from FGGC Gboko FCT Chapter Alumni Association events, reunions, and gatherings.
- **News:** Latest news, meeting minutes, and stories from the FGGC Gboko FCT Chapter Alumni Association.

### 2. Keep private pages out of search
Add `<meta name="robots" content="noindex, nofollow">` to the 7 non-content
pages. They remain crawlable (NOT disallowed in robots.txt) so crawlers can read
the noindex directive — the correct way to guarantee de-indexing.

### 3. `robots.txt` (new, served at site root from `frontend/`)
Allows all; points to the sitemap; does NOT disallow `/uploads/` so gallery
images remain eligible for Google Images.

```
User-agent: *
Allow: /
Sitemap: https://www.fggcgbokoogaabj.com/sitemap.xml
```

### 4. `sitemap.xml` (new, `frontend/` root)
The 4 public URLs only, absolute `www` form, with `<lastmod>`, `<changefreq>`,
`<priority>` (home 1.0).

### 5. Structured data (JSON-LD) on the homepage
`EducationalOrganization`: name, url, logo (absolute badge URL), description.
No `sameAs` (no social accounts). Enables Google to show the badge / an org
rich result.

### 6. Backend: guarded bare→www 301 redirect
Small Express middleware in `backend/src/index.js`: if the request host is the
bare apex `fggcgbokoogaabj.com`, 301 to the `www` host preserving path + query.
Guarded so it never affects localhost, health checks, or unknown hosts.

## Out of scope (YAGNI)
Clean/extensionless URLs, server-side meta templating, a designed 1200×630 share
banner, analytics/Search Console wiring (a short "submit sitemap to Google" note
is provided instead).

## Verification
Boot the server; confirm it still starts with the new middleware; `curl` the
home page (tags present), a private page (noindex present), `/robots.txt`, and
`/sitemap.xml` (served, correct content).
