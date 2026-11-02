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
    const monthlyStatusEl = document.getElementById('monthly-status');
    const yearSelect = document.getElementById('dues-year');
    const gridContainer = document.getElementById('monthly-grid');

    const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Short label for the year picker, e.g. "2024 — 6 months unpaid".
    function yearOptionLabel(y, isCurrent) {
        let note;
        if (!y.recorded && !isCurrent) note = 'not recorded yet';
        else if (y.months_owed === 0) note = isCurrent ? 'up to date' : 'fully paid';
        else note = `${y.months_owed} month${y.months_owed === 1 ? '' : 's'} unpaid`;
        return `${y.year}${isCurrent ? ' (this year)' : ''} — ${note}`;
    }

    function renderYear(y, isCurrent) {
        if (yearEl) yearEl.textContent = y.year;

        const statusText = y.monthly_status || 'Pending';
        const userPaidMonths = (y.months_paid || '').split(',').map(m => m.trim()).filter(Boolean);
        const notRecorded = !y.recorded && !isCurrent;

        if (monthlyStatusEl) {
            monthlyStatusEl.textContent = notRecorded
                ? 'Not recorded yet'
                : statusText === 'Paid' ? (isCurrent ? 'Up to Date' : 'Fully Paid') : statusText;

            if (notRecorded) {
                monthlyStatusEl.style.color = 'var(--text-mid, #7A7A8C)';
            } else if (statusText === 'Paid') {
                monthlyStatusEl.style.color = 'var(--accent-green, #2E8B57)';
            } else if (statusText === 'Overdue') {
                monthlyStatusEl.style.color = 'var(--danger-red, #D9534F)';
            } else {
                monthlyStatusEl.style.color = 'var(--navy, #0D2B4E)';
            }

            // Append "Paid For: ..." if not fully paid
            if (statusText !== 'Paid' || notRecorded) {
                const subtext = document.createElement('div');
                subtext.style.fontSize = '0.8rem';
                subtext.style.fontFamily = "'Inter', sans-serif";
                subtext.style.fontWeight = '500';
                subtext.style.color = 'var(--text-mid, #7A7A8C)';
                subtext.style.marginTop = '0.25rem';

                if (notRecorded) {
                    subtext.textContent = `(The financial secretary hasn't entered ${y.year} yet)`;
                } else if (userPaidMonths.length > 0) {
                    subtext.textContent = `(Paid For: ${userPaidMonths.join(', ')})`;
                } else {
                    subtext.textContent = `(No months paid yet)`;
                }
                monthlyStatusEl.appendChild(subtext);
            }
        }

        if (paymentStatusEl) {
            if (notRecorded) {
                paymentStatusEl.innerHTML = `<span class="badge status-badge status-not-recorded">NOT RECORDED</span>`;
            } else if (statusText === 'Paid') {
                paymentStatusEl.innerHTML = `<span class="badge badge-paid">FULLY PAID</span>`;
            } else if (userPaidMonths.length > 0) {
                paymentStatusEl.innerHTML = `<span class="badge" style="background: rgba(243, 156, 18, 0.15); color: #E67E22; border: 1px solid rgba(243, 156, 18, 0.3);">PARTIALLY PAID</span>`;
            } else {
                paymentStatusEl.innerHTML = `<span class="badge badge-unpaid">UNPAID</span>`;
            }
        }

        // Render 12 months grid
        if (gridContainer) {
            gridContainer.innerHTML = '';
            ALL_MONTHS.forEach(m => {
                const isPaid = userPaidMonths.includes(m);
                const div = document.createElement('div');
                div.className = `month-box ${isPaid ? 'paid' : 'unpaid'}`;
                div.textContent = m;
                gridContainer.appendChild(div);
            });
        }
    }

    if (paymentStatusEl) {
        try {
            const data = await api.get('/payments/me');

            // Older API responses have no `years`; fall back to the current year only.
            const years = Array.isArray(data.years) && data.years.length
                ? data.years
                : [{ year: data.year, recorded: true, months_paid: data.months_paid, months_owed: null, monthly_status: data.monthly_status }];
            const currentYear = data.year;

            if (yearSelect && years.length > 1) {
                yearSelect.innerHTML = '';
                years.forEach(y => {
                    const opt = document.createElement('option');
                    opt.value = y.year;
                    opt.textContent = yearOptionLabel(y, y.year === currentYear);
                    yearSelect.appendChild(opt);
                });
                yearSelect.value = String(currentYear);
                yearSelect.style.display = '';
                yearSelect.addEventListener('change', () => {
                    const chosen = years.find(y => String(y.year) === yearSelect.value);
                    if (chosen) renderYear(chosen, chosen.year === currentYear);
                });
            }

            renderYear(years.find(y => y.year === currentYear) || years[0], true);
        } catch (error) {
            paymentStatusEl.textContent = 'Error loading status';
        }
    }
});
