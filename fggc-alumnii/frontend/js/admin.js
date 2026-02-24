document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // Protect Admin Route
    if (!user || !user.is_admin) {
        alert('Access Denied: Admins Only');
        window.location.href = 'dashboard.html';
        return;
    }

    const loadMembers = async () => {
        const tbody = document.getElementById('members-table-body');
        if (!tbody) return;

        try {
            const members = await api.get('/admin/finance/members');
            tbody.innerHTML = '';

            members.forEach(member => {
                const tr = document.createElement('tr');
                const isPaid = member.payment_status === 'paid';

                tr.innerHTML = `
                    <td>${member.first_name} ${member.last_name}</td>
                    <td>${member.email}</td>
                    <td>${member.graduation_year}</td>
                    <td>
                        <span class="badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}">
                            ${member.payment_status.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-secondary" style="background:#0a2540; color:white; border:none;" 
                                onclick="togglePayment(${member.id})">
                            Toggle Status
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5">Error loading members: ${error.message}</td></tr>`;
        }
    };

    // Make toggle function available globally so onclick works
    window.togglePayment = async (userId) => {
        try {
            await api.put(`/admin/finance/payments/${userId}/toggle`);
            loadMembers(); // Reload table
        } catch (error) {
            alert('Failed to update status');
        }
    };

    loadMembers();
});
