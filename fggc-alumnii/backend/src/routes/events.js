const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /events
router.get('/', async (req, res) => {
    try {
        const [events] = await pool.execute('SELECT * FROM events ORDER BY event_date ASC');
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching events' });
    }
});

module.exports = router;
