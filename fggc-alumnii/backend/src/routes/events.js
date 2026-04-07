const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads/');
require('fs').mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const proAdminMiddleware = (req, res, next) => {
    if (req.user && (req.user.is_admin || req.user.is_pro_admin)) return next();
    return res.status(403).json({ message: 'Access denied: Pro Admin role required' });
};

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

// POST /events
router.post('/', authMiddleware, proAdminMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, event_date, location } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!title || !event_date) return res.status(400).json({ message: 'Title and event_date are required' });

    try {
        const [result] = await pool.execute(
            'INSERT INTO events (title, description, event_date, location, image) VALUES (?, ?, ?, ?, ?)',
            [title, description || null, event_date, location || null, imagePath]
        );
        res.status(201).json({ message: 'Event added successfully', id: result.insertId });
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server error adding event' });
    }
});

module.exports = router;
