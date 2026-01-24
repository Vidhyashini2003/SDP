const db = require('../config/db');

async function checkSchema() {
    try {
        console.log('--- Checking Column Nullability ---');

        const tables = ['Receptionist', 'KitchenStaff', 'Driver'];
        const phoneColumns = ['receptionist_phone', 'staff_phone', 'driver_phone'];

        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const col = phoneColumns[i];
            const [rows] = await db.query(`
                SELECT IS_NULLABLE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'hotelmanagement' 
                AND TABLE_NAME = ? 
                AND COLUMN_NAME = ?
            `, [table, col]);

            if (rows.length > 0) {
                console.log(`${table}.${col} IS_NULLABLE: ${rows[0].IS_NULLABLE}`);
            } else {
                console.log(`${table}.${col} not found.`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
