
const db = require('../config/db');

async function updateDriverId() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        const OLD_ID = 1;
        const NEW_ID = 5;

        console.log(`Attempting to change driver_id from ${OLD_ID} to ${NEW_ID}...`);

        // Check if old exists
        const [oldDriver] = await connection.query("SELECT * FROM Driver WHERE driver_id = ?", [OLD_ID]);
        if (oldDriver.length === 0) {
            console.log(`Driver with ID ${OLD_ID} not found.`);
            return;
        }

        // Check if new exists
        const [newDriver] = await connection.query("SELECT * FROM Driver WHERE driver_id = ?", [NEW_ID]);
        if (newDriver.length > 0) {
            console.log(`Driver with ID ${NEW_ID} already exists. Cannot update.`);
            return;
        }

        await connection.beginTransaction();

        // Disable foreign key checks to allow ID update (or just rely on cascade if set, but this is safer)
        await connection.query("SET FOREIGN_KEY_CHECKS=0");

        // Update Driver
        await connection.query("UPDATE Driver SET driver_id = ? WHERE driver_id = ?", [NEW_ID, OLD_ID]);

        // Update VehicleBookings
        await connection.query("UPDATE vehiclebooking SET driver_id = ? WHERE driver_id = ?", [NEW_ID, OLD_ID]);

        await connection.query("SET FOREIGN_KEY_CHECKS=1");

        await connection.commit();
        console.log(`Successfully changed driver_id from ${OLD_ID} to ${NEW_ID} and updated references.`);

    } catch (error) {
        await connection.rollback();
        console.error('Update failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

updateDriverId();
