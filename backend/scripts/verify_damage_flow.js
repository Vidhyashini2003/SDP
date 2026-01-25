const db = require('../config/db');

async function verifyDamageKeyFlow() {
    console.log('--- Verifying Damage Reporting Flow ---');
    try {
        // 1. Get a guest
        const [guests] = await db.query('SELECT guest_id FROM Guest LIMIT 1');
        if (guests.length === 0) {
            console.log('⚠️ No guests found. Cannot verify.');
            return;
        }
        const guestId = guests[0].guest_id;
        console.log(`Using Guest ID: ${guestId}`);

        // 2. Report Damage (Simulate Receptionist)
        const amount = 500.00;
        const description = 'Test Damage Report';
        await db.query(
            'INSERT INTO Damage (guest_id, reported_by, damage_type, description, charge_amount) VALUES (?, ?, ?, ?, ?)',
            [guestId, 'TestScript', 'Room', description, amount]
        );
        console.log('✅ Damage reported successfully via DB insert.');

        // 3. Retrieve Damage (Simulate Guest Notification)
        const [damages] = await db.query('SELECT * FROM Damage WHERE guest_id = ? AND description = ?', [guestId, description]);

        if (damages.length > 0) {
            console.log('✅ Damage record retrieved successfully.');
            console.log(`   ID: ${damages[0].damage_id}, Amount: ${damages[0].charge_amount}, Status: ${damages[0].status}`);

            // 4. Pay Damage (Simulate Payment)
            await db.query('UPDATE Damage SET status = "Paid" WHERE damage_id = ?', [damages[0].damage_id]);
            console.log('✅ Damage marked as Paid.');
        } else {
            console.error('❌ Failed to retrieve the reported damage.');
        }

    } catch (err) {
        console.error('❌ Verification failed:', err);
    }
    process.exit(0);
}

verifyDamageKeyFlow();
