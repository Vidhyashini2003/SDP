const db = require('../config/db');

async function createUsersTable() {
    const connection = await db.getConnection();
    try {
        console.log('🔄 Starting Schema Migration...');
        await connection.beginTransaction();

        // 1. Create Users Table
        console.log('Creating Users table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(15),
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'receptionist', 'driver', 'kitchen', 'guest') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Add user_id to role tables
        const tables = ['Guest', 'Admin', 'Receptionist', 'Driver', 'KitchenStaff'];

        for (const table of tables) {
            console.log(`Adding user_id to ${table} table...`);

            // Check if column exists first (to make script idempotent)
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'user_id'`);
            if (columns.length === 0) {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN user_id INT`);
                await connection.query(`ALTER TABLE ${table} ADD FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE`);
            } else {
                console.log(`  - user_id already exists in ${table}, skipping.`);
            }
        }

        await connection.commit();
        console.log('✅ Schema Migration Successful!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Schema Migration Failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

createUsersTable();
