const db = require('../config/db');

async function removeAdminTable() {
    const connection = await db.getConnection();
    try {
        console.log('🔄 Starting Admin Table Removal...');
        await connection.beginTransaction();

        // 1. Update Report Table
        console.log('Updating Report table...');

        // Add user_id column
        // Check if exists
        const [cols] = await connection.query("SHOW COLUMNS FROM Report LIKE 'user_id'");
        if (cols.length === 0) {
            await connection.query("ALTER TABLE Report ADD COLUMN user_id INT");
            await connection.query("ALTER TABLE Report ADD FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE");
        }

        // Migrate admin_id -> user_id
        // We need to join Report with Admin to get the user_id
        await connection.query(`
            UPDATE Report r
            JOIN Admin a ON r.admin_id = a.admin_id
            SET r.user_id = a.user_id
        `);

        // Now valid to have user_id.
        // We can drop admin_id. But first we must drop the foreign key if it exists?
        // Usually constraints have names. Let's try dropping the column, MySQL usually complains if FK exists.
        // We'll inspect constraints first.
        const [constraints] = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'Report' AND COLUMN_NAME = 'admin_id'
        `);

        for (const c of constraints) {
            console.log(`Dropping constraint ${c.CONSTRAINT_NAME}...`);
            // This might fail if constraint name is PRIMARY but it's not.
            if (c.CONSTRAINT_NAME !== 'PRIMARY') {
                await connection.query(`ALTER TABLE Report DROP FOREIGN KEY ${c.CONSTRAINT_NAME}`);
            }
        }

        // Now drop the column
        // We might need to drop index too if one was created for the FK automatically
        try {
            await connection.query("ALTER TABLE Report DROP COLUMN admin_id");
        } catch (e) {
            console.log("Warning: Could not drop admin_id column (might handle manually or already done): " + e.message);
        }

        // 2. Drop Admin Table
        console.log('Dropping Admin table...');
        await connection.query("DROP TABLE IF EXISTS Admin");

        await connection.commit();
        console.log('✅ Admin Table Removal Successful!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Removal Failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

removeAdminTable();
