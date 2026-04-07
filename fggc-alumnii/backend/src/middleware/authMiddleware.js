const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    let token;

    // Check for token in cookies first (HttpOnly)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } 
    // Fallback to Authorization header
    else {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token required' });
        }
        token = authHeader.split(' ')[1];
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_here_change_in_production');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
