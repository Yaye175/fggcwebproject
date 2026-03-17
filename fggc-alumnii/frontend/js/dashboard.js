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
    const monthsPaidEl = document.getElementById('months-paid');
    const monthlyStatusEl = document.getElementById('monthly-status');

    if (paymentStatusEl) {
        try {
            const data = await api.get('/payments/me');

            yearEl.textContent = data.year;
            
            if (monthlyStatusEl) {
                 monthlyStatusEl.textContent = data.monthly_status || 'Pending';
                 // Optionally add some styling based on status
                 if (data.monthly_status === 'Paid') {
                     monthlyStatusEl.style.color = 'var(--accent-green, green)';
                 } else if (data.monthly_status === 'Overdue') {
                     monthlyStatusEl.style.color = 'var(--danger-red, red)';
                 }
            }

            if (data.status === 'paid') {
                paymentStatusEl.innerHTML = `<span class="badge badge-paid">PAID</span>`;
            } else {
                paymentStatusEl.innerHTML = `<span class="badge badge-unpaid">UNPAID</span>`;
            }

            // Render 12 months grid
            const gridContainer = document.getElementById('monthly-grid');
            if (gridContainer) {
                const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const userPaidMonths = (data.months_paid || '').split(',').map(m => m.trim());

                gridContainer.innerHTML = ''; // Clear loading text
                allMonths.forEach(m => {
                    const isPaid = userPaidMonths.includes(m);
                    const div = document.createElement('div');
                    div.className = `month-box ${isPaid ? 'paid' : 'unpaid'}`;
                    div.textContent = m;
                    gridContainer.appendChild(div);
                });
            }
        } catch (error) {
            paymentStatusEl.textContent = 'Error loading status';
        }
    }
});
