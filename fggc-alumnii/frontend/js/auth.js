document.addEventListener('DOMContentLoaded', () => {
    // Check auth status to toggle navigation links
    const updateNav = () => {
        const user = JSON.parse(localStorage.getItem('user'));
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
});

// Global Logout
window.logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (e) {
        console.error('Logout error:', e);
    }
    localStorage.removeItem('token'); // Clear any stale tokens
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};
