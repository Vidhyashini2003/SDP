const pool = require('./config/db');

async function fixChefRoles() {
    try {
        console.log('Connecting to database...');

        // 1. Alter the table to include 'chef' and 'chief' (to be safe while migrating)
        console.log('Altering Users table to include "chef" role...');
        await pool.execute(`
            ALTER TABLE Users MODIFY COLUMN role ENUM('guest','admin','receptionist','kitchen','driver','chief','chef') DEFAULT 'guest'
        `);
        console.log('Enum updated.');

        // 2. Update existing 'chief' roles to 'chef'
        console.log('Migrating "chief" roles to "chef"...');
        const [result1] = await pool.execute(
            "UPDATE Users SET role = 'chef' WHERE role = 'chief'"
        );
        console.log(`Updated ${result1.affectedRows} users from "chief" to "chef".`);

        // 3. Update existing 'kitchen' roles to 'chef' (just in case)
        const [result2] = await pool.execute(
            "UPDATE Users SET role = 'chef' WHERE role = 'kitchen'"
        );
        console.log(`Updated ${result2.affectedRows} users from "kitchen" to "chef".`);

        // 4. Update foodorder table assigned_chief_id to assigned_chef_id if renamed, but I used assigned_chief_id.
        // Actually I used assigned_chief_id in migration. I should check if I should rename the COLUMN too.
        // User said "kitchen staff name to chef". "chief" was my typo.
        // Let's rename the column too for consistency.
        
        console.log('Renaming assigned_chief_id to assigned_chef_id in foodorder...');
        // Check if column exists first
        const [cols] = await pool.execute("DESCRIBE foodorder");
        if (cols.find(c => c.Field === 'assigned_chief_id')) {
            await pool.execute("ALTER TABLE foodorder CHANGE COLUMN assigned_chief_id assigned_chef_id INT");
            console.log('Column renamed to assigned_chef_id.');
        }

        // 5. Verify
        const [rows] = await pool.execute(
            "SELECT email, role FROM Users WHERE email = 'kitstaff01@gmail.com'"
        );
        console.log('Verification result:', rows);

        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixChefRoles();
