const db = require('../config/db');

// --- Guest/Public: Menu & Ordering ---

exports.getMenu = async (req, res) => {
    try {
        const [menu] = await db.query("SELECT * FROM MenuItem WHERE item_availability = 'Available'"); // Guests only see available
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        const { items, total_amount, payment_method } = req.body;
        // items is array of { item_id, quantity }
        const guest_id = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Create Payment first (simplified, one payment for whole order batch)
            const [paymentResult] = await connection.query(
                'INSERT INTO Payment (payment_amount, payment_method, service_type, payment_status) VALUES (?, ?, ?, ?)',
                [total_amount, payment_method, 'Food', 'Success']
            );
            const payment_id = paymentResult.insertId;

            // 2. Insert each OrderItem
            for (const item of items) {
                // Calculate item total (price * quantity) - for now using client passed total or fetching?
                // Safer to fetch:
                const [menuItem] = await connection.query('SELECT item_price FROM MenuItem WHERE item_id = ?', [item.item_id]);
                if (menuItem.length === 0) continue; // Skip invalid

                const itemTotal = menuItem[0].item_price * item.quantity;

                await connection.query(
                    'INSERT INTO OrderItem (guest_id, item_id, order_quantity, order_status, order_total_amount, payment_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [guest_id, item.item_id, item.quantity, 'Ordered', itemTotal, payment_id]
                );
            }

            // Note: service_id in Payment table usually refers to a single ID. 
            // Since one payment covers multiple OrderItems, we might just link the first one or leave it null/generic.
            // Or we could have created an 'Order' parent table, but schema uses OrderItem directly.
            // We will skip updating service_id for now or set it to 0 to indicate batch.

            await connection.commit();
            res.status(201).json({ message: 'Order placed successfully' });

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
        // Fetch all active orders (Ordered/Prepared) or all? Let's fetch all relevant for dashboard
        const [orders] = await db.query(
            `SELECT oi.*, mi.item_name, g.guest_name, r.room_id 
       FROM OrderItem oi 
       JOIN MenuItem mi ON oi.item_id = mi.item_id 
       JOIN Guest g ON oi.guest_id = g.guest_id
       LEFT JOIN RoomBooking rb ON g.guest_id = rb.guest_id AND rb.rb_status = 'Checked-in' 
       LEFT JOIN Room r ON rb.room_id = r.room_id
       ORDER BY oi.order_date ASC`
        );
        // Note: Room join is best effort to find where to deliver
        res.json(orders);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Prepared', 'Delivered'
        const { id } = req.params;

        await db.query('UPDATE OrderItem SET order_status = ? WHERE order_id = ?', [status, id]);
        res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// --- Menu Management (Kitchen/Admin) ---

exports.getAllMenuItems = async (req, res) => {
    // Fetch ALL (including unavailable)
    try {
        const [menu] = await db.query("SELECT * FROM MenuItem");
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
            'UPDATE MenuItem SET item_name = ?, item_price = ?, item_availability = ? WHERE item_id = ?',
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
            'INSERT INTO MenuItem (item_name, item_price, item_availability) VALUES (?, ?, ?)',
            [item_name, item_price, item_availability || 'Available']
        );
        res.status(201).json({ message: 'Menu item added' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add menu item' });
    }
}
