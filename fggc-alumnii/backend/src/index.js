require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Required Route Files
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const paymentsRoutes = require('./routes/payments');
const adminFinanceRoutes = require('./routes/adminFinance');
const galleryRoutes = require('./routes/gallery');
const newsRoutes = require('./routes/news'); // Added News Routes

const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder', 'ngrok-skip-browser-warning']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../../frontend')));
// Serve uploaded files with explicit cross-origin headers
app.get('/uploads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename); // prevent path traversal
    const filePath = path.join(__dirname, 'uploads', safeName);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(filePath, (err) => {
        if (err) res.status(404).json({ message: 'File not found' });
    });
});

// Routes
app.use('/auth', authRoutes);
app.use('/events', eventsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/admin/finance', adminFinanceRoutes);
app.use('/admin', adminRoutes);
app.use('/gallery', galleryRoutes);
app.use('/news', newsRoutes); // Added News Route

// Database check route
const pool = require('./db');
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'OK', database: 'Connected' });
    } catch (error) {
        res.status(500).json({ status: 'Error', database: 'Disconnected' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
