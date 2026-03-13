const db = require('../config/db');
const notificationController = require('./notificationController');

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
        const { items, total_amount, dining_option, rb_id, scheduled_date, meal_type } = req.body;
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

            // 1. Validate Active Booking (Hybrid Strategy)
            const [activeBookings] = await connection.query(
                `SELECT rb_id, rb_checkin, rb_checkout 
                 FROM roombooking 
                 WHERE guest_id = ? 
                 AND rb_status IN ('Booked', 'Checked-in', 'Active')
                 AND rb_checkout >= CURDATE()
                 ORDER BY rb_checkin ASC`,
                [guest_id]
            );

            if (activeBookings.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    error: 'No active booking found',
                    message: 'You must have an active room booking to order food. Please book a room first.',
                    requiresBooking: true
                });
            }

            // 2. Determine booking to link (use provided or default to first active)
            let linkedBookingId = rb_id;
            if (!linkedBookingId) {
                linkedBookingId = activeBookings[0].rb_id;
            } else {
                // Validate provided booking belongs to guest
                const isValid = activeBookings.some(b => b.rb_id === parseInt(linkedBookingId, 10));
                if (!isValid) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Invalid booking ID provided' });
                }
            }

            // 4. Create Order in foodorder table
            const [orderResult] = await connection.query(
                'INSERT INTO foodorder (guest_id, order_status, dining_option, rb_id, scheduled_date, meal_type) VALUES (?, ?, ?, ?, ?, ?)',
                [guest_id, 'Pending', dining_option || 'Delivery', linkedBookingId, scheduled_date, meal_type]
            );
            const order_id = orderResult.insertId;

            // 5. Insert each OrderItem
            for (const item of items) {
                // Fetch price to be safe
                const [menuItem] = await connection.query('SELECT item_price FROM menuitem WHERE item_id = ?', [item.item_id]);
                if (menuItem.length === 0) continue;

                const itemPrice = menuItem[0].item_price;
                await connection.query(
                    'INSERT INTO orderitem (order_id, item_id, quantity, item_price) VALUES (?, ?, ?, ?)',
                    [order_id, item.item_id, item.quantity, itemPrice]
                );
            }

            // 6. Create Payment record
            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [total_amount, 'Success']
            );
            const payment_id = paymentResult.insertId;

            // 7. Update FoodOrder with Payment ID
            await connection.query('UPDATE foodorder SET payment_id = ? WHERE order_id = ?', [payment_id, order_id]);

            await connection.commit();

            // Notify Chefs
            try {
                const [chefs] = await db.query("SELECT user_id FROM Users WHERE role = 'chef'");
                for (const chef of chefs) {
                    await notificationController.createNotification(
                        chef.user_id,
                        'New Food Order',
                        `New order #${order_id} received. Amount: Rs. ${total_amount}.`,
                        'Order'
                    );
                }
            } catch (notifyErr) {
                console.error('Failed to notify chefs:', notifyErr);
            }

            res.status(201).json({
                message: 'Order placed successfully',
                orderId: order_id,
                linkedBooking: linkedBookingId
            });

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

exports.placeBulkOrder = async (req, res) => {
    try {
        const { orderGroups, total_amount, dining_option, rb_id } = req.body;
        const userId = req.user.id;

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

            // 1. Create a single Payment record for the entire cart
            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [total_amount, 'Success']
            );
            const payment_id = paymentResult.insertId;

            const createdOrderIds = [];

            // 2. Process each group (date + meal_type)
            for (const group of orderGroups) {
                const { scheduled_date, meal_type, items } = group;

                // Create FoodOrder
                const [orderResult] = await connection.query(
                    'INSERT INTO foodorder (guest_id, order_status, dining_option, rb_id, scheduled_date, meal_type, payment_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [guest_id, 'Pending', dining_option || 'Delivery', rb_id, scheduled_date, meal_type, payment_id]
                );
                const order_id = orderResult.insertId;
                createdOrderIds.push(order_id);

                // Insert each OrderItem for this group
                for (const item of items) {
                    const [menuItem] = await connection.query('SELECT item_price FROM menuitem WHERE item_id = ?', [item.item_id]);
                    if (menuItem.length === 0) continue;

                    const itemPrice = menuItem[0].item_price;
                    await connection.query(
                        'INSERT INTO orderitem (order_id, item_id, quantity, item_price) VALUES (?, ?, ?, ?)',
                        [order_id, item.item_id, item.quantity, itemPrice]
                    );
                }
            }

            await connection.commit();

            // Notify Chefs for each new order
            try {
                const [chefs] = await db.query("SELECT user_id FROM Users WHERE role = 'chef'");
                for (const orderId of createdOrderIds) {
                    for (const chef of chefs) {
                        await notificationController.createNotification(
                            chef.user_id,
                            'New Food Order',
                            `New order #${orderId} received as part of a multi-meal booking.`,
                            'Order'
                        );
                    }
                }
            } catch (notifyErr) {
                console.error('Failed to notify chefs:', notifyErr);
            }

            res.status(201).json({
                message: 'Multiple orders placed successfully',
                orderIds: createdOrderIds,
                linkedBooking: rb_id
            });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error placing bulk order:', error);
        res.status(500).json({ error: 'Failed to place bulk orders' });
    }
};

// --- Chef: Management ---

exports.getAllOrders = async (req, res) => {
    try {
        // Joined with payment table to get total_amount
        const { date } = req.query; // Chef can filter by date
        const filterDate = date || new Date().toISOString().split('T')[0];

        const [rows] = await db.query(
            `SELECT fo.order_id, fo.guest_id, fo.order_status, fo.order_date, fo.scheduled_date, fo.meal_type, fo.dining_option, fo.assigned_chef_id,
                    p.payment_amount as total_amount,
                    oi.order_item_id, oi.quantity, oi.item_price, oi.item_status, oi.subtotal,
                    mi.item_name, 
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    CONCAT(c.first_name, ' ', c.last_name) as chef_name,
                    r.room_number 
             FROM foodorder fo
             LEFT JOIN payment p ON fo.payment_id = p.payment_id
             JOIN orderitem oi ON fo.order_id = oi.order_id
             JOIN menuitem mi ON oi.item_id = mi.item_id 
             JOIN Guest g ON fo.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN Users c ON fo.assigned_chef_id = c.user_id
             LEFT JOIN roombooking rb ON fo.rb_id = rb.rb_id
             LEFT JOIN room r ON rb.room_id = r.room_id
             WHERE fo.scheduled_date = ?
             ORDER BY fo.order_date DESC`,
            [filterDate]
        );

        // Group by Order ID
        const ordersMap = new Map();

        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id,
                    guest_id: row.guest_id,
                    order_status: row.order_status,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    scheduled_date: row.scheduled_date,
                    meal_type: row.meal_type,
                    dining_option: row.dining_option || 'Delivery',
                    guest_name: row.guest_name,
                    room_number: row.room_number || 'N/A',
                    assigned_chef_id: row.assigned_chef_id,
                    chef_name: row.chef_name || null,
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

exports.startCooking = async (req, res) => {
    try {
        const { id } = req.params;
        const chefId = req.user.id;

        // 1. Double check if already assigned to someone else
        const [order] = await db.query("SELECT assigned_chef_id FROM foodorder WHERE order_id = ?", [id]);
        if (order.length === 0) return res.status(404).json({ error: 'Order not found' });
        
        if (order[0].assigned_chef_id && order[0].assigned_chef_id !== chefId) {
            return res.status(403).json({ error: 'Order is already being prepared by another chef' });
        }

        // 2. Assign and update status
        await db.query(
            "UPDATE foodorder SET assigned_chef_id = ?, order_status = 'Preparing' WHERE order_id = ?",
            [chefId, id]
        );

        // Also update all items to 'Preparing'
        await db.query("UPDATE orderitem SET item_status = 'Preparing' WHERE order_id = ?", [id]);

        res.json({ message: 'Assignment successful. Happy cooking!' });
    } catch (error) {
        console.error("Error assigning order:", error);
        res.status(500).json({ error: 'Failed to assign order' });
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
        
        let item_image = req.body.item_image; // Keep existing if no new file
        if (req.file) {
            item_image = `/uploads/menu/${req.file.filename}`;
        }

        await db.query(
            'UPDATE menuitem SET item_name = ?, item_price = ?, item_availability = ?, item_image = ? WHERE item_id = ?',
            [item_name, item_price, item_availability, item_image, id]
        );
        res.json({ message: 'Menu item updated' });
    } catch (error) {
        console.error('Update Menu Item Error:', error);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
}

exports.addMenuItem = async (req, res) => {
    try {
        const { item_name, item_price, item_availability } = req.body;
        let item_image = null;
        if (req.file) {
            item_image = `/uploads/menu/${req.file.filename}`;
        }

        await db.query(
            'INSERT INTO menuitem (item_name, item_price, item_availability, item_image) VALUES (?, ?, ?, ?)',
            [item_name, item_price, item_availability || 'Available', item_image]
        );
        res.status(201).json({ message: 'Menu item added' });
    } catch (error) {
        console.error('Add Menu Item Error:', error);
        res.status(500).json({ error: 'Failed to add menu item' });
    }
}

exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if item is linked to any orders first
        const [linked] = await db.query('SELECT count(*) as count FROM orderitem WHERE item_id = ?', [id]);
        if (linked[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete item', 
                message: 'This item has historical order data and cannot be deleted. Try making it "Unavailable" instead.' 
            });
        }

        await db.query('DELETE FROM menuitem WHERE item_id = ?', [id]);
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        console.error('Delete Menu Item Error:', error);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
}
