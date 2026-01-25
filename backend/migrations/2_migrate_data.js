const db = require('../config/db');

async function migrateData() {
    const connection = await db.getConnection();
    try {
        console.log('🔄 Starting Data Migration...');
        await connection.beginTransaction();

        const mappings = [
            {
                table: 'Admin',
                role: 'admin',
                idCol: 'admin_id',
                nameCol: 'admin_name',
                emailCol: 'admin_email',
                phoneCol: 'admin_phone',
                passCol: 'admin_password'
            },
            {
                table: 'Receptionist',
                role: 'receptionist',
                idCol: 'receptionist_id',
                nameCol: 'receptionist_name',
                emailCol: 'receptionist_email',
                phoneCol: 'receptionist_phone',
                passCol: 'receptionist_password'
            },
            {
                table: 'Driver',
                role: 'driver',
                idCol: 'driver_id',
                nameCol: 'driver_name',
                emailCol: 'driver_email',
                phoneCol: 'driver_phone',
                passCol: 'driver_password'
            },
            {
                table: 'KitchenStaff',
                role: 'kitchen',
                idCol: 'staff_id',
                nameCol: 'staff_name',
                emailCol: 'staff_email',
                phoneCol: 'staff_phone',
                passCol: 'staff_password'
            },
            {
                table: 'Guest',
                role: 'guest',
                idCol: 'guest_id',
                nameCol: 'guest_name',
                emailCol: 'guest_email',
                phoneCol: 'guest_phone',
                passCol: 'guest_password'
            }
        ];

        for (const map of mappings) {
            console.log(`Processing ${map.table}...`);
            const [rows] = await connection.query(`SELECT * FROM ${map.table}`);

            for (const row of rows) {
                // Check if already migrated
                if (row.user_id) continue;

                // Check if email already in Users (to avoid dups if run multiple times or if email shared across roles - distinct roles should have distinct emails usually, but if not, we fail)
                const [existing] = await connection.query('SELECT user_id FROM Users WHERE email = ?', [row[map.emailCol]]);

                let userId;
                if (existing.length > 0) {
                    console.log(`  - Email ${row[map.emailCol]} already in Users (ID: ${existing[0].user_id}). Linking...`);
                    userId = existing[0].user_id;
                    // Note: If a user has two roles with same email, they will share the User record. 
                    // But our User table has 'role' column which is single value. 
                    // This implies simplified model: One email = One Main Role. 
                    // If we encounter duplicate email with DIFFERENT role, we might have issue.
                    // For now, assume unique emails across system or valid override.
                } else {
                    const [res] = await connection.query(
                        `INSERT INTO Users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
                        [row[map.nameCol], row[map.emailCol], row[map.phoneCol], row[map.passCol], map.role]
                    );
                    userId = res.insertId;
                }

                // Update role table
                await connection.query(`UPDATE ${map.table} SET user_id = ? WHERE ${map.idCol} = ?`, [userId, row[map.idCol]]);
            }
            console.log(`  > ${map.table} done.`);
        }

        await connection.commit();
        console.log('✅ Data Migration Successful!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Data Migration Failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

migrateData();
