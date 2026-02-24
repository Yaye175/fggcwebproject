document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Protect route
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Populate profile card
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    if (profileName) profileName.textContent = `${user.first_name} ${user.last_name}`;
    if (profileEmail) profileEmail.textContent = user.email;

    // Fetch dues status
    const paymentStatusEl = document.getElementById('payment-status');
    const yearEl = document.getElementById('current-year');

    if (paymentStatusEl) {
        try {
            const data = await api.get('/payments/me');

            yearEl.textContent = data.year;

            if (data.status === 'paid') {
                paymentStatusEl.innerHTML = `<span class="badge badge-paid">PAID</span>`;
            } else {
                paymentStatusEl.innerHTML = `<span class="badge badge-unpaid">UNPAID</span>`;
            }
        } catch (error) {
            paymentStatusEl.textContent = 'Error loading status';
        }
    }
});
