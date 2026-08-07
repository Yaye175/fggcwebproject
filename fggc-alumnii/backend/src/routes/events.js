const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const proAdminMiddleware = require('../middleware/proAdminMiddleware');
const multer = require('multer');
const path = require('path');
const { respondAfterDraining, uniqueFilename } = require('../respondAfterDraining');
const router = express.Router();

const uploadsDir = require('../uploadsDir');
require('fs').mkdirSync(uploadsDir, { recursive: true });

// heic/heif included because that is what iPhones shoot by default. The
// dashboard re-encodes them to JPEG before upload; accepting them here means a
// file that slips through raw is stored rather than aborting the request.
const ALLOWED_EVENTS = /^(jpg|jpeg|png|gif|webp|heic|heif|mp4|webm|mov|m4v|ogg)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname))
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1);
        if (ALLOWED_EVENTS.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} not allowed. Use jpg, png, gif, webp, heic, mp4, webm, mov, m4v, or ogg.`));
    }
});

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
router.post('/', authMiddleware, proAdminMiddleware, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) return respondAfterDraining(req, res, 400, { message: err.message });

        const { title, description, event_date, location } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!title || !event_date) return res.status(400).json({ message: 'Title and event_date are required' });

        try {
            const [result] = await pool.execute(
                'INSERT INTO events (title, description, event_date, location, image) VALUES (?, ?, ?, ?, ?)',
                [title, description || null, event_date, location || null, imagePath]
            );
            res.status(201).json({ message: 'Event added successfully', id: result.insertId });
        } catch(dbErr) {
            console.error(dbErr);
            res.status(500).json({ message: 'Server error adding event' });
        }
    });
});

module.exports = router;
