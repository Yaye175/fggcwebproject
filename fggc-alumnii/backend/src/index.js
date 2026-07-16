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
// Railway injects PORT at runtime; fall back to 8080 to match Railway's
// default target port so the edge proxy routes correctly if PORT is unset.
const PORT = process.env.PORT || 8080;

// Behind a TLS-terminating reverse proxy (nginx/Caddy/Render/etc.): trust the
// first proxy hop so req.ip / rate limiting / secure cookies work correctly.
app.set('trust proxy', 1);

// Canonical host: 301 the bare apex to the www subdomain so search engines and
// social scrapers converge on a single canonical origin. Guarded to the exact
// production apex, so localhost, Railway-internal hosts and health checks are
// left untouched.
app.use((req, res, next) => {
    if (req.headers.host === 'fggcgbokoogaabj.com') {
        return res.redirect(301, `https://www.fggcgbokoogaabj.com${req.originalUrl}`);
    }
    next();
});

// Security & Middlewares.
// CSP keeps 'unsafe-inline' because pages still use inline <script>/style=
// (e.g. the theme flash-prevention snippet). It still blocks external script
// loads, object/embed, framing and base-tag hijacking. Output is also escaped
// at every innerHTML sink, which is the primary XSS defense.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            mediaSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"]
        }
    }
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

// General limiter for the rest of the API — abuse/DoS prevention set high
// enough not to hinder normal browsing (a page makes several calls). Static
// files and /uploads are deliberately not limited so pages/galleries load freely.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
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
    const filePath = path.join(require('./uploadsDir'), safeName);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.sendFile(filePath, (err) => {
        if (err) res.status(404).json({ message: 'File not found' });
    });
});

// Routes — apply rate limiter to auth routes
app.use('/auth', authLimiter, authRoutes);
app.use('/events', apiLimiter, eventsRoutes);
app.use('/payments', apiLimiter, paymentsRoutes);
app.use('/admin/finance', apiLimiter, adminFinanceRoutes);
app.use('/admin', apiLimiter, adminRoutes);
app.use('/gallery', apiLimiter, galleryRoutes);
app.use('/news', apiLimiter, newsRoutes);

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
