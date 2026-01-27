const db = require('./config/db');

async function checkDriver() {
    const email = 'driver01@gmail.com';
    try {
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        console.log('User record:', users);

        if (users.length > 0) {
            const user = users[0];
            const [drivers] = await db.query('SELECT * FROM Driver WHERE user_id = ?', [user.user_id]);
            console.log('Driver record:', drivers);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkDriver();
