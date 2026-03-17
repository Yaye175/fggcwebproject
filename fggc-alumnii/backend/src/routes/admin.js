const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /admin/users - list all users
router.get('/users', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.graduation_year, u.department, u.phone, 
                   u.payment_status, u.last_payment_date, u.is_admin, u.created_at,
                   COALESCE(p.months_paid, '') AS months_paid
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id AND p.year = ?
            ORDER BY u.last_name ASC
        `;

        const [users] = await pool.execute(query, [currentYear]);

        // Generate proper Member IDs: FGGC/{graduation_year}/{sequential_number}
        // Users are already sorted by last_name ASC from the query
        // Group by graduation_year and assign sequential numbers within each year
        const yearCounters = {};
        users.forEach(user => {
            const year = user.graduation_year || 'UNKNOWN';
            if (!yearCounters[year]) yearCounters[year] = 0;
            yearCounters[year]++;
            const seq = String(yearCounters[year]).padStart(3, '0');
            user.member_id = `FGGC/${year}/${seq}`;
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Server error fetching all users' });
    }
});

// PUT /admin/users/:id/payment-status - update user's payment status
router.put('/users/:id/payment-status', async (req, res) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status || !['Paid', 'Pending', 'Overdue'].includes(payment_status)) {
        return res.status(400).json({ message: 'Invalid payment status provided. Must be Paid, Pending, or Overdue.' });
    }

    try {
        // Set last_payment_date to NOW() if status is changed to Paid, otherwise leave or set it to a logic as requested.
        // We will just set last_payment_date = CURRENT_TIMESTAMP unconditionally during status update to reflect when it was changed.
        await pool.execute(
            'UPDATE users SET payment_status = ?, last_payment_date = CURRENT_TIMESTAMP WHERE id = ?',
            [payment_status, id]
        );

        res.json({ message: 'Payment status updated successfully', payment_status });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ message: 'Server error updating payment status' });
    }
});

module.exports = router;
