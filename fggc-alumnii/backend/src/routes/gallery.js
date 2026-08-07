const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const proAdminMiddleware = require('../middleware/proAdminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();

const uploadsDir = require('../uploadsDir');
require('fs').mkdirSync(uploadsDir, { recursive: true });

// heic/heif included because that is what iPhones shoot by default. The
// dashboard re-encodes them to JPEG before upload, but accept them so a file
// that slips through raw is stored rather than killing the request.
const ALLOWED_GALLERY = /^(jpg|jpeg|png|gif|webp|heic|heif|mp4|webm|mov|m4v|ogg)$/i;
const VIDEO_GALLERY = /^(mp4|webm|mov|m4v|ogg)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // iOS names every photo picked from the library "image.jpg", and files
        // in one batch land in the same millisecond — Date.now() alone collides
        // and the uploads overwrite each other. Add random bytes.
        const suffix = crypto.randomBytes(6).toString('hex');
        cb(null, `${Date.now()}-${suffix}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1);
        if (ALLOWED_GALLERY.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} not allowed. Use jpg, png, gif, webp, heic, mp4, webm, mov, m4v, or ogg.`));
    }
});

// GET /gallery — returns media with url and type so frontend can render appropriately
router.get('/', async (req, res) => {
    try {
        const [images] = await pool.execute('SELECT * FROM gallery ORDER BY uploaded_at DESC');

        const mediaWithData = images.map(media => {
            const safeName = path.basename(media.filename);
            const ext = path.extname(safeName).slice(1).toLowerCase();
            const isVideo = VIDEO_GALLERY.test(ext);
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

// POST /gallery — accepts one or many files. Files and captions are
// index-aligned: captions[i] belongs to files[i].
const MAX_GALLERY_BATCH = 20;

// When multer aborts (bad type, file too big) it stops reading the socket while
// the client is often still streaming megabytes. Replying right then resets the
// connection, and the browser reports a bare network failure — on iOS Safari,
// "TypeError: Load failed" — instead of the reason. Drain what's left first so
// the JSON message actually reaches the client.
const respondAfterDraining = (req, res, status, body) => {
    const send = () => { if (!res.headersSent) res.status(status).json(body); };
    if (req.readableEnded || req.complete) return send();

    const timer = setTimeout(send, 5000); // don't wait forever on a stalled upload
    req.on('end', () => { clearTimeout(timer); send(); });
    req.on('error', () => { clearTimeout(timer); send(); });
    req.unpipe();
    req.resume();
};

router.post('/', authMiddleware, proAdminMiddleware, (req, res) => {
    upload.array('media', MAX_GALLERY_BATCH)(req, res, async (err) => {
        if (err) return respondAfterDraining(req, res, 400, { message: err.message });

        const files = req.files || [];
        if (files.length === 0) return res.status(400).json({ message: 'Media file is required' });

        // multer gives a string for one `captions` field, an array for several.
        const rawCaptions = req.body.captions;
        const captions = Array.isArray(rawCaptions)
            ? rawCaptions
            : (rawCaptions == null ? [] : [rawCaptions]);

        try {
            for (let i = 0; i < files.length; i++) {
                const filename = `/uploads/${files[i].filename}`;
                await pool.execute(
                    'INSERT INTO gallery (filename, caption) VALUES (?, ?)',
                    [filename, captions[i] || '']
                );
            }
            res.status(201).json({ message: 'Media added successfully', inserted: files.length });
        } catch(dbErr) {
            console.error(dbErr);
            res.status(500).json({ message: 'Server error uploading media' });
        }
    });
});

module.exports = router;
