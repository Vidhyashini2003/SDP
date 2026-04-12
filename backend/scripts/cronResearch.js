require('dotenv').config({ path: '../.env' });
const db = require('../config/db');

async function checkSchema() {
    const connection = await db.getConnection();
    try {
        const tables = [
            'roombooking', 
            'activitybooking', 
            'foodorders', 
            'hire_vehicle_per_days', 
            'arrival_transport',
            'quickride'
        ];
        
        for (let t of tables) {
            const [rows] = await connection.query(`SHOW COLUMNS FROM ${t}`);
            console.log(`-- ${t} --`);
            const relevant = rows.filter(r => r.Field.includes('date') || r.Field.includes('time') || r.Field.includes('status') || r.Field.includes('id'));
            console.log(relevant.map(r => r.Field).join(', '));
        }
    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        process.exit();
    }
}

checkSchema();
