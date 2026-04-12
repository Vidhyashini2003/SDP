const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'HotelManagement',
        port: process.env.DB_PORT
    });

    await db.execute(`
        CREATE TABLE IF NOT EXISTS quickride (
          qr_id INT AUTO_INCREMENT PRIMARY KEY,
          guest_id INT NOT NULL,
          driver_id INT DEFAULT NULL,
          vehicle_id INT DEFAULT NULL,
          rb_id INT DEFAULT NULL,
          pickup_location VARCHAR(255) NOT NULL,
          dropoff_location VARCHAR(255) NOT NULL,
          vehicle_type_requested VARCHAR(100) DEFAULT NULL,
          scheduled_at DATETIME DEFAULT NULL,
          started_at DATETIME DEFAULT NULL,
          completed_at DATETIME DEFAULT NULL,
          actual_km DECIMAL(10,2) DEFAULT NULL,
          waiting_hours DECIMAL(10,2) DEFAULT NULL,
          price_per_km DECIMAL(10,2) DEFAULT NULL,
          waiting_price_per_hour DECIMAL(10,2) DEFAULT NULL,
          total_amount DECIMAL(10,2) DEFAULT NULL,
          payment_status ENUM('Pending','Awaiting Payment','Paid') DEFAULT 'Pending',
          status ENUM('Requested','Accepted','In Progress','Completed','Cancelled') DEFAULT 'Requested',
          notes TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE,
          FOREIGN KEY (driver_id) REFERENCES Driver(driver_id) ON DELETE SET NULL,
          FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('quickride table created successfully');
    await db.end();
}

run().catch(console.error);
