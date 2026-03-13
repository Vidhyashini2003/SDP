const pool = require('./config/db');

async function fixRoles() {
    try {
        console.log('Connecting to database...');

        // 1. Alter the table to include 'chief' in the ENUM
        console.log('Altering Users table to include "chief" role...');
        await pool.execute(`
            ALTER TABLE Users MODIFY COLUMN role ENUM('guest','admin','receptionist','kitchen','driver','chief') DEFAULT 'guest'
        `);
        console.log('Enum updated.');

        // 2. Update existing 'kitchen' roles to 'chief'
        console.log('Migrating "kitchen" roles to "chief"...');
        const [result] = await pool.execute(
            "UPDATE Users SET role = 'chief' WHERE role = 'kitchen'"
        );
        console.log(`Updated ${result.affectedRows} users.`);

        // 3. Verify
        const [rows] = await pool.execute(
            "SELECT email, role FROM Users WHERE email = 'kitstaff01@gmail.com'"
        );
        console.log('Verification result:', rows);

        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixRoles();
