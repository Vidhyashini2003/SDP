const db = require('./config/db');

async function checkTriggers() {
    try {
        const [triggers] = await db.query("SHOW TRIGGERS");
        console.log("TRIGGERS FOUND:", JSON.stringify(triggers, null, 2));
        
        const [foreignKeys] = await db.query(`
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = ? AND
                REFERENCED_TABLE_NAME IS NOT NULL
        `, [process.env.DB_NAME]);
        console.log("FOREIGN KEYS FOUND:", JSON.stringify(foreignKeys, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTriggers();
