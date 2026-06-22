const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Setup email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const router = express.Router();

// GET /auth/me - verify token and return current user info (server-side role check)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, first_name, last_name, email, is_admin, is_pro_admin FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /auth/signup
router.post('/signup', [
    body('first_name').trim().isLength({ min: 1, max: 100 }).withMessage('First name is required'),
    body('last_name').trim().isLength({ min: 1, max: 100 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('graduation_year')
        .isInt({ min: 1950, max: new Date().getFullYear() })
        .withMessage('Valid graduation year is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
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
            [first_name, last_name, email, password_hash, graduation_year, department || null, phone || null]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// POST /auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
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
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
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

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Always return the same response regardless of whether the email exists,
    // so the endpoint cannot be used to enumerate registered accounts.
    const genericResponse = { message: 'If an account exists for that email, a password reset link has been sent.' };

    try {
        if (!email || typeof email !== 'string') {
            return res.json(genericResponse);
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.json(genericResponse);
        }

        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Expiry 1 hour from now
        const expiryDate = new Date(Date.now() + 3600000);

        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, expiryDate, user.id]
        );

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
        const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;

        let message = {
            from: `"FGGC Alumni" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click here to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.`,
            html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>If you did not request this, please ignore this email.</p>`
        };

        await transporter.sendMail(message);

        res.json(genericResponse);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error processing request' });
    }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ message: 'A valid token and a password of at least 6 characters are required' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
            [email, token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        const user = users[0];
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await pool.execute(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [password_hash, user.id]
        );

        res.json({ message: 'Password has been successfully changed! You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error processing request' });
    }
});

module.exports = router;
