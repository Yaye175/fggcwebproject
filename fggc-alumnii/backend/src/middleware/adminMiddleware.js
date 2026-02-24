const pool = require('../db');

const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [rows] = await pool.execute('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);

        if (rows.length === 0 || !rows[0].is_admin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ message: 'Server error checking admin status' });
    }
};

module.exports = adminMiddleware;
