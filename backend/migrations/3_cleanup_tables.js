const db = require('../config/db');

async function cleanupTables() {
    const connection = await db.getConnection();
    try {
        console.log('🔄 Starting Table Cleanup...');
        await connection.beginTransaction();

        const tables = [
            { name: 'Admin', prefix: 'admin_' },
            { name: 'Receptionist', prefix: 'receptionist_' },
            { name: 'Driver', prefix: 'driver_' },
            { name: 'KitchenStaff', prefix: 'staff_' },
            { name: 'Guest', prefix: 'guest_' }
        ];

        for (const t of tables) {
            console.log(`Cleaning up ${t.name}...`);
            // Drop columns: name, email, phone, password
            // Construct DROP statements based on prefix
            // Note: Some tables might not have phone? Standard schema had them all mostly.
            // Admin: admin_name, admin_email, admin_phone, admin_password
            // Receptionist: receptionist_name, receptionist_email, receptionist_phone, receptionist_password
            // Driver: driver_name, driver_email, driver_phone, driver_password
            // KitchenStaff: staff_name, staff_email, staff_phone, staff_password
            // Guest: guest_name, guest_email, guest_phone, guest_password

            // Check specific columns if needed, but dropping IF EXISTS is not supported in standard MySQL ALTER DROP usually, 
            // so we should check or just try dropping. Schema is known.

            const queries = [
                `ALTER TABLE ${t.name} DROP COLUMN ${t.prefix}name`,
                `ALTER TABLE ${t.name} DROP COLUMN ${t.prefix}email`,
                `ALTER TABLE ${t.name} DROP COLUMN ${t.prefix}password`,
                `ALTER TABLE ${t.name} DROP COLUMN ${t.prefix}phone`
            ];

            for (const q of queries) {
                try {
                    await connection.query(q);
                    console.log(`  - Executed: ${q}`);
                } catch (e) {
                    console.log(`  - Failed (maybe didn't exist?): ${q} - ${e.sqlMessage}`);
                }
            }
        }

        await connection.commit();
        console.log('✅ Table Cleanup Successful!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Table Cleanup Failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

cleanupTables();
