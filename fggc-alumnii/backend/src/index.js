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

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder for gallery
app.use('/uploads', express.static('src/uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/events', eventsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/admin/finance', adminFinanceRoutes);
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
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
