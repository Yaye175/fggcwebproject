const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const dues = require('../dues');

const router = express.Router();

// GET /payments/me
// Top-level fields describe the current year (unchanged shape). `years` lists
// every dues year, newest first, so the portal can show past years too.
router.get('/me', authMiddleware, async (req, res) => {
    // Always fetch fresh: a member checking right after the financial
    // secretary records a payment must not see a cached response.
    res.set('Cache-Control', 'no-store');

    try {
        const now = new Date();
        const thisYear = dues.currentYear(now);

        const [rows] = await pool.execute(
            'SELECT year, amount, status, months_paid FROM payments WHERE user_id = ? AND year BETWEEN ? AND ? ORDER BY id ASC',
            [req.user.id, dues.FIRST_DUES_YEAR, thisYear]
        );
        const byYear = new Map();
        for (const row of rows) if (!byYear.has(row.year)) byYear.set(row.year, row);

        const years = dues.duesYears(now).map(year => {
            const row = byYear.get(year);
            const months = dues.parseMonths(row ? row.months_paid : '').months;
            const expected = dues.expectedMonths(year, now);
            return {
                year,
                // A past year nobody has entered yet is "not recorded", not
                // "12 months owed" — avoids showing members false arrears
                // before the financial secretary back-fills history.
                recorded: Boolean(row),
                months_paid: months.join(', '),
                months_owed: expected.filter(m => !months.includes(m)).length,
                monthly_status: dues.statusFor(year, months, now),
            };
        });

        const current = byYear.get(thisYear);
        const currentSummary = years[0];

        res.json({
            status: current ? current.status : 'unpaid',
            year: thisYear,
            amount: current ? current.amount : 0,
            months_paid: currentSummary.months_paid,
            monthly_status: currentSummary.monthly_status,
            years,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching payment status' });
    }
});

module.exports = router;
