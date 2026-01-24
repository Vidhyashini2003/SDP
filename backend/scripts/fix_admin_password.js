const bcrypt = require('bcrypt');
const fs = require('fs');

async function fixAdminPassword() {
    const password = 'Admin01';
    const hash = await bcrypt.hash(password, 10);

    const sql = `-- Fix Admin Password
-- Delete existing admin and re-insert with correct hash

USE HotelManagement;

DELETE FROM Admin WHERE admin_email = 'admin01@gmail.com';

INSERT INTO Admin (admin_name, admin_email, admin_phone, admin_password, admin_address)
VALUES ('Akshayan Mukunthan', 'admin01@gmail.com', '0761234567', '${hash}', '65, Orrshill, Trincomalee');

-- Verify the insertion
SELECT admin_id, admin_name, admin_email FROM Admin WHERE admin_email = 'admin01@gmail.com';
`;

    fs.writeFileSync('migrations/fix_admin_password.sql', sql);
    console.log('✅ SQL file created: migrations/fix_admin_password.sql');
    console.log('✅ Password: Admin01');
    console.log('✅ Hash: ' + hash);
    console.log('\nRun this SQL file in MySQL Workbench to fix the admin login.');
}

fixAdminPassword().catch(console.error);
