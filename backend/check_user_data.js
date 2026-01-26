
const db = require('./config/db');

async function checkUser() {
    try {
        const connection = await db.getConnection();
        console.log('Connected.');

        const [users] = await connection.query('SELECT * FROM Users WHERE email = ?', ['xasica6652@1200b.com']);
        if (users.length === 0) {
            console.log('User not found.');
        } else {
            console.log('User:', users[0]);
            const [recep] = await connection.query('SELECT * FROM Receptionist WHERE user_id = ?', [users[0].user_id]);
            console.log('Receptionist Data:', recep[0]);
        }

        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkUser();
