const db = require('./config/db');

async function migrate() {
    try {
        console.log('--- Starting Migration ---');
        
        // 1. Add assigned_chief_id column
        console.log('Adding assigned_chief_id to foodorder...');
        try {
            await db.query(`ALTER TABLE foodorder ADD COLUMN assigned_chief_id INT`);
            console.log('Column added.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists.');
            } else {
                throw err;
            }
        }

        // 2. Add Foreign Key
        console.log('Adding FK constraint...');
        try {
            await db.query(`ALTER TABLE foodorder ADD CONSTRAINT fk_assigned_chief FOREIGN KEY (assigned_chief_id) REFERENCES Users(user_id)`);
            console.log('FK added.');
        } catch (err) {
            if (err.code === 'ER_DUP_CONSTRAINT_NAME' || err.code === 'ER_CANNOT_ADD_FOREIGN') {
                console.log('Constraint already exists or could not be added.');
            } else {
                throw err;
            }
        }

        // 3. Update Users.role ENUM to include 'chief'
        console.log("Updating Users.role ENUM to include 'chief'...");
        try {
            await db.query(`ALTER TABLE Users MODIFY COLUMN role ENUM('admin', 'receptionist', 'kitchen', 'guest', 'driver', 'chief') NOT NULL`);
            console.log('ENUM updated.');
        } catch (err) {
            console.error('Failed to update ENUM, it might have a different set of values already.');
            throw err;
        }

        // 4. Update roles from 'kitchen' to 'chief'
        console.log("Renaming 'kitchen' role to 'chief' in Users table...");
        const [result] = await db.query("UPDATE Users SET role = 'chief' WHERE role = 'kitchen'");
        console.log(`Updated ${result.affectedRows} users.`);

        console.log('--- Migration Successful ---');
        process.exit(0);
    } catch (error) {
        console.error('--- Migration Failed ---');
        console.error(error);
        process.exit(1);
    }
}

migrate();
