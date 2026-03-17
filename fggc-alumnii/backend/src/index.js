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
// Serve static files from uploads folder for gallery
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/events', eventsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/admin/finance', adminFinanceRoutes);
app.use('/admin', adminRoutes);
app.use('/gallery', galleryRoutes);

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
