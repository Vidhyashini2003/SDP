const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kayal2003',
    database: 'HotelManagement',
    port: 3308
  });

  const tables = ['Guest', 'roombooking', 'activitybooking', 'hirevehicle', 'foodorder'];
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`DESCRIBE ${table}`);
      console.log(`\nTable: ${table}`);
      console.table(rows);
    } catch (e) {
      console.log(`\nTable ${table} error: ${e.message}`);
    }
  }
  await connection.end();
}
check();
