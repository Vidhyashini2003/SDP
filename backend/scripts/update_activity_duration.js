const db = require('../config/db');

async function updateActivityDuration() {
    try {
        const [result] = await db.query(
            "UPDATE activity SET activity_duration = '1 hour' WHERE activity_name LIKE '%Koneswaram Temple%'"
        );
        console.log('Update result:', result);
        process.exit(0);
    } catch (error) {
        console.error('Error updating activity:', error);
        process.exit(1);
    }
}

updateActivityDuration();
