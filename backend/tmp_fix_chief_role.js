const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Using existing pool...');

        // 1. Update existing users with role 'kitchen' to 'chief'
        const [result] = await pool.execute(
            "UPDATE Users SET role = 'chief' WHERE role = 'kitchen'"
        );
        console.log(`Updated ${result.affectedRows} users from 'kitchen' to 'chief'.`);

        // 2. Check current status of kitstaff01
        const [rows] = await pool.execute(
            "SELECT email, role FROM Users WHERE email = 'kitstaff01@gmail.com'"
        );
        console.log('User status:', rows);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
