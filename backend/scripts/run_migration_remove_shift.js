const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/remove_shift_time.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const statements = sql.split(';').filter(stmt => stmt.trim());

        console.log('Running migration: remove_shift_time.sql');

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement}`);
                try {
                    await db.query(statement);
                    console.log('Success');
                } catch (err) {
                    // Ignore error if column doesn't exist (idempotent-ish)
                    if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                        console.log('Column already dropped or not found. Skipping.');
                    } else {
                        throw err;
                    }
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
