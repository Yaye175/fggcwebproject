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
                   COALESCE(p.status, 'unpaid') AS payment_status
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
    const currentYear = new Date().getFullYear();

    try {
        // Check if there's a payment record for this year
        const [payments] = await pool.execute(
            'SELECT id, status FROM payments WHERE user_id = ? AND year = ?',
            [userId, currentYear]
        );

        let newStatus = 'paid';

        if (payments.length > 0) {
            // Toggle existing status
            newStatus = payments[0].status === 'paid' ? 'unpaid' : 'paid';
            await pool.execute(
                'UPDATE payments SET status = ? WHERE id = ?',
                [newStatus, payments[0].id]
            );
        } else {
            // Create new record as paid with a default amount
            const defaultAmount = 50.00; // e.g. 50 GHS/NGN/USD
            await pool.execute(
                'INSERT INTO payments (user_id, year, amount, status) VALUES (?, ?, ?, ?)',
                [userId, currentYear, defaultAmount, 'paid']
            );
        }

        res.json({ message: 'Payment status updated', status: newStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error toggling payment status' });
    }
});

module.exports = router;
