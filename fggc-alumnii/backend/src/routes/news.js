const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Accept both image and document fields
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedImage = /jpeg|jpg|png|gif|webp/i;
        const allowedDoc   = /pdf|doc|docx|txt/i;
        const ext = path.extname(file.originalname).slice(1);
        if (file.fieldname === 'image' && allowedImage.test(ext)) return cb(null, true);
        if (file.fieldname === 'document' && allowedDoc.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} is not allowed for field "${file.fieldname}"`));
    }
}).fields([
    { name: 'image',    maxCount: 1 },
    { name: 'document', maxCount: 1 }
]);

const proAdminMiddleware = (req, res, next) => {
    if (req.user && (req.user.is_admin || req.user.is_pro_admin)) return next();
    return res.status(403).json({ message: 'Access denied: Pro Admin role required' });
};

// Helper — read a file and return a base64 data URL
function toDataUrl(filePath) {
    try {
        const buf = fs.readFileSync(filePath);
        const ext = path.extname(filePath).slice(1).toLowerCase();
        const mime =
            ext === 'pdf'  ? 'application/pdf' :
            ext === 'doc'  ? 'application/msword' :
            ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
            ext === 'txt'  ? 'text/plain' :
            ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
            ext === 'png'  ? 'image/png' :
            ext === 'gif'  ? 'image/gif' :
            ext === 'webp' ? 'image/webp' :
            'application/octet-stream';
        return `data:${mime};base64,${buf.toString('base64')}`;
    } catch {
        return null;
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
            if (item.image) {
                result.imageData = toDataUrl(path.join(uploadsDir, path.basename(item.image)));
            }
            if (item.document) {
                const docPath = path.join(uploadsDir, path.basename(item.document));
                result.documentData = toDataUrl(docPath);
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
        if (story.image) {
            story.imageData = toDataUrl(path.join(uploadsDir, path.basename(story.image)));
        }
        res.json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching story' });
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

module.exports = router;
