
const db = require('./config/db');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('Hashed password:', hashedPassword);
        const [res] = await db.query(
            "INSERT INTO Users (name, email, phone, password, role, account_status) VALUES (?, ?, ?, ?, 'admin', 'Active')",
            ['Test Admin', 'admin_test@example.com', '1234567890', hashedPassword]
        );
        console.log('Admin user created with ID:', res.insertId);
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('Admin user already exists, resetting password...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            await db.query("UPDATE Users SET password = ?, account_status = 'Active' WHERE email = 'admin_test@example.com'", [hashedPassword]);
            console.log('Admin password reset.');
            process.exit(0);
        }
        console.error('Failed to create admin:', error);
        process.exit(1);
    }
};

createAdmin();
