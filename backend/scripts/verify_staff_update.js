const db = require('../config/db');

async function verifyStaffUpdate() {
    console.log('--- Verifying Simplified Staff Creation ---');

    try {
        console.log('Testing INSERT without phone...');
        const newStaff = {
            name: 'Simpler Staff',
            email: `simple_staff_${Date.now()}@example.com`,
            password: 'password123',
            role: 'receptionist'
        };

        const [result] = await db.query(
            "INSERT INTO Receptionist (receptionist_name, receptionist_email, receptionist_password) VALUES (?, ?, ?)",
            [newStaff.name, newStaff.email, newStaff.password]
        );

        console.log('✅ INSERT successful. ID:', result.insertId);

        // Verify Fetch to ensure phone is NULL
        const [rows] = await db.query("SELECT * FROM Receptionist WHERE receptionist_id = ?", [result.insertId]);
        console.log('Fetched Staff:', rows[0].receptionist_name);
        console.log('Phone field value:', rows[0].receptionist_phone); // Should be null

        // Clean up
        await db.query("DELETE FROM Receptionist WHERE receptionist_id = ?", [result.insertId]);
        console.log('Cleaned up test data.');

    } catch (err) {
        console.error('❌ INSERT verification failed:', err);
    }

    process.exit(0);
}

verifyStaffUpdate();
