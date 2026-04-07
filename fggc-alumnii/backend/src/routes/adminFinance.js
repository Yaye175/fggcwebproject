const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /admin/finance/members
router.get('/members', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // This query fetches all users and their payment status for the current year
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.graduation_year,
                   COALESCE(p.status, 'unpaid') AS payment_status,
                   COALESCE(p.months_paid, '') AS months_paid
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id AND p.year = ?
            WHERE u.is_admin = FALSE
            ORDER BY u.last_name ASC
        `;

        const [members] = await pool.execute(query, [currentYear]);
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching members' });
    }
});

// PUT /admin/finance/payments/:userId/toggle
router.put('/payments/:userId/toggle', async (req, res) => {
    const { userId } = req.params;
    const { months_paid } = req.body;
    const currentYear = new Date().getFullYear();

    try {
        // Check if there's a payment record for this year
        const [payments] = await pool.execute(
            'SELECT id, status FROM payments WHERE user_id = ? AND year = ?',
            [userId, currentYear]
        );

        // Calculate expected status from the payload
        // If months_paid is provided and not empty, it's paid. Otherwise unpaid.
        let newStatus = months_paid ? 'paid' : 'unpaid';
        let displayStatus = months_paid ? 'Paid' : 'Pending'; // For the users table (capitalized)
        let newMonthsPaid = months_paid || '';

        if (payments.length > 0) {
            // Update existing record
            await pool.execute(
                'UPDATE payments SET status = ?, months_paid = ? WHERE id = ?',
                [newStatus, newMonthsPaid, payments[0].id]
            );
        } else {
            // Create new record as paid with a default amount
            const defaultAmount = 50.00; // e.g. 50 GHS/NGN/USD
            await pool.execute(
                'INSERT INTO payments (user_id, year, amount, status, months_paid) VALUES (?, ?, ?, ?, ?)',
                [userId, currentYear, defaultAmount, newStatus, newMonthsPaid]
            );
        }

        // Sync the users table so the admin dashboard reflects the change
        await pool.execute(
            'UPDATE users SET payment_status = ?, last_payment_date = CURRENT_TIMESTAMP WHERE id = ?',
            [displayStatus, userId]
        );

        res.json({ message: 'Payment status updated', status: newStatus, months_paid: newMonthsPaid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating payment status' });
    }
});

module.exports = router;
