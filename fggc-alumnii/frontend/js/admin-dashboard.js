document.addEventListener('DOMContentLoaded', () => {
    // Restrict access to admin only. Parse defensively — corrupt localStorage
    // must not throw and take the whole page (and its buttons) down with it.
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        localStorage.removeItem('user');
    }
    if (!user || (!user.is_admin && !user.is_pro_admin)) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return;
    }

    const tableBody = document.getElementById('users-table-body');
    const filterSelect = document.getElementById('status-filter');
    const yearSelect = document.getElementById('year-filter');
    let allUsers = [];

    // Dues are tracked from 2024; the current year is added automatically each
    // January. Must match FIRST_DUES_YEAR in backend/src/dues.js.
    const FIRST_DUES_YEAR = 2024;
    const CURRENT_YEAR = new Date().getFullYear();
    let selectedYear = CURRENT_YEAR;

    if (yearSelect) {
        for (let y = CURRENT_YEAR; y >= FIRST_DUES_YEAR; y--) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y === CURRENT_YEAR ? `${y} (current)` : String(y);
            yearSelect.appendChild(opt);
        }
        yearSelect.addEventListener('change', () => {
            selectedYear = Number(yearSelect.value);
            // Reminder emails cover the current year only — hide the bulk
            // button while a past year is on screen so it can't be mistaken
            // for "remind everyone who owes for <past year>".
            const bulkBtn = document.getElementById('send-all-reminders-btn');
            if (bulkBtn) bulkBtn.style.display = selectedYear === CURRENT_YEAR ? '' : 'none';
            fetchUsers();
        });
    }

    // Fetch all users on load if standard admin
    if (user.is_admin) {
        fetchUsers();
    }

    filterSelect.addEventListener('change', () => {
        renderTable(allUsers);
    });

    const sendAllRemindersBtn = document.getElementById('send-all-reminders-btn');
    if (sendAllRemindersBtn) {
        sendAllRemindersBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to send email reminders to ALL unpaid/pending users? This could take a while.')) return;
            
            const originalText = sendAllRemindersBtn.textContent;
            sendAllRemindersBtn.textContent = 'Sending...';
            sendAllRemindersBtn.disabled = true;
            try {
                // Not passing targetUserId sends it to everyone
                const res = await api.post('/admin/reminders', {}); 
                alert(res.message || 'All reminders sent successfully!');
            } catch(err) {
                alert('Error sending bulk reminders: ' + err.message);
            } finally {
                sendAllRemindersBtn.textContent = originalText;
                sendAllRemindersBtn.disabled = false;
            }
        });
    }

    async function fetchUsers() {
        try {
            tableBody.innerHTML = '<tr><td colspan="8">Loading users...</td></tr>';
            const users = await api.get(`/admin/users?year=${selectedYear}`);
            allUsers = users;
            renderTable(allUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            tableBody.innerHTML = '<tr><td colspan="8" style="color: red;">Error loading users.</td></tr>';
        }
    }

    // Abbreviations must match the values stored in months_paid
    const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    /**
     * Computes status for the selected year from months_paid
     * (same rules as backend/src/dues.js).
     *
     *   - Expected months = all 12 for a past year; Jan → current month for this year
     *   - Past year with nothing entered yet → "Not recorded"
     *   - 0 unpaid → Paid, 1–2 unpaid → Pending, 3+ unpaid → Overdue
     */
    function getEffectiveStatus(user) {
        if (selectedYear < CURRENT_YEAR && !Number(user.has_record)) return 'Not recorded';
        const expectedMonths = selectedYear < CURRENT_YEAR
            ? MONTH_ABBREVS
            : MONTH_ABBREVS.slice(0, new Date().getMonth() + 1);
        const paidMonths = (user.months_paid || '').split(',').map(s => s.trim()).filter(Boolean);
        const unpaidCount = expectedMonths.filter(m => !paidMonths.includes(m)).length;

        if (unpaidCount === 0)  return 'Paid';
        if (unpaidCount >= 3)   return 'Overdue';
        return 'Pending';
    }

    function renderTable(users) {
        tableBody.innerHTML = '';
        const filterValue = filterSelect.value;
        const filteredUsers = users.filter(u => filterValue === 'All' || getEffectiveStatus(u) === filterValue);

        if (filteredUsers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">No users found.</td></tr>';
            return;
        }

        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');

            // Format date safely
            let displayDate = 'Never';
            if (user.last_payment_date) {
                const d = new Date(user.last_payment_date);
                displayDate = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            }

            const effectiveStatus = getEffectiveStatus(user);
            const statusClass = `status-${effectiveStatus.toLowerCase().replace(/\s+/g, '-')}`;
            const monthsPaid = user.months_paid || 'None';
            // Reminder emails are about the current year's dues only.
            const isUnpaid = effectiveStatus !== 'Paid' && selectedYear === CURRENT_YEAR;

            tr.innerHTML = `
                <td>${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.member_id || 'FGGC/' + (user.graduation_year || '0000') + '/000')}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(effectiveStatus)}</span></td>
                <td>${escapeHtml(monthsPaid)}</td>
                <td>${displayDate}</td>
                <td>
                    <button class="btn btn-secondary action-btn" data-action="update-payment" data-userid="${user.id}" data-months="${escapeHtml(user.months_paid || '')}" style="background:#0a2540; color:white; border:none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        Update Payments
                    </button>
                </td>
                <td>
                    ${isUnpaid ? `<button class="btn action-btn reminder-btn" data-userid="${user.id}" style="background:var(--danger-red); color:white; border:none; padding: 6px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                        Send Reminder
                    </button>` : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach event listeners for the dynamically created update buttons
        document.querySelectorAll('.action-btn[data-action="update-payment"]').forEach(btn => {
            const handleUpdate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openPaymentModal(btn.dataset.userid, btn.dataset.months);
            };
            btn.addEventListener('click', handleUpdate);
            btn.addEventListener('touchend', handleUpdate); // iOS Safari strict tap fix
        });

        // Attach event listeners for the dynamically created reminder buttons
        document.querySelectorAll('.reminder-btn').forEach(btn => {
            const handleReminder = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const userId = btn.dataset.userid;
                btn.textContent = 'Sending...';
                btn.disabled = true;
                try {
                    const res = await api.post('/admin/reminders', { targetUserId: userId });
                    alert(`Reminder sent successfully!\n\nEmail Preview: ${res.previewUrls && res.previewUrls.length > 0 ? res.previewUrls[0] : 'N/A'}`);
                } catch(err) {
                    alert('Error sending reminder: ' + err.message);
                } finally {
                    btn.textContent = 'Send Reminder';
                    btn.disabled = false;
                }
            };
            btn.addEventListener('click', handleReminder);
            btn.addEventListener('touchend', handleReminder);
        });
    }

    let currentEditingUserId = null;

    // ====== Modal Event Bindings (no inline onclick - CSP safe) ======

    function openPaymentModal(userId, currentMonthsStr) {
        currentEditingUserId = userId;
        const modal = document.getElementById('payment-modal');
        const checkboxes = document.querySelectorAll('.month-check');
        const currentMonths = currentMonthsStr.split(',').map(s => s.trim());

        checkboxes.forEach(cb => {
            cb.checked = currentMonths.includes(cb.value);
        });

        const title = document.getElementById('payment-modal-title');
        if (title) title.textContent = `Update Monthly Payments — ${selectedYear}`;

        modal.style.display = 'flex';
    }

    function closePaymentModal() {
        const modal = document.getElementById('payment-modal');
        modal.style.display = 'none';
        currentEditingUserId = null;
    }

    function presetMonths(preset) {
        const checkboxes = document.querySelectorAll('.month-check');
        const presetsMap = {
            'yearly': ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            'h1': ['Jan','Feb','Mar','Apr','May','Jun'],
            'h2': ['Jul','Aug','Sep','Oct','Nov','Dec'],
            'q1': ['Jan','Feb','Mar'],
            'q2': ['Apr','May','Jun'],
            'q3': ['Jul','Aug','Sep'],
            'q4': ['Oct','Nov','Dec'],
            'clear': []
        };

        const targetArr = presetsMap[preset] || [];
        checkboxes.forEach(cb => {
            cb.checked = targetArr.includes(cb.value);
        });
    }

    async function savePaymentModal() {
        if (!currentEditingUserId) return;

        const checkboxes = document.querySelectorAll('.month-check:checked');
        const selectedMonths = Array.from(checkboxes).map(cb => cb.value).join(', ');

        try {
            await api.put(`/admin/finance/payments/${currentEditingUserId}/toggle`, { year: selectedYear, months_paid: selectedMonths });
            closePaymentModal();
            fetchUsers(); // Reload table
            alert(`${selectedYear} payments updated successfully`);
        } catch (error) {
            alert('Failed to update status: ' + error.message);
        }
    }

    // Bind Close button
    document.getElementById('modal-close-btn').addEventListener('click', closePaymentModal);

    // Bind Save button
    document.getElementById('save-payment-btn').addEventListener('click', savePaymentModal);

    // Bind all Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            presetMonths(btn.dataset.preset);
        });
    });

    // Close modal when clicking the overlay background
    document.getElementById('payment-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closePaymentModal();
        }
    });

    // Keeping legacy window references just in case
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
    window.presetMonths = presetMonths;
    window.savePaymentModal = savePaymentModal;
    window.updatePaymentStatus = async function(userId) {
        console.warn("Deprecated updatePaymentStatus called");
    };
});
