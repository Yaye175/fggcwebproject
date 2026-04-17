document.addEventListener('DOMContentLoaded', () => {
    // Restrict access to admin only
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (!user.is_admin && !user.is_pro_admin)) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return;
    }

    const tableBody = document.getElementById('users-table-body');
    const filterSelect = document.getElementById('status-filter');
    let allUsers = [];

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
            const users = await api.get('/admin/users');
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
     * Computes status purely from months_paid vs the current calendar date.
     *
     * Rules:
     *   - Expected months = Jan → current month (inclusive)
     *   - 0 unpaid           → Paid
     *   - 1–2 unpaid         → Pending
     *   - 3+ unpaid          → Overdue
     */
    function getEffectiveStatus(user) {
        const currentMonthIndex = new Date().getMonth(); // 0 = Jan
        const expectedMonths = MONTH_ABBREVS.slice(0, currentMonthIndex + 1);
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
            const statusClass = `status-${effectiveStatus.toLowerCase()}`;
            const monthsPaid = user.months_paid || 'None';
            const isUnpaid = effectiveStatus !== 'Paid';

            tr.innerHTML = `
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.member_id || 'FGGC/' + (user.graduation_year || '0000') + '/000'}</td>
                <td><span class="status-badge ${statusClass}">${effectiveStatus}</span></td>
                <td>${monthsPaid}</td>
                <td>${displayDate}</td>
                <td>
                    <button class="btn btn-secondary action-btn" data-action="update-payment" data-userid="${user.id}" data-months="${user.months_paid || ''}" style="background:#0a2540; color:white; border:none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
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
            await api.put(`/admin/finance/payments/${currentEditingUserId}/toggle`, { months_paid: selectedMonths });
            closePaymentModal();
            fetchUsers(); // Reload table
            alert('Payments updated successfully');
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
