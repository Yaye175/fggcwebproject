require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Required Route Files
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const paymentsRoutes = require('./routes/payments');
const adminFinanceRoutes = require('./routes/adminFinance');
const galleryRoutes = require('./routes/gallery');
const newsRoutes = require('./routes/news');
const adminRoutes = require('./routes/admin');

// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS — restrict origin from env variable instead of allowing all origins
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5000';
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder', 'ngrok-skip-browser-warning']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const path = require('path');
// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../../frontend')));
// Serve uploaded files with explicit cross-origin headers
app.get('/uploads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename); // prevent path traversal
    const filePath = path.join(__dirname, 'uploads', safeName);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.sendFile(filePath, (err) => {
        if (err) res.status(404).json({ message: 'File not found' });
    });
});

// Routes — apply rate limiter to auth routes
app.use('/auth', authLimiter, authRoutes);
app.use('/events', eventsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/admin/finance', adminFinanceRoutes);
app.use('/admin', adminRoutes);
app.use('/gallery', galleryRoutes);
app.use('/news', newsRoutes);

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

// Global error handler — prevents stack traces from leaking to clients
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
