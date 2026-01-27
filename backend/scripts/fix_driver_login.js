
const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function fixDriverLogin() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        const EMAIL = 'driver01@example.com';
        // Assuming email is driver01@example.com based on name 'driver01'.
        // If not, I'll search by name.

        console.log(`Searching for user 'driver01'...`);
        const [users] = await connection.query("SELECT * FROM Users WHERE name = 'driver01' OR email = 'driver01@example.com'");

        if (users.length === 0) {
            console.log("User 'driver01' not found.");
            return;
        }

        const user = users[0];
        console.log(`Found User: ID=${user.user_id}, Name=${user.name}, Role=${user.role}, Status=${user.account_status}`);

        await connection.beginTransaction();

        // 1. Activate and Set Password
        console.log("Resetting password to 'password123' and activating account...");
        const hashedPassword = await bcrypt.hash('password123', 10);
        await connection.query(
            "UPDATE Users SET password = ?, account_status = 'Active' WHERE user_id = ?",
            [hashedPassword, user.user_id]
        );

        // 2. Ensure Driver Entry and ID=5
        // First check current driver entry
        const [drivers] = await connection.query("SELECT * FROM Driver WHERE user_id = ?", [user.user_id]);
        let currentDriverId = null;

        if (drivers.length === 0) {
            console.log("No Driver entry found. Creating one...");
            const [res] = await connection.query("INSERT INTO Driver (user_id) VALUES (?)", [user.user_id]);
            currentDriverId = res.insertId;
            console.log(`Created Driver entry with ID ${currentDriverId}`);
        } else {
            currentDriverId = drivers[0].driver_id;
            console.log(`Existing Driver ID is ${currentDriverId}`);
        }

        // 3. Update to ID 5 if needed
        if (currentDriverId !== 5) {
            console.log(`Attempting to change Driver ID from ${currentDriverId} to 5...`);

            // Check if 5 is taken
            const [conflict] = await connection.query("SELECT * FROM Driver WHERE driver_id = 5");
            if (conflict.length > 0) {
                console.log("WARNING: Driver ID 5 is already taken by another user. Cannot swap.");
            } else {
                await connection.query("SET FOREIGN_KEY_CHECKS=0");
                await connection.query("UPDATE Driver SET driver_id = 5 WHERE driver_id = ?", [currentDriverId]);
                await connection.query("UPDATE vehiclebooking SET driver_id = 5 WHERE driver_id = ?", [currentDriverId]);
                await connection.query("SET FOREIGN_KEY_CHECKS=1");
                console.log("Driver ID updated to 5.");
            }
        } else {
            console.log("Driver ID is already 5.");
        }

        await connection.commit();
        console.log("Fix complete.");

    } catch (error) {
        await connection.rollback();
        console.error('Fix failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

fixDriverLogin();
