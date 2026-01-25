const db = require('../config/db');

async function updateSchema() {
    const connection = await db.getConnection();
    try {
        console.log('🔄 Starting Secure Auth Schema Update...');
        await connection.beginTransaction();

        // 1. Create activation_tokens table
        console.log('Creating activation_tokens table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activation_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            )
        `);

        // 2. Add account_status to Users table
        console.log('Updating Users table...');
        const [userCols] = await connection.query("SHOW COLUMNS FROM Users LIKE 'account_status'");
        if (userCols.length === 0) {
            await connection.query("ALTER TABLE Users ADD COLUMN account_status ENUM('Active', 'Inactive') DEFAULT 'Inactive'");
            // Set existing users to Active
            await connection.query("UPDATE Users SET account_status = 'Active'");
        }

        // 3. Ensure Guest table has card columns (as per user "Existing Tables" definition)
        // guest(guest_id, guest_address, nationality, card_number, card_holder_name, card_expiry, card_cvv, user_id)
        console.log('Verifying Guest table schema...');
        const cardCols = ['card_number', 'card_holder_name', 'card_expiry', 'card_cvv'];
        for (const col of cardCols) {
            const [c] = await connection.query(`SHOW COLUMNS FROM Guest LIKE '${col}'`);
            if (c.length === 0) {
                console.log(`Adding ${col} to Guest table...`);
                // Use safe types. VARCHAR(255) is fine for simplicity here.
                await connection.query(`ALTER TABLE Guest ADD COLUMN ${col} VARCHAR(255)`);
            }
        }

        await connection.commit();
        console.log('✅ Schema Update Successful!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Schema Update Failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

updateSchema();
