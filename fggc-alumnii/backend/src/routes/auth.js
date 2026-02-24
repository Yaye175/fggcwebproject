const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
            { id: user.id, email: user.email, is_admin: user.is_admin },
            process.env.JWT_SECRET || 'super_secret_jwt_key_here_change_in_production',
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
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
