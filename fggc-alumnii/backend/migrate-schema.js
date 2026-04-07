const pool = require('./src/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Add is_pro_admin column
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN is_pro_admin BOOLEAN DEFAULT FALSE;');
            console.log('Added is_pro_admin column to users table.');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('is_pro_admin column already exists.');
            } else {
                throw e;
            }
        }

        // Create news table
        const createNewsTable = `
        CREATE TABLE IF NOT EXISTS news (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image VARCHAR(255),
            type ENUM('news', 'minutes', 'story') DEFAULT 'news',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );`;
        await pool.execute(createNewsTable);
        console.log('Created news table.');
        
        // Add document column to news table
        try {
            await pool.execute('ALTER TABLE news ADD COLUMN document VARCHAR(255);');
            console.log('Added document column to news table.');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('document column already exists.');
            } else {
                throw e;
            }
        }

        console.log('Migration completed successfully.');
    } catch(err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
