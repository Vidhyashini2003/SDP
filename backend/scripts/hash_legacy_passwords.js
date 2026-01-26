const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function hashLegacyPasswords() {
    console.log('Starting legacy password migration...');

    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Find users with passwords that don't look like bcrypt hashes (don't start with $2)
            // Note: bcrypt hashes typically start with $2a$, $2b$, or $2y$. We'll check for $2
            const [users] = await connection.query("SELECT user_id, email, password FROM Users WHERE password NOT LIKE '$2%'");

            console.log(`Found ${users.length} users with legacy passwords.`);

            for (const user of users) {
                if (!user.password) {
                    console.log(`Skipping user ${user.email} (no password set)`);
                    continue;
                }

                console.log(`Hashing password for user: ${user.email} (ID: ${user.user_id})`);
                const hashedPassword = await bcrypt.hash(user.password, 10);

                await connection.query(
                    'UPDATE Users SET password = ? WHERE user_id = ?',
                    [hashedPassword, user.user_id]
                );
            }

            await connection.commit();
            console.log('✅ specific legacy passwords hashed successfully.');

        } catch (error) {
            await connection.rollback();
            console.error('❌ Error during migration:', error);
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        // Close the pool to allow script to exit
        // db is a pool, we need to end it if possible, but db.js exports promisePool. 
        // usually pool.end() matches, but promisePool doesn't have end() directly on it in some versions, 
        // but typically it delegates. Let's try to just exit.
        process.exit(0);
    }
}

hashLegacyPasswords();
