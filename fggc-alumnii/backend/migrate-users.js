require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Starting member payment columns migration...');
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'fggc_alumnii',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Add payment_status column if it does not exist
        try {
            await pool.query("ALTER TABLE users ADD COLUMN payment_status ENUM('Paid', 'Pending', 'Overdue') DEFAULT 'Pending'");
            console.log('Successfully added `payment_status` column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('`payment_status` already exists, skipping.');
            } else {
                throw e;
            }
        }

        // Add last_payment_date column if it does not exist
        try {
            await pool.query("ALTER TABLE users ADD COLUMN last_payment_date DATETIME");
            console.log('Successfully added `last_payment_date` column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('`last_payment_date` already exists, skipping.');
            } else {
                throw e;
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
