const db = require('../config/db');

async function makePasswordNullable() {
    const connection = await db.getConnection();
    try {
        console.log('🔄 Making Users.password nullable...');
        await connection.beginTransaction();

        // Check if column is already nullable? 
        // Just verify/modify
        await connection.query("ALTER TABLE Users MODIFY password VARCHAR(255) NULL");

        await connection.commit();
        console.log('✅ Users.password is now NULLABLE.');
        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

makePasswordNullable();
