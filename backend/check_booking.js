const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Kayal2003',
            database: process.env.DB_NAME || 'HotelManagement',
            port: process.env.DB_PORT || 3308
        });

        const [rows] = await connection.query('SELECT * FROM roombooking WHERE rb_id = 5');
        console.log('Room Booking:', JSON.stringify(rows, null, 2));

        const [guests] = await connection.query('SELECT * FROM Guest WHERE guest_id = ?', [rows[0].guest_id]);
        console.log('Guest Record:', JSON.stringify(guests, null, 2));

        const [users] = await connection.query('SELECT * FROM Users WHERE user_id = ?', [guests[0].user_id]);
        console.log('User Record:', JSON.stringify(users, null, 2));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
