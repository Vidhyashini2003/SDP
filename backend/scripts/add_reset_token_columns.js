const db = require('../config/db');

async function addResetColumns() {
    const connection = await db.getConnection();
    try {
        console.log('Adding reset_password_token column...');
        await connection.query(`
            ALTER TABLE Users 
            ADD COLUMN reset_password_token VARCHAR(255) NULL,
            ADD COLUMN reset_password_expires DATETIME NULL;
        `);
        console.log('Columns added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist.');
        } else {
            console.error('Error adding columns:', error);
        }
    } finally {
        connection.release();
        process.exit();
    }
}

addResetColumns();
