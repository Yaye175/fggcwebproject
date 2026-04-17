/**
 * animations.js — Pure visual / design motion layer
 * Zero app-functionality is touched here.
 */
(function () {
    'use strict';

    /* ══════════════════════════════════════════════════════
       1.  SCROLL-REVEAL  (IntersectionObserver)
    ══════════════════════════════════════════════════════ */
    var REVEAL_MAP = [
        { sel: '.glass-card',            mod: ''           },
        { sel: '.news-item',             mod: 'from-left'  },
        { sel: '.gallery-item',          mod: 'scale-in'   },
        { sel: 'table',                  mod: ''           },
        { sel: '.stat-card-grid > *',    mod: ''           },
        { sel: '.bento-story',           mod: 'from-left'  },
        { sel: '.bento-events',          mod: ''           },
        { sel: '.bento-sidebar',         mod: 'from-right' },
        { sel: '.dashboard-grid > *',    mod: ''           },
        { sel: '.admin-grid > *',        mod: ''           },
        { sel: '.page-heading',          mod: ''           },
        { sel: '.pill-tabs',             mod: ''           },
        { sel: '.filter-container',      mod: ''           },
        { sel: '.fin-stat',              mod: ''           },
    ];

    function initScrollReveal() {
        if (!('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

        REVEAL_MAP.forEach(function (item) {
            document.querySelectorAll(item.sel).forEach(function (el, i) {
                // Skip if already has an ongoing CSS entrance animation (hero children)
                if (el.closest('.page-hero')) return;

                el.classList.add('will-reveal');
                if (item.mod) el.classList.add(item.mod);

                // Stagger via transition-delay
                el.style.transitionDelay = (i * 0.07) + 's';

                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.95) {
                    // Already in viewport on load — reveal quickly
                    setTimeout(function () {
                        el.classList.add('revealed');
                    }, 80 + i * 60);
                } else {
                    io.observe(el);
                }
            });
        });
    }


    /* ══════════════════════════════════════════════════════
       2.  FLOATING PARTICLES  (canvas on .page-hero)
    ══════════════════════════════════════════════════════ */
    function initParticles() {
        var hero = document.querySelector('.page-hero');
        if (!hero) return;

        var canvas = document.createElement('canvas');
        canvas.className = 'hero-particles';
        hero.insertBefore(canvas, hero.firstChild);

        var ctx = canvas.getContext('2d');
        var particles = [];
        var raf;

        function resize() {
            canvas.width  = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        }

        function Particle() { this.reset(true); }
        Particle.prototype.reset = function (initial) {
            this.x  = Math.random() * canvas.width;
            this.y  = initial ? Math.random() * canvas.height : canvas.height + 10;
            this.r  = Math.random() * 1.6 + 0.5;
            this.dx = (Math.random() - 0.5) * 0.35;
            this.dy = -(Math.random() * 0.55 + 0.15);
            this.alpha     = Math.random() * 0.55 + 0.12;
            this.life      = initial ? Math.floor(Math.random() * 160) : 0;
            this.maxLife   = Math.random() * 180 + 90;
        };
        Particle.prototype.update = function () {
            this.x   += this.dx;
            this.y   += this.dy;
            this.life++;
            if (this.life > this.maxLife || this.y < -4) this.reset(false);
        };
        Particle.prototype.draw = function () {
            var fade = this.life < 25
                ? this.life / 25
                : this.life > this.maxLife - 25
                    ? (this.maxLife - this.life) / 25
                    : 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(91,170,204,' + (this.alpha * fade).toFixed(3) + ')';
            ctx.fill();
        };

        function init() {
            resize();
            particles = [];
            for (var i = 0; i < 70; i++) particles.push(new Particle());
        }

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(function (p) { p.update(); p.draw(); });
            raf = requestAnimationFrame(loop);
        }

        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) cancelAnimationFrame(raf);
            else loop();
        });

        init();
        loop();
    }


    /* ══════════════════════════════════════════════════════
       3.  CURSOR SPOTLIGHT  (follows mouse on dark hero)
    ══════════════════════════════════════════════════════ */
    function initCursorSpotlight() {
        var hero = document.querySelector('.page-hero');
        if (!hero) return;

        var spot = document.createElement('div');
        spot.className = 'cursor-spotlight';
        spot.style.opacity = '0';
        hero.appendChild(spot);

        var mx = 0, my = 0, cx = 0, cy = 0, running = false;

        function lerp(a, b, t) { return a + (b - a) * t; }

        function animate() {
            cx = lerp(cx, mx, 0.09);
            cy = lerp(cy, my, 0.09);
            spot.style.left = cx + 'px';
            spot.style.top  = cy + 'px';
            requestAnimationFrame(animate);
        }

        hero.addEventListener('mousemove', function (e) {
            var rect = hero.getBoundingClientRect();
            mx = e.clientX - rect.left;
            my = e.clientY - rect.top;
            if (!running) { running = true; spot.style.opacity = '1'; animate(); }
        });
        hero.addEventListener('mouseleave', function () {
            spot.style.opacity = '0';
        });
    }


    /* ══════════════════════════════════════════════════════
       4.  3-D CARD TILT  (on glass-card hover)
    ══════════════════════════════════════════════════════ */
    function initTilt() {
        document.querySelectorAll('.glass-card, .glass-card--dark').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var rx = ((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * -7;
                var ry = ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) *  7;
                card.style.transform = 'translateY(-5px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.012)';
                card.style.transition = 'transform 0.08s ease';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
                card.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
            });
        });
    }


    /* ══════════════════════════════════════════════════════
       5.  MAGNETIC BUTTONS  (primary + navy btns)
    ══════════════════════════════════════════════════════ */
    function initMagneticBtns() {
        document.querySelectorAll('.btn-primary, .btn-navy').forEach(function (btn) {
            btn.addEventListener('mousemove', function (e) {
                var rect = btn.getBoundingClientRect();
                var dx = (e.clientX - rect.left - rect.width  / 2) * 0.28;
                var dy = (e.clientY - rect.top  - rect.height / 2) * 0.28;
                btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.06)';
                btn.style.transition = 'transform 0.12s ease';
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            });
        });
    }


    /* ══════════════════════════════════════════════════════
       6.  COUNTER ANIMATION  (stat numbers)
    ══════════════════════════════════════════════════════ */
    function animateCounter(el) {
        var raw  = el.textContent.trim();
        var m    = raw.match(/^([^\d]*)(\d[\d.,]*)([^\d]*)$/);
        if (!m) return;
        var pre  = m[1], num = parseFloat(m[2].replace(/,/g, '')), suf = m[3];
        if (isNaN(num)) return;

        var start = performance.now();
        var dur   = 1100;

        function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

        (function tick(now) {
            var p = Math.min((now - start) / dur, 1);
            el.textContent = pre + Math.round(num * ease(p)) + suf;
            if (p < 1) requestAnimationFrame(tick);
        })(start);
    }

    function initCounters() {
        if (!('IntersectionObserver' in window)) return;
        var sel = [
            '.stat-card-grid .glass-card',
            '.fin-stat',
        ].join(', ');

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                // find the large number child
                var big = entry.target.querySelector('[style*="1.8rem"], .f-val');
                if (big) animateCounter(big);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        document.querySelectorAll(sel).forEach(function (el) { io.observe(el); });
    }


    /* ══════════════════════════════════════════════════════
       7.  STAGGERED TABLE ROWS  (MutationObserver)
         Catches JS-injected rows after DOMContentLoaded
    ══════════════════════════════════════════════════════ */
    function initTableRowStagger() {
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        function staggerRows() {
            tbody.querySelectorAll('tr').forEach(function (tr, i) {
                if (tr.dataset.animated) return;
                tr.dataset.animated = '1';
                tr.style.opacity = '0';
                tr.style.transform = 'translateY(20px)';
                tr.style.transition = 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
                setTimeout(function () {
                    tr.style.opacity = '1';
                    tr.style.transform = '';
                }, 60 + i * 55);
            });
        }

        var mo = new MutationObserver(staggerRows);
        mo.observe(tbody, { childList: true });
    }


    /* ══════════════════════════════════════════════════════
       8.  STAGGERED INJECTED CARDS  (events, news, gallery)
         Catches any JS-injected .glass-card / .news-item
         inside containers, post-load.
    ══════════════════════════════════════════════════════ */
    function initInjectedCardStagger() {
        var containers = [
            '#events-container',
            '#news-container',
            '#gallery-container',
            '#story-container',
        ];

        containers.forEach(function (selector) {
            var el = document.querySelector(selector);
            if (!el) return;

            var mo = new MutationObserver(function () {
                el.querySelectorAll(
                    '.glass-card, .card, .news-item, .gallery-item, .event-card'
                ).forEach(function (card, i) {
                    if (card.dataset.animated) return;
                    card.dataset.animated = '1';
                    card.style.opacity   = '0';
                    card.style.transform = 'translateY(30px)';
                    card.style.transition = 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                    setTimeout(function () {
                        card.style.opacity   = '1';
                        card.style.transform = '';
                    }, 80 + i * 90);
                });
            });

            mo.observe(el, { childList: true, subtree: true });
        });
    }


    /* ══════════════════════════════════════════════════════
       INIT ALL
    ══════════════════════════════════════════════════════ */
    function init() {
        initScrollReveal();
        initParticles();
        initCursorSpotlight();
        initTilt();
        initMagneticBtns();
        initCounters();
        initTableRowStagger();
        initInjectedCardStagger();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
