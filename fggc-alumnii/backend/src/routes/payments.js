const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /payments/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Fetch user's payments for this year
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE user_id = ? AND year = ?',
            [req.user.id, currentYear]
        );

        if (payments.length === 0) {
            // No payment record yet - default to unpaid
            return res.json({ status: 'unpaid', year: currentYear });
        }

        res.json({ status: payments[0].status, year: currentYear, amount: payments[0].amount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching payment status' });
    }
});

module.exports = router;
