const db = require('../config/db');

async function createNotificationsTable() {
    const connection = await db.getConnection();
    try {
        console.log('🔔 Creating Notifications Table...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('Booking', 'Damage', 'System', 'Alert') DEFAULT 'System',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Notifications Table Created Successfully!');

        // Optional: Insert a test notification for existing users if needed
        // await connection.query("INSERT INTO notifications (user_id, title, message) SELECT user_id, 'Welcome', 'Welcome to the new notification system!' FROM Users LIMIT 1");

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create notifications table:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

createNotificationsTable();
