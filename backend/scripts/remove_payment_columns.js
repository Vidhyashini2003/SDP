const db = require('../config/db');

async function removePaymentColumns() {
    const connection = await db.getConnection();
    try {
        console.log('🗑️ Removing payment columns from Guest table...');
        await connection.beginTransaction();

        const columns = ['card_number', 'card_holder_name', 'card_expiry', 'card_cvv'];

        for (const col of columns) {
            try {
                // Check if column exists before dropping to avoid errors
                const [cols] = await connection.query(`SHOW COLUMNS FROM Guest LIKE '${col}'`);
                if (cols.length > 0) {
                    console.log(`Dropping ${col}...`);
                    await connection.query(`ALTER TABLE Guest DROP COLUMN ${col}`);
                } else {
                    console.log(`${col} does not exist, skipping.`);
                }
            } catch (err) {
                console.warn(`Error dropping ${col}:`, err.message);
                // Continue even if error (e.g. column doesn't exist)
            }
        }

        await connection.commit();
        console.log('✅ Payment columns removed successfully!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Failed to remove payment columns:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

removePaymentColumns();
