const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const proAdminMiddleware = require('../middleware/proAdminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = require('../uploadsDir');
fs.mkdirSync(uploadsDir, { recursive: true });

// Best-effort removal of a file referenced as "/uploads/<name>". Never throws
// (missing file, etc.) so a record delete still succeeds even if the file is
// already gone.
function safeUnlink(storedPath) {
    if (!storedPath) return;
    try {
        fs.unlinkSync(path.join(uploadsDir, path.basename(storedPath)));
    } catch (e) { /* file already gone — ignore */ }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
});

const ALLOWED_NEWS_VIDEO = /^(mp4|webm|mov|m4v|ogg)$/i;

// Accept both image and document fields
const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedImage = /^(jpeg|jpg|png|gif|webp)$/i;
        const allowedDoc   = /^(pdf|doc|docx|txt)$/i;
        const ext = path.extname(file.originalname).slice(1);
        if (file.fieldname === 'image' && (allowedImage.test(ext) || ALLOWED_NEWS_VIDEO.test(ext))) return cb(null, true);
        if (file.fieldname === 'document' && allowedDoc.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} is not allowed for field "${file.fieldname}"`));
    }
}).fields([
    { name: 'image',    maxCount: 1 },
    { name: 'document', maxCount: 1 }
]);

// Attach media as URLs served by the /uploads route. Files are streamed on
// demand by the browser instead of being read synchronously and base64-inlined
// into every /news response (which blocked the event loop on large files).
function enrichMediaField(obj) {
    if (!obj.image) return;
    const ext = path.extname(obj.image).slice(1).toLowerCase();
    if (ALLOWED_NEWS_VIDEO.test(ext)) {
        obj.videoUrl = obj.image;
    } else {
        obj.imageUrl = obj.image;
    }
}

// GET /news - List news/minutes with embedded file data
router.get('/', async (req, res) => {
    const type = req.query.type || 'news';
    try {
        const [newsItems] = await pool.execute(
            'SELECT * FROM news WHERE type = ? ORDER BY created_at DESC', [type]
        );
        const enriched = newsItems.map(item => {
            const result = { ...item };
            enrichMediaField(result);
            if (item.document) {
                result.documentUrl = item.document;
                result.documentName = path.basename(item.document).replace(/^\d+-/, '');
            }
            return result;
        });
        res.json(enriched);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching news' });
    }
});

// GET /news/latest-story
router.get('/latest-story', async (req, res) => {
    try {
        const [stories] = await pool.execute(
            "SELECT * FROM news WHERE type = 'story' ORDER BY created_at DESC LIMIT 1"
        );
        if (stories.length === 0) return res.json(null);
        const story = stories[0];
        enrichMediaField(story);
        res.json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching story' });
    }
});

// GET /news/document/:id — members-only download of an attached document.
// Documents (meeting minutes etc.) are deliberately NOT served by the public
// /uploads route, so this authenticated endpoint is the only way to fetch one.
// Any logged-in member may download; no pro-admin role required.
router.get('/document/:id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT document FROM news WHERE id = ?', [req.params.id]);
        if (rows.length === 0 || !rows[0].document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        const safeName = path.basename(rows[0].document); // stored as /uploads/<name>
        const filePath = path.join(uploadsDir, safeName);
        const downloadName = safeName.replace(/^\d+-/, ''); // strip the timestamp prefix
        res.download(filePath, downloadName, (err) => {
            if (err && !res.headersSent) res.status(404).json({ message: 'Document not found' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching document' });
    }
});

// Apply auth + proAdmin to write routes
router.use(authMiddleware);
router.use(proAdminMiddleware);

// POST /news
router.post('/', (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });

        const { title, content, type } = req.body;
        const validTypes = ['news', 'minutes', 'story'];
        const newsType = validTypes.includes(type) ? type : 'news';

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const imagePath    = req.files?.image?.[0]    ? `/uploads/${req.files.image[0].filename}`    : null;
        const documentPath = req.files?.document?.[0] ? `/uploads/${req.files.document[0].filename}` : null;

        try {
            const [result] = await pool.execute(
                'INSERT INTO news (title, content, image, document, type) VALUES (?, ?, ?, ?, ?)',
                [title, content, imagePath, documentPath, newsType]
            );
            res.status(201).json({ message: 'Item created successfully', id: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error creating news' });
        }
    });
});

// DELETE /news/:id — remove a news item and its uploaded image/document files.
router.delete('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT image, document FROM news WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'News item not found' });

        await pool.execute('DELETE FROM news WHERE id = ?', [req.params.id]);
        safeUnlink(rows[0].image);
        safeUnlink(rows[0].document);

        res.json({ message: 'News item deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting news' });
    }
});

module.exports = router;
