const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /gallery
router.get('/', async (req, res) => {
    try {
        const [images] = await pool.execute('SELECT * FROM gallery ORDER BY uploaded_at DESC');
        res.json(images);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching gallery' });
    }
});

module.exports = router;
