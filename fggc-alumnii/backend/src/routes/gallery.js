const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// GET /gallery — returns images with embedded base64 data URLs so they work from any origin
router.get('/', async (req, res) => {
    try {
        const [images] = await pool.execute('SELECT * FROM gallery ORDER BY uploaded_at DESC');

        const imagesWithData = images.map(img => {
            try {
                const safeName = path.basename(img.filename); // strip any leading /uploads/
                const filePath = path.join(uploadsDir, safeName);
                const fileBuffer = fs.readFileSync(filePath);
                const ext = path.extname(safeName).slice(1).toLowerCase();
                const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                           : ext === 'png'  ? 'image/png'
                           : ext === 'gif'  ? 'image/gif'
                           : ext === 'webp' ? 'image/webp'
                           : 'image/jpeg';
                return { ...img, dataUrl: `data:${mime};base64,${fileBuffer.toString('base64')}` };
            } catch {
                return { ...img, dataUrl: null };
            }
        });

        res.json(imagesWithData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching gallery' });
    }
});

// POST /gallery
router.post('/', authMiddleware, proAdminMiddleware, upload.single('image'), async (req, res) => {
    const { caption } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    
    // We only need the filename or relative path
    const filename = `/uploads/${req.file.filename}`;

    try {
        const [result] = await pool.execute(
            'INSERT INTO gallery (filename, caption) VALUES (?, ?)',
            [filename, caption || '']
        );
        res.status(201).json({ message: 'Image added successfully', id: result.insertId });
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'Server error uploading image' });
    }
});

module.exports = router;
