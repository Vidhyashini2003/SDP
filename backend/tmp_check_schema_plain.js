const pool = require('./config/db');

async function checkSchema() {
    try {
        const tables = ['Users', 'Guest', 'Receptionist', 'KitchenStaff', 'Driver'];
        for (const table of tables) {
            const [rows] = await pool.execute(`DESCRIBE ${table}`);
            console.log(`--- ${table} Schema ---`);
            rows.forEach(row => {
                console.log(`${row.Field}: ${row.Type} (Null: ${row.Null}, Key: ${row.Key}, Default: ${row.Default})`);
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('Schema check failed:', error);
        process.exit(1);
    }
}

checkSchema();
