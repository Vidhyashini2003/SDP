const bcrypt = require('bcrypt');

async function hashPassword() {
    const password = 'Admin01';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('\n=== Admin Password Hash ===');
    console.log('Original Password: Admin01');
    console.log('Hashed Password:');
    console.log(hashedPassword);
    console.log('\n=== Copy this SQL Query ===\n');

    const sql = `INSERT INTO Admin (admin_name, admin_email, admin_phone, admin_password, admin_address)
VALUES ('Akshayan Mukunthan', 'admin01@gmail.com', '0761234567', '${hashedPassword}', '65, Orrshill, Trincomalee');`;

    console.log(sql);
    console.log('\n');
}

hashPassword();
