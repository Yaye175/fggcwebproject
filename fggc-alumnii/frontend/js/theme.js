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
        var label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        // Update every theme control (desktop FAB + mobile bottom-nav tab).
        var controls = document.querySelectorAll('#theme-toggle, .theme-nav-tab');
        for (var i = 0; i < controls.length; i++) {
            controls[i].setAttribute('aria-label', label);
        }
    }

    window.toggleTheme = function () {
        var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('fggc-theme', next);
        applyTheme(next);
    };

    // On mobile the floating button is hidden (see CSS); instead we surface the
    // toggle as the last tab in the bottom nav bar. Icons reuse the existing
    // .theme-icon-moon/.theme-icon-sun classes so they swap with the theme.
    function injectNavThemeTab() {
        var nav = document.querySelector('.mobile-bottom-nav');
        if (!nav || nav.querySelector('.theme-nav-tab')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mobile-nav-tab theme-nav-tab';
        btn.addEventListener('click', window.toggleTheme);
        btn.innerHTML =
            '<svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
            '<svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
            '<span>Theme</span>';
        nav.appendChild(btn);
    }

    applyTheme(getTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNavThemeTab);
    } else {
        injectNavThemeTab();
    }
})();
