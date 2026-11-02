const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const dues = require('../dues');

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /admin/finance/members?year=2025  (year defaults to the current year)
router.get('/members', async (req, res) => {
    const year = dues.parseYear(req.query.year);
    if (year === null) {
        return res.status(400).json({ message: `Year must be between ${dues.FIRST_DUES_YEAR} and ${dues.currentYear()}.` });
    }

    try {
        const query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.graduation_year,
                   COALESCE(p.status, 'unpaid') AS payment_status,
                   COALESCE(p.months_paid, '') AS months_paid,
                   (p.id IS NOT NULL) AS has_record
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id AND p.year = ?
            WHERE u.is_admin = FALSE
            ORDER BY u.last_name ASC
        `;

        const [members] = await pool.execute(query, [year]);
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching members' });
    }
});

// PUT /admin/finance/payments/:userId/toggle
// Body: { months_paid: "Jan, Feb", year?: 2025 }  (year defaults to the current year)
router.put('/payments/:userId/toggle', async (req, res) => {
    const { userId } = req.params;
    const year = dues.parseYear(req.body.year);
    if (year === null) {
        return res.status(400).json({ message: `Year must be between ${dues.FIRST_DUES_YEAR} and ${dues.currentYear()}.` });
    }

    const { months, invalid } = dues.parseMonths(req.body.months_paid);
    if (invalid.length) {
        return res.status(400).json({ message: `Unknown month(s): ${invalid.join(', ')}` });
    }

    const monthsPaid = months.join(', ');
    const displayStatus = dues.statusFor(year, months); // Paid | Pending | Overdue
    // payments.status is ENUM('paid','unpaid'). Writing 'pending'/'overdue'
    // here made MySQL (strict mode) reject every partial-month save, so those
    // payments were never stored and never reached the member's portal.
    // Pending/Overdue are always derived from months_paid when read.
    const dbStatus = displayStatus === 'Paid' ? 'paid' : 'unpaid';

    try {
        const [payments] = await pool.execute(
            'SELECT id FROM payments WHERE user_id = ? AND year = ?',
            [userId, year]
        );

        if (payments.length > 0) {
            await pool.execute(
                'UPDATE payments SET status = ?, months_paid = ? WHERE id = ?',
                [dbStatus, monthsPaid, payments[0].id]
            );
        } else {
            const defaultAmount = 50.00;
            await pool.execute(
                'INSERT INTO payments (user_id, year, amount, status, months_paid) VALUES (?, ?, ?, ?, ?)',
                [userId, year, defaultAmount, dbStatus, monthsPaid]
            );
        }

        // users.payment_status is the member's *current* standing (used by the
        // admin table and reminders). Back-filling an earlier year must not
        // overwrite it.
        if (year === dues.currentYear()) {
            await pool.execute(
                'UPDATE users SET payment_status = ?, last_payment_date = CURRENT_TIMESTAMP WHERE id = ?',
                [displayStatus, userId]
            );
        }

        res.json({ message: 'Payment status updated', year, status: dbStatus, monthly_status: displayStatus, months_paid: monthsPaid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating payment status' });
    }
});

module.exports = router;
