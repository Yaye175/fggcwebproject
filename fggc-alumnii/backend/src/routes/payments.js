const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /payments/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Fetch monthly status from users table
        const [userRows] = await pool.execute(
            'SELECT payment_status FROM users WHERE id = ?',
            [req.user.id]
        );
        const monthlyStatus = userRows.length > 0 ? (userRows[0].payment_status || 'Pending') : 'Pending';

        // Fetch user's payments for this year
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE user_id = ? AND year = ?',
            [req.user.id, currentYear]
        );

        if (payments.length === 0) {
            // No payment record yet - default to unpaid
            return res.json({ status: 'unpaid', year: currentYear, months_paid: '', monthly_status: monthlyStatus });
        }

        res.json({ 
            status: payments[0].status, 
            year: currentYear, 
            amount: payments[0].amount,
            months_paid: payments[0].months_paid || '',
            monthly_status: monthlyStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching payment status' });
    }
});

module.exports = router;
