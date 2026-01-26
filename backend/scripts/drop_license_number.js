const db = require('./config/db');

async function dropColumn() {
    try {
        console.log('Dropping license_number column from Driver table...');

        // Check if column exists first to avoid error? Or just try dropping.
        // MySQL gives "check that column/key exists" error if it doesn't.
        // Simple try/catch is fine.

        await db.query('ALTER TABLE Driver DROP COLUMN license_number');
        console.log('✅ Successfully dropped license_number column.');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('⚠️ Column likely does not exist. Skipping.');
            process.exit(0);
        }
        console.error('❌ Error dropping column:', err);
        process.exit(1);
    }
}

dropColumn();
