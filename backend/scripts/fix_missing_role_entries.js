
const db = require('../config/db');

async function fixMissingRoleEntries() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        // 1. Fix Drivers
        console.log("Checking for Drivers...");
        const [missingDrivers] = await connection.query(`
            SELECT u.user_id, u.name 
            FROM Users u 
            LEFT JOIN Driver d ON u.user_id = d.user_id 
            WHERE u.role = 'driver' AND d.driver_id IS NULL
        `);

        if (missingDrivers.length > 0) {
            console.log(`Found ${missingDrivers.length} missing drivers. Fixing...`);
            for (const user of missingDrivers) {
                console.log(`Creating Driver entry for ${user.name} (ID: ${user.user_id})...`);
                await connection.query("INSERT INTO Driver (user_id) VALUES (?)", [user.user_id]);
            }
        } else {
            console.log("All drivers have entries.");
        }

        // 2. Fix Receptionists
        console.log("Checking for Receptionists...");
        const [missingReceps] = await connection.query(`
            SELECT u.user_id, u.name 
            FROM Users u 
            LEFT JOIN Receptionist r ON u.user_id = r.user_id 
            WHERE u.role = 'receptionist' AND r.receptionist_id IS NULL
        `);

        if (missingReceps.length > 0) {
            console.log(`Found ${missingReceps.length} missing receptionists. Fixing...`);
            for (const user of missingReceps) {
                console.log(`Creating Receptionist entry for ${user.name} (ID: ${user.user_id})...`);
                await connection.query("INSERT INTO Receptionist (user_id) VALUES (?)", [user.user_id]);
            }
        } else {
            console.log("All receptionists have entries.");
        }

        // 3. Fix Kitchen Staff
        console.log("Checking for Kitchen Staff...");
        const [missingKitchen] = await connection.query(`
               SELECT u.user_id, u.name 
               FROM Users u 
               LEFT JOIN KitchenStaff k ON u.user_id = k.user_id 
               WHERE u.role = 'kitchen' AND k.staff_id IS NULL
           `);

        if (missingKitchen.length > 0) {
            console.log(`Found ${missingKitchen.length} missing kitchen staff. Fixing...`);
            for (const user of missingKitchen) {
                console.log(`Creating Kitchen entry for ${user.name} (ID: ${user.user_id})...`);
                await connection.query("INSERT INTO KitchenStaff (user_id) VALUES (?)", [user.user_id]);
            }
        } else {
            console.log("All kitchen staff have entries.");
        }

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

fixMissingRoleEntries();
