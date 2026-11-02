#!/usr/bin/env node
/*
 * Automated colour-contrast check for the static frontend.
 *
 * Opens every page in fggc-alumnii/frontend in headless Chromium, in each
 * combination of screen size (desktop / phone), theme (light / dark) and auth
 * state (logged out / logged in as a PRO admin), and runs axe-core's WCAG AA
 * `color-contrast` rule.
 *
 * Existing failures are recorded in scripts/contrast-baseline.json. The check
 * fails only on failures that are NOT in the baseline, so new regressions are
 * caught while the backlog is fixed. When you fix one, re-run with
 * --update-baseline so the list shrinks and the fix can't silently regress.
 *
 *   npm run check:contrast                    # fail on new violations
 *   npm run check:contrast -- --update-baseline
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'fggc-alumnii', 'frontend');
const BASELINE = path.join(__dirname, 'contrast-baseline.json');
const AXE_SRC = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const THEMES = ['light', 'dark'];
// Desktop plus a phone-sized screen: many members open the site from WhatsApp
// links on their phones, and the mobile layout (bottom nav bar, stacked
// cards, hidden nav pill) has its own colours.
const VIEWPORTS = {
    desktop: { viewport: { width: 1280, height: 900 } },
    mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};
const USERS = {
    'logged-out': null,
    // Fake session: auth.js only reads localStorage to decide what the nav shows.
    'pro-admin': { id: 1, name: 'Contrast Check', is_pro_admin: true },
};

const pages = fs.readdirSync(FRONTEND).filter((f) => f.endsWith('.html')).sort();

async function auditPage(browser, page, theme, userKey, viewportKey) {
    const context = await browser.newContext({
        ...VIEWPORTS[viewportKey],
        reducedMotion: 'reduce',
    });
    const tab = await context.newPage();
    await tab.addInitScript(([t, u]) => {
        try {
            if (u) {
                localStorage.setItem('user', JSON.stringify(u));
                localStorage.setItem('token', 'contrast-check');
            }
            localStorage.setItem('theme', t);
        } catch (_) { /* storage unavailable: page still renders */ }
    }, [theme, USERS[userKey]]);

    // API calls fail on file:// — that's fine, we only need the rendered CSS.
    await tab.goto('file://' + path.join(FRONTEND, page), { waitUntil: 'load' });
    await tab.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        // Freeze motion so pixel measurements are identical run to run.
        const s = document.createElement('style');
        s.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
        document.head.appendChild(s);
    }, theme);
    // Let fonts load and scroll-reveal classes apply before measuring.
    await tab.evaluate(() => document.fonts && document.fonts.ready);
    await tab.waitForTimeout(1200);

    // Logged-in users get redirected away from login/signup, so record where we landed.
    const landed = path.basename(new URL(tab.url()).pathname);
    await tab.addScriptTag({ content: AXE_SRC });
    const result = await tab.evaluate(() =>
        window.axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['violations', 'incomplete'] })
    );

    const label = page === landed ? page : `${page}->${landed}`;
    const out = [];
    for (const v of result.violations) {
        for (const node of v.nodes) {
            const data = (node.any[0] && node.any[0].data) || {};
            out.push({
                key: [viewportKey, theme, userKey, label, node.target.join(' ')].join(' | '),
                ratio: data.contrastRatio,
                required: data.expectedContrastRatio,
                fg: data.fgColor,
                bg: data.bgColor,
                text: (node.html || '').replace(/\s+/g, ' ').slice(0, 80),
            });
        }
    }

    // axe can't compute a background behind images, gradients or translucent
    // "glass" layers and reports those as `incomplete` instead of failing them.
    // That is exactly how white-on-white nav text slipped through before, so
    // measure those elements from real rendered pixels instead.
    for (const v of result.incomplete) {
        for (const node of v.nodes) {
            if (node.target.length !== 1) continue; // iframe / shadow DOM: not used here
            const m = await measureFromPixels(tab, node.target[0]);
            if (m && m.ratio < m.required) {
                out.push({
                    key: [viewportKey, theme, userKey, label, node.target[0]].join(' | '),
                    ratio: m.ratio,
                    required: m.required,
                    fg: m.fg,
                    bg: 'rendered background (pixel sample)',
                    text: (node.html || '').replace(/\s+/g, ' ').slice(0, 80),
                });
            }
        }
    }
    await context.close();
    return out;
}

/*
 * Screenshot the element with its text made transparent, then compare the
 * text colour against every background pixel. The element passes if at least
 * 90% of its background meets the WCAG AA ratio (so a few stray pixels from a
 * starfield or shimmer don't cause false failures, but a bad gradient does).
 */
async function measureFromPixels(tab, selector) {
    const info = await tab.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || !el.textContent.trim()) return null;
        // Gradient-filled text (background-clip: text) has no single text colour
        // to compare against, and hiding it would still leave the gradient glyphs
        // in the screenshot. Skip rather than report noise.
        if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') return null;
        const fg = cs.color; // read before hiding — cs is live
        if (/^rgba\(.*,\s*0\)$/.test(fg)) return null;
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        let style = document.getElementById('__cc-hide-style');
        if (!style) {
            style = document.createElement('style');
            style.id = '__cc-hide-style';
            style.textContent = '.__cc-hide, .__cc-hide * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' +
                ' .__cc-hide img, .__cc-hide svg, .__cc-hide video, .__cc-hide canvas { visibility: hidden !important; }';
            document.head.appendChild(style);
        }
        el.scrollIntoView({ block: 'center' });
        // Sample only where the text is drawn, not the element's whole box:
        // a pill button's box includes corners outside its border-radius that
        // show the surface *behind* the button, and how big a share of pixels
        // those corners are depends on font metrics (text width), which made
        // results differ between machines.
        const range = document.createRange();
        range.selectNodeContents(el);
        const textBox = range.getBoundingClientRect();
        const box = textBox.width >= 1 && textBox.height >= 1 ? textBox : el.getBoundingClientRect();
        el.classList.add('__cc-hide');
        return {
            fg,
            required: size >= 24 || (bold && size >= 18.66) ? 3 : 4.5,
            clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.max(1, box.width), height: Math.max(1, box.height) },
        };
    }, selector);
    if (!info) return null;

    const png = await tab.screenshot({ clip: info.clip });
    await tab.evaluate((sel) => document.querySelector(sel).classList.remove('__cc-hide'), selector);

    return tab.evaluate(async ({ b64, fg, required }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const px = ctx.getImageData(0, 0, c.width, c.height).data;

        const [fr, fgG, fb, fa = 1] = fg.match(/[\d.]+/g).map(Number);
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

        const ratios = [];
        for (let i = 0; i < px.length; i += 4) {
            const br = px[i], bg = px[i + 1], bb = px[i + 2];
            // Translucent text is drawn over the background, so blend it first.
            const L1 = lum(fr * fa + br * (1 - fa), fgG * fa + bg * (1 - fa), fb * fa + bb * (1 - fa));
            const L2 = lum(br, bg, bb);
            ratios.push((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05));
        }
        ratios.sort((a, b) => a - b);
        const p10 = ratios[Math.floor(ratios.length * 0.1)];
        return { ratio: Math.round(p10 * 100) / 100, required, fg };
    }, { b64: png.toString('base64'), fg: info.fg, required: info.required });
}

(async () => {
    const update = process.argv.includes('--update-baseline');
    const browser = await chromium.launch();
    const found = new Map();
    try {
        for (const viewportKey of Object.keys(VIEWPORTS)) {
            for (const theme of THEMES) {
                for (const userKey of Object.keys(USERS)) {
                    for (const page of pages) {
                        for (const v of await auditPage(browser, page, theme, userKey, viewportKey)) found.set(v.key, v);
                    }
                }
            }
        }
    } finally {
        await browser.close();
    }

    const keys = [...found.keys()].sort();
    if (update) {
        fs.writeFileSync(BASELINE, JSON.stringify(keys, null, 2) + '\n');
        console.log(`Baseline updated: ${keys.length} known contrast violation(s) recorded in ${path.relative(ROOT, BASELINE)}`);
        return;
    }

    const baseline = new Set(fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : []);
    const fresh = keys.filter((k) => !baseline.has(k));
    const fixed = [...baseline].filter((k) => !found.has(k));

    console.log(`Checked ${pages.length} pages x ${Object.keys(VIEWPORTS).length} screen sizes x ${THEMES.length} themes x ${Object.keys(USERS).length} auth states.`);
    console.log(`Known (baselined) violations still present: ${keys.length - fresh.length}`);

    if (fixed.length) {
        console.log(`\n${fixed.length} baselined violation(s) no longer occur — nice. Run with --update-baseline to lock that in.`);
    }

    if (fresh.length) {
        console.error(`\nFAIL: ${fresh.length} new colour-contrast violation(s) (WCAG AA):\n`);
        for (const k of fresh) {
            const v = found.get(k);
            console.error(`  ${k}\n    ratio ${v.ratio}:1 (needs ${v.required}) — text ${v.fg} on ${v.bg}\n    ${v.text}\n`);
        }
        console.error('Fix the colours, or if this is intentional, run: npm run check:contrast -- --update-baseline');
        process.exitCode = 1;
    } else {
        console.log('\nPASS: no new colour-contrast violations.');
    }
})().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
