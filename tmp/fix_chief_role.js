const mysql = require('mysql2/promise');

async function migrate() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: 'Kayal2003',
        port: 3308,
        database: 'hotelmanagement'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to database.');

        // 1. Update existing users with role 'kitchen' to 'chief'
        const [result] = await connection.execute(
            "UPDATE Users SET role = 'chief' WHERE role = 'kitchen'"
        );
        console.log(`Updated ${result.affectedRows} users from 'kitchen' to 'chief'.`);

        // 2. Check current status of kitstaff01
        const [rows] = await connection.execute(
            "SELECT email, role FROM Users WHERE email = 'kitstaff01@gmail.com'"
        );
        console.log('User status:', rows);

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
