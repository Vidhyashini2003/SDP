
const db = require('./config/db');

async function forceDrop() {
    let connection;
    try {
        connection = await db.getConnection();
        const dbName = process.env.DB_NAME || 'hotelmanagement'; // fallback

        // 1. Find FKs
        const [fks] = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Driver' AND COLUMN_NAME = 'vehicle_id' AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [dbName]);

        for (const fk of fks) {
            console.log(`Dropping FK: ${fk.CONSTRAINT_NAME}`);
            await connection.query(`ALTER TABLE Driver DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        }

        // 2. Find Indexes (that are not FKs, but usually dropping column drops index too, unless strictly key)
        // Just try dropping field now.

        console.log('Dropping vehicle_id...');
        await connection.query('ALTER TABLE Driver DROP COLUMN vehicle_id');
        console.log('Success.');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}
forceDrop();
