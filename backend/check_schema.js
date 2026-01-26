
const db = require('./config/db');

async function checkSchema() {
    try {
        const connection = await db.getConnection();
        console.log('--- Users Table ---');
        const [users] = await connection.query('DESCRIBE Users');
        console.log(users.map(c => `${c.Field}: ${c.Type} Null:${c.Null}`).join('\n'));

        console.log('\n--- Receptionist Table ---');
        const [recep] = await connection.query('DESCRIBE Receptionist');
        console.log(recep.map(c => `${c.Field}: ${c.Type} Null:${c.Null}`).join('\n'));

        console.log('\n--- KitchenStaff Table ---');
        const [kit] = await connection.query('DESCRIBE KitchenStaff');
        console.log(kit.map(c => `${c.Field}: ${c.Type} Null:${c.Null}`).join('\n'));

        console.log('\n--- Driver Table ---');
        const [driver] = await connection.query('DESCRIBE Driver');
        console.log(driver.map(c => `${c.Field}: ${c.Type} Null:${c.Null}`).join('\n'));

        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
