
const db = require('./config/db');

async function updateTimes() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        console.log("Updating activity times to '9:00 AM - 6:00 PM'...");
        const [result] = await connection.query(
            "UPDATE activity SET activity_time = '9:00 AM - 6:00 PM'"
        );

        console.log(`Updated ${result.affectedRows} activities.`);

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

updateTimes();
