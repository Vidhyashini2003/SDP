const mysql = require('mysql2');
require('dotenv').config();

console.log('--- Config ---');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Port:', process.env.DB_PORT);
console.log('Password Length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

console.log('Connecting...');
connection.connect(err => {
    if (err) {
        console.error('--- Connection Failed ---');
        console.error('Code:', err.code);
        console.error('Errno:', err.errno);
        console.error('SQLState:', err.sqlState);
        console.error('Message:', err.message);
    } else {
        console.log('✅ Connected successfully!');
    }
    connection.end();
});
