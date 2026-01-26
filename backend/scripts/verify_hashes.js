const db = require('../config/db');

async function verifyHashes() {
    try {
        const [rows] = await db.query("SELECT count(*) as count FROM Users WHERE password NOT LIKE '$2%'");
        console.log(`Remaining legacy passwords: ${rows[0].count}`);

        if (rows[0].count === 0) {
            console.log('Verification SUCCESS: All passwords are hashed.');
        } else {
            console.log('Verification FAILED: Some passwords remain unhashed.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    }
}

verifyHashes();
