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

        let months_paid = '';
        let status = 'unpaid';
        let amount = 0;

        if (payments.length > 0) {
            months_paid = payments[0].months_paid || '';
            status = payments[0].status;
            amount = payments[0].amount;
        }

        // Dynamically compute the monthly status based on months paid vs current calendar month
        const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const currentMonthIndex = new Date().getMonth();
        const expectedMonths = MONTH_ABBREVS.slice(0, currentMonthIndex + 1);
        
        const paidMonthsArr = months_paid.split(',').map(s => s.trim()).filter(Boolean);
        const unpaidCount = expectedMonths.filter(m => !paidMonthsArr.includes(m)).length;
        
        let monthly_status = 'Paid';
        if (unpaidCount >= 3) {
            monthly_status = 'Overdue';
        } else if (unpaidCount > 0) {
            monthly_status = 'Pending';
        }

        res.json({ 
            status, 
            year: currentYear, 
            amount,
            months_paid,
            monthly_status
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching payment status' });
    }
});

module.exports = router;
