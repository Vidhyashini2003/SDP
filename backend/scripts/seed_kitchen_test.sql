-- Ensure we have a kitchen staff
INSERT IGNORE INTO KitchenStaff (staff_name, staff_email, staff_phone, staff_password) 
VALUES ('Chef Ramsay', 'chef@test.com', '1234567890', 'password');

-- Ensure we have a guest
INSERT IGNORE INTO Guest (guest_name, guest_email, guest_phone, guest_password) 
VALUES ('Hungry Guest', 'hungry@test.com', '0987654321', 'password');

-- Ensure we have a menu item
INSERT IGNORE INTO MenuItem (item_name, item_price, item_availability) 
VALUES ('Test Burger', 15.00, 'Available');

-- Create a pending order for testing (using IDs we just ensured exist)
INSERT INTO FoodOrder (guest_id, total_amount, payment_method, order_status) 
SELECT guest_id, 15.00, 'Cash', 'Pending' FROM Guest WHERE guest_email = 'hungry@test.com' LIMIT 1;

-- Add item to order
INSERT INTO OrderItem (order_id, item_id, quantity, item_price)
SELECT MAX(order_id), (SELECT item_id FROM MenuItem WHERE item_name = 'Test Burger' LIMIT 1), 1, 15.00
FROM FoodOrder WHERE guest_id = (SELECT guest_id FROM Guest WHERE guest_email = 'hungry@test.com' LIMIT 1);
