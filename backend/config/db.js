/**
 * config/db.js — MySQL Database Connection Pool
 *
 * Purpose:
 *   Sets up a shared, reusable connection pool to the MySQL database.
 *   A pool is preferred over a single connection because it allows multiple
 *   concurrent database queries without opening a new connection each time,
 *   which is faster and more resource-efficient for a web server.
 *
 * Usage:
 *   const db = require('./config/db');
 *   const [rows] = await db.query('SELECT * FROM Users WHERE user_id = ?', [id]);
 *
 * All credentials are read from the .env file so they are never hardcoded.
 */

const mysql = require('mysql2');
require('dotenv').config(); // Loads DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT from .env

// Create a connection pool — the pool manages multiple database connections.
// When a query needs a connection, it borrows one from the pool and releases it back when done.
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // Database server address (e.g. 'localhost')
    user: process.env.DB_USER,         // MySQL username
    password: process.env.DB_PASSWORD, // MySQL password
    database: process.env.DB_NAME,     // The specific database/schema to use
    port: process.env.DB_PORT,         // MySQL port (default: 3306)
    waitForConnections: true,          // Queue requests when all connections are busy
    connectionLimit: 10,               // Maximum 10 simultaneous connections in the pool
    queueLimit: 0                      // 0 = unlimited queue size (never reject queued requests)
});

// Convert the callback-based pool to a Promise-based pool.
// This lets us use async/await syntax instead of nested callbacks.
const promisePool = pool.promise();

// Test the connection at startup to confirm the database is reachable.
// This does NOT keep the connection open — it borrows one, tests it, and releases it.
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Database connected successfully');
    connection.release(); // Return the test connection back to the pool
});

// Export the promise-based pool so all controllers and utils can query the database
// using: const db = require('../config/db');
module.exports = promisePool;
