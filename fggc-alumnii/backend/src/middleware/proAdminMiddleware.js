/**
 * Middleware: Requires the user to be an Admin or PRO Admin.
 * Must be used AFTER authMiddleware (so req.user is populated).
 */
const proAdminMiddleware = (req, res, next) => {
    if (req.user && (req.user.is_admin || req.user.is_pro_admin)) return next();
    return res.status(403).json({ message: 'Access denied: Pro Admin role required' });
};

module.exports = proAdminMiddleware;
