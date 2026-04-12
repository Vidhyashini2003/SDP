const mysql = require('mysql2/promise');
require('dotenv').config();

async function describeTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('--- hire_vehicle_for_arrival ---');
        const [schema] = await connection.execute('DESCRIBE hire_vehicle_for_arrival');
        console.table(schema);

        console.log('--- hirevehicle ---');
        const [schema2] = await connection.execute('DESCRIBE hirevehicle');
        console.table(schema2);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

describeTable();
