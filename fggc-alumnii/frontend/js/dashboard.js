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
            
            const statusText = data.monthly_status || 'Pending';
            const userPaidMonths = (data.months_paid || '').split(',').map(m => m.trim()).filter(Boolean);

            if (monthlyStatusEl) {
                 monthlyStatusEl.textContent = statusText === 'Paid' ? 'Up to Date' : statusText;

                 if (statusText === 'Paid') {
                     monthlyStatusEl.style.color = 'var(--accent-green, #2E8B57)';
                 } else if (statusText === 'Overdue') {
                     monthlyStatusEl.style.color = 'var(--danger-red, #D9534F)';
                 } else {
                     monthlyStatusEl.style.color = 'var(--navy, #0D2B4E)';
                 }

                 // Append "Paid For: ..." if not fully paid but has some payments
                 if (statusText !== 'Paid') {
                     const subtext = document.createElement('div');
                     subtext.style.fontSize = '0.8rem';
                     subtext.style.fontFamily = "'Inter', sans-serif";
                     subtext.style.fontWeight = '500';
                     subtext.style.color = 'var(--text-mid, #7A7A8C)';
                     subtext.style.marginTop = '0.25rem';
                     
                     if (userPaidMonths.length > 0) {
                         subtext.textContent = `(Paid For: ${userPaidMonths.join(', ')})`;
                     } else {
                         subtext.textContent = `(No months paid yet)`;
                     }
                     monthlyStatusEl.appendChild(subtext);
                 }
            }

            if (statusText === 'Paid') {
                paymentStatusEl.innerHTML = `<span class="badge badge-paid">FULLY PAID</span>`;
            } else if (userPaidMonths.length > 0) {
                paymentStatusEl.innerHTML = `<span class="badge" style="background: rgba(243, 156, 18, 0.15); color: #E67E22; border: 1px solid rgba(243, 156, 18, 0.3);">PARTIALLY PAID</span>`;
            } else {
                paymentStatusEl.innerHTML = `<span class="badge badge-unpaid">UNPAID</span>`;
            }

            // Render 12 months grid
            const gridContainer = document.getElementById('monthly-grid');
            if (gridContainer) {
                const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
