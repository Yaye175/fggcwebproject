document.addEventListener('DOMContentLoaded', () => {
    // Safely read the stored user once, clearing corrupt data.
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            localStorage.removeItem('user');
            return null;
        }
    };

    const dashboardFor = (user) =>
        (user.is_admin || user.is_pro_admin) ? 'admin-dashboard.html' : 'dashboard.html';

    // Defense-in-depth: an authenticated user should never be shown the login
    // form. If they land on login.html (bookmark, back button, a stale tab, or
    // an old link), send them straight to their dashboard instead of making
    // them sign in again. replace() keeps login.html out of history.
    const authedUser = getUser();
    if (authedUser && document.getElementById('login-form')) {
        window.location.replace(dashboardFor(authedUser));
        return;
    }

    // Check auth status to toggle navigation links
    const updateNav = () => {
        const user = getUser();
        const authContainer = document.getElementById('auth-links');

        if (authContainer) {
            if (user) {
                // Logged in
                let links = `
                    <a href="dashboard.html" class="btn btn-secondary">Dashboard</a>
                `;
                if (user.is_admin) {
                    links += `<a href="admin-dashboard.html" class="btn btn-secondary">Admin Panel</a>`;
                } else if (user.is_pro_admin) {
                    links += `<a href="admin-dashboard.html" class="btn btn-secondary">PRO Dashboard</a>`;
                }
                links += `<button id="logout-btn" class="btn btn-primary">Logout</button>`;

                authContainer.innerHTML = links;

                // Attach robust listener
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    const handleLogout = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.logout();
                    };
                    logoutBtn.addEventListener('click', handleLogout);
                    logoutBtn.addEventListener('touchend', handleLogout); // iOS fix
                }
            } else {
                // Logged out
                authContainer.innerHTML = `
                    <a href="login.html" class="btn btn-secondary">Login</a>
                    <a href="signup.html" class="btn btn-primary">Sign Up</a>
                `;
            }
        }
    };

    updateNav();

    // Keep the mobile bottom-nav "account" tab in sync with auth state. When
    // logged in it must lead to the dashboard — not the login page — otherwise
    // tapping it looks like being logged out and forced to sign in again.
    const updateBottomNav = () => {
        const tab = document.querySelector('.mobile-nav-tab[data-page="login"], .mobile-nav-tab[data-page="account"]');
        if (!tab) return;
        const label = tab.querySelector('span');
        const user = getUser();
        if (user) {
            tab.setAttribute('href', dashboardFor(user));
            tab.setAttribute('data-page', 'account');
            if (label) label.textContent = 'Dashboard';
            const page = (window.location.pathname.split('/').pop() || '').replace('.html', '');
            if (page === 'dashboard' || page === 'admin-dashboard') tab.classList.add('active');
        } else {
            tab.setAttribute('href', 'login.html');
            tab.setAttribute('data-page', 'login');
            if (label) label.textContent = 'Login';
        }
    };
    updateBottomNav();

    // Password Reveal Toggle
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const eyeIcon = document.getElementById('eye-icon');
            if (type === 'text') {
                eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
            } else {
                eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
            }
        });
    }

    // Attach to Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');

            try {
                const data = await api.post('/auth/login', { email, password });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect based on role
                if (data.user.is_admin || data.user.is_pro_admin) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                errorDiv.textContent = err.message;
            }
        });
    }

    // Attach to Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const first_name = document.getElementById('first_name').value;
            const last_name = document.getElementById('last_name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const graduation_year = document.getElementById('graduation_year').value;
            const errorDiv = document.getElementById('error-message');

            try {
                await api.post('/auth/signup', { first_name, last_name, email, password, graduation_year });
                window.location.href = 'login.html?success=true';
            } catch (err) {
                errorDiv.textContent = err.message;
            }
        });
    }

    // Attach to Forgot Password Form
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            const errorDiv = document.getElementById('forgot-error');
            const successDiv = document.getElementById('forgot-success');
            const btn = document.getElementById('forgot-btn');
            
            errorDiv.textContent = '';
            successDiv.style.display = 'none';
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const res = await api.post('/auth/forgot-password', { email });
                successDiv.textContent = res.message;
                successDiv.style.display = 'block';
                forgotForm.reset();
            } catch (err) {
                errorDiv.textContent = err.message;
            } finally {
                btn.textContent = 'Send Reset Link \u2192';
                btn.disabled = false;
            }
        });
    }

    // Attach to Reset Password Form
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        // Auto-fill email display if we want, or just keep it invisible via URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        
        if (!token || !email) {
            document.getElementById('reset-error').textContent = 'Invalid reset link. Missing token or email.';
            document.getElementById('reset-btn').disabled = true;
        }

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('reset-password').value;
            const confirmPassword = document.getElementById('reset-confirm').value;
            const errorDiv = document.getElementById('reset-error');
            const successDiv = document.getElementById('reset-success');
            const btn = document.getElementById('reset-btn');

            errorDiv.textContent = '';
            
            if (newPassword !== confirmPassword) {
                errorDiv.textContent = 'Passwords do not match.';
                return;
            }

            btn.textContent = 'Updating...';
            btn.disabled = true;

            try {
                const res = await api.post('/auth/reset-password', { email, token, newPassword });
                successDiv.textContent = res.message;
                successDiv.style.display = 'block';
                resetForm.reset();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } catch (err) {
                errorDiv.textContent = err.message;
                btn.textContent = 'Update Password';
                btn.disabled = false;
            }
        });
    }
});

// Global Logout
window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};
