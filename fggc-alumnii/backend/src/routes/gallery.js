const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const proAdminMiddleware = require('../middleware/proAdminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads/');
require('fs').mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_GALLERY = /^(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v|ogg)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1);
        if (ALLOWED_GALLERY.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} not allowed. Use jpg, png, gif, webp, mp4, webm, mov, m4v, or ogg.`));
    }
});

// GET /gallery — returns media with url and type so frontend can render appropriately
router.get('/', async (req, res) => {
    try {
        const [images] = await pool.execute('SELECT * FROM gallery ORDER BY uploaded_at DESC');

        const mediaWithData = images.map(media => {
            const safeName = path.basename(media.filename);
            const ext = path.extname(safeName).slice(1).toLowerCase();
            const isVideo = ALLOWED_GALLERY.test(ext) && /^(mp4|webm|mov|m4v|ogg)$/.test(ext);
            return {
                ...media,
                type: isVideo ? 'video' : 'image',
                url: `/uploads/${safeName}`
            };
        });

        res.json(mediaWithData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching gallery' });
    }
});

// POST /gallery
router.post('/', authMiddleware, proAdminMiddleware, (req, res) => {
    upload.single('media')(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });

        const { caption } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Media file is required' });

        const filename = `/uploads/${req.file.filename}`;

        try {
            const [result] = await pool.execute(
                'INSERT INTO gallery (filename, caption) VALUES (?, ?)',
                [filename, caption || '']
            );
            res.status(201).json({ message: 'Media added successfully', id: result.insertId });
        } catch(dbErr) {
            console.error(dbErr);
            res.status(500).json({ message: 'Server error uploading media' });
        }
    });
});

module.exports = router;
