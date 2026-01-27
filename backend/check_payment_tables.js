const mysql = require('mysql2/promise');

async function checkAllPaymentTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kayal2003',
        database: 'HotelManagement',
        port: 3308
    });

    try {
        console.log('Checking for all payment-related tables...\n');

        // Check all tables in the database
        const [tables] = await connection.query(`
            SHOW TABLES LIKE '%payment%'
        `);

        console.log('Tables found:');
        console.table(tables);

        // Check each table structure
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\n=== Structure of table: ${tableName} ===`);

            const [columns] = await connection.query(`DESCRIBE ${tableName}`);
            console.table(columns);
        }

        // Now let's check what the actual SQL query is using
        console.log('\n=== Testing the actual query from adminController ===\n');

        try {
            const [result] = await connection.query(`
                SELECT booking_type, COUNT(*) as count, SUM(payment_amount) as total 
                FROM payment 
                WHERE payment_status = 'Success' 
                GROUP BY booking_type
            `);
            console.log('✅ Query executed successfully!');
            console.log('Result:', result);
        } catch (err) {
            console.error('❌ Query failed:', err.message);
            console.error('SQL State:', err.sqlState);
            console.error('Error Code:', err.code);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

checkAllPaymentTables();
