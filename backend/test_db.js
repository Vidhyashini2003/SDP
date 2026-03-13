const db = require('./config/db');

async function test() {
    try {
        const [activities] = await db.query("SELECT * FROM activity LIMIT 1");
        console.log(activities);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
