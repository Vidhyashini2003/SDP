const bcrypt = require('bcrypt');
const fs = require('fs');

async function generateAdminSQL() {
    const password = 'Admin01';
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `-- Admin User Mock Data
-- Password: Admin01 (hashed with bcrypt)

INSERT INTO Admin (admin_name, admin_email, admin_phone, admin_password, admin_address)
VALUES ('Akshayan Mukunthan', 'admin01@gmail.com', '0761234567', '${hashedPassword}', '65, Orrshill, Trincomalee');

-- Verify the insert
SELECT * FROM Admin WHERE admin_email = 'admin01@gmail.com';
`;

    fs.writeFileSync('migrations/add_admin_mock_data.sql', sql);
    console.log('✓ SQL file created: migrations/add_admin_mock_data.sql');
    console.log('✓ Password hashed successfully');
    console.log('\nYou can now run this SQL file in MySQL Workbench or your MySQL client.');
}

generateAdminSQL().catch(console.error);
