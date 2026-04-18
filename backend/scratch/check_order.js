const db = require('../config/db');

async function checkOrder() {
    try {
        const [rows] = await db.query('SELECT order_id, order_status FROM foodorder WHERE order_id = 18');
        console.log("Order 18:", rows);
        
        const [items] = await db.query('SELECT order_item_id, item_status FROM orderitem WHERE order_id = 18');
        console.log("Items for Order 18:", items);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkOrder();
