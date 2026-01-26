const db = require('../config/db');

async function updateActivityName() {
    try {
        const [result] = await db.query(
            "UPDATE activity SET activity_name = 'Swami Rock Visit & View Point Visit' WHERE activity_name LIKE '%Koneswaram Temple%'"
        );
        console.log('Update result:', result);
        process.exit(0);
    } catch (error) {
        console.error('Error updating activity name:', error);
        process.exit(1);
    }
}

updateActivityName();
