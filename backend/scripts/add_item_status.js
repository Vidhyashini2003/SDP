const db = require('../config/db');

async function val() {
    try {
        const connection = await db.getConnection();
        console.log('Connected to database');

        try {
            // Check if column exists first to avoid error
            const [columns] = await connection.query("SHOW COLUMNS FROM orderitem LIKE 'item_status'");

            if (columns.length === 0) {
                console.log('Adding item_status column...');
                await connection.query("ALTER TABLE orderitem ADD COLUMN item_status ENUM('Pending', 'Preparing', 'Completed') DEFAULT 'Pending'");
                console.log('Column added successfully.');
            } else {
                console.log('Column item_status already exists.');
            }

        } catch (err) {
            console.error('Error modifying table:', err);
        } finally {
            connection.release();
        }
        process.exit();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

val();
