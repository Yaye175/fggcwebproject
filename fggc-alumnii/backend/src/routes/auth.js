const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// POST /auth/signup
router.post('/signup', authLimiter, [
    body('first_name').trim().notEmpty().withMessage('First name is required').escape(),
    body('last_name').trim().notEmpty().withMessage('Last name is required').escape(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('graduation_year').optional().isInt(),
    body('department').optional().trim().escape(),
    body('phone').optional().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { first_name, last_name, email, password, graduation_year, department, phone } = req.body;

    try {
        // Check if user exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await pool.execute(
            `INSERT INTO users (first_name, last_name, email, password_hash, graduation_year, department, phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, password_hash, graduation_year || null, department || null, phone || null]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// POST /auth/login
router.post('/login', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Find user
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, is_admin: user.is_admin, is_pro_admin: user.is_pro_admin },
            process.env.JWT_SECRET || 'super_secret_jwt_key_here_change_in_production',
            { expiresIn: '24h' }
        );

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            message: 'Login successful',
            // Do not send token in body anymore to force frontend to rely on cookies
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                is_admin: user.is_admin,
                is_pro_admin: user.is_pro_admin
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
