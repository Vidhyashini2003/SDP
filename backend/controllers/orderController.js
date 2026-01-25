const db = require('../config/db');

// --- Guest/Public: Menu & Ordering ---

exports.getMenu = async (req, res) => {
    try {
        const [menu] = await db.query("SELECT * FROM menuitem WHERE item_availability = 'Available'"); // Guests only see available
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        const { items, total_amount, payment_method, dining_option } = req.body;
        const userId = req.user.id; // user_id

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 0. Get guest_id
            const [guestRows] = await connection.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
            if (guestRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Guest profile not found' });
            }
            const guest_id = guestRows[0].guest_id;

            // 1. Create Order in foodorder table
            const [orderResult] = await connection.query(
                'INSERT INTO foodorder (guest_id, total_amount, payment_method, order_status, dining_option) VALUES (?, ?, ?, ?, ?)',
                [guest_id, total_amount, payment_method, 'Pending', dining_option || 'Delivery']
            );
            const order_id = orderResult.insertId;

            // 2. Insert each OrderItem
            for (const item of items) {
                // Fetch price to be safe
                const [menuItem] = await connection.query('SELECT item_price FROM menuitem WHERE item_id = ?', [item.item_id]);
                if (menuItem.length === 0) continue;

                const itemPrice = menuItem[0].item_price;
                // subtotal is generated always in schema, so we don't insert it. Schema: order_id, item_id, quantity, item_price
                await connection.query(
                    'INSERT INTO orderitem (order_id, item_id, quantity, item_price) VALUES (?, ?, ?, ?)',
                    [order_id, item.item_id, item.quantity, itemPrice]
                );
            }

            // 3. Create Payment record
            await connection.query(
                'INSERT INTO payment (payment_amount, payment_method, service_type, service_id, payment_status) VALUES (?, ?, ?, ?, ?)',
                [total_amount, payment_method, 'Food', order_id, 'Success']
            );

            await connection.commit();
            res.status(201).json({ message: 'Order placed successfully', orderId: order_id });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
};

// --- Kitchen Staff: Management ---

exports.getAllOrders = async (req, res) => {
    try {
        // Fetch all active orders with their items
        const [rows] = await db.query(
            `SELECT fo.order_id, fo.guest_id, fo.order_status, fo.order_date, fo.total_amount, fo.dining_option,
                    oi.order_item_id, oi.quantity, oi.item_price, oi.item_status, oi.subtotal,
                    mi.item_name, 
                    u.name as guest_name, 
                    r.room_number 
             FROM foodorder fo
             JOIN orderitem oi ON fo.order_id = oi.order_id
             JOIN menuitem mi ON oi.item_id = mi.item_id 
             JOIN Guest g ON fo.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN roombooking rb ON g.guest_id = rb.guest_id AND rb.rb_status = 'Checked-in' 
             LEFT JOIN room r ON rb.room_id = r.room_id
             ORDER BY fo.order_date DESC`
        );

        // Group by Order ID
        const ordersMap = new Map();

        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id,
                    guest_id: row.guest_id, // Added guest_id
                    order_status: row.order_status,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    dining_option: row.dining_option || 'Delivery',
                    guest_name: row.guest_name,
                    room_number: row.room_number || 'N/A', // Handle guests without active room (e.g. checked out or lobby)
                    items: []
                });
            }
            ordersMap.get(row.order_id).items.push({
                order_item_id: row.order_item_id,
                item_name: row.item_name,
                quantity: row.quantity,
                item_price: row.item_price,
                item_status: row.item_status || 'Pending',
                subtotal: row.subtotal
            });
        });

        const orders = Array.from(ordersMap.values());
        res.json(orders);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Prepared', 'Delivered', 'Cancelled'
        const { id } = req.params;

        await db.query('UPDATE foodorder SET order_status = ? WHERE order_id = ?', [status, id]);

        // If Order is marked Delivered or Cancelled, ensure all items reflect this (e.g. are Completed or Cancelled)
        // This ensures the DB stays consistent even if the user bypasses item-level checks or uses the main button.
        if (status === 'Delivered') {
            await db.query("UPDATE orderitem SET item_status = 'Completed' WHERE order_id = ? AND item_status != 'Completed'", [id]);
        } else if (status === 'Cancelled') {
            // If we had a 'Cancelled' status for items, we'd use it. For now, maybe just leave them or set to Completed? 
            // The item_status ENUM is 'Pending', 'Preparing', 'Completed'. 
            // If order is cancelled, items effectively stop. Let's not strictly force completion if it's cancelled, 
            // but for 'Delivered', they definitely MUST be Completed.
        }

        res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

exports.updateOrderItemStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Preparing', 'Completed'
        const { itemId } = req.params;

        // 1. Update individual item status
        await db.query('UPDATE orderitem SET item_status = ? WHERE order_item_id = ?', [status, itemId]);

        // 2. Check if all items in the order are completed to auto-update order status
        // First get the order_id for this item
        const [itemRows] = await db.query('SELECT order_id FROM orderitem WHERE order_item_id = ?', [itemId]);
        if (itemRows.length > 0) {
            const orderId = itemRows[0].order_id;

            // Check if any item is NOT Completed (ignore cancelled if applicable, though simplistic here)
            const [incompleteRows] = await db.query(
                "SELECT count(*) as count FROM orderitem WHERE order_id = ? AND item_status != 'Completed'",
                [orderId]
            );

            // If all items are completed, set order to 'Prepared' (ready for delivery)
            // Or 'Delivered' if the kitchen flow implies completion = delivery. 
            // Usually Kitchen completes -> Waiter delivers. Let's set to 'Prepared' if all are completed.
            if (incompleteRows[0].count === 0) {
                await db.query('UPDATE foodorder SET order_status = ? WHERE order_id = ?', ['Prepared', orderId]);
            } else if (status === 'Preparing') {
                // If at least one item starts preparing, maybe set order to Preparing?
                await db.query('UPDATE foodorder SET order_status = ? WHERE order_id = ? AND order_status = "Pending"', ['Preparing', orderId]);
            }
        }

        res.json({ message: `Item status updated to ${status}` });
    } catch (error) {
        console.error("Error updating item status:", error);
        res.status(500).json({ error: 'Failed to update item status' });
    }
};

// --- Menu Management (Kitchen/Admin) ---

exports.getAllMenuItems = async (req, res) => {
    // Fetch ALL (including unavailable)
    try {
        const [menu] = await db.query("SELECT * FROM menuitem");
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
}

exports.updateMenuItem = async (req, res) => {
    try {
        const { item_name, item_price, item_availability } = req.body;
        const { id } = req.params;

        await db.query(
            'UPDATE menuitem SET item_name = ?, item_price = ?, item_availability = ? WHERE item_id = ?',
            [item_name, item_price, item_availability, id]
        );
        res.json({ message: 'Menu item updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update menu item' });
    }
}

exports.addMenuItem = async (req, res) => {
    try {
        const { item_name, item_price, item_availability } = req.body;
        await db.query(
            'INSERT INTO menuitem (item_name, item_price, item_availability) VALUES (?, ?, ?)',
            [item_name, item_price, item_availability || 'Available']
        );
        res.status(201).json({ message: 'Menu item added' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add menu item' });
    }
}
