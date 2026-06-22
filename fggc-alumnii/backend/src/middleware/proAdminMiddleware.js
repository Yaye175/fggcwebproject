const pool = require('../db');

/**
 * Middleware: Requires the user to be an Admin or PRO Admin.
 * Must be used AFTER authMiddleware (so req.user is populated).
 *
 * Re-checks the database rather than trusting the JWT claim, so a role that was
 * revoked is enforced immediately instead of lingering until the token expires.
 */
const proAdminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [rows] = await pool.execute(
            'SELECT is_admin, is_pro_admin FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0 || (!rows[0].is_admin && !rows[0].is_pro_admin)) {
            return res.status(403).json({ message: 'Access denied: Pro Admin role required' });
        }

        next();
    } catch (error) {
        console.error('Pro admin verification error:', error);
        res.status(500).json({ message: 'Server error checking admin status' });
    }
};

module.exports = proAdminMiddleware;
