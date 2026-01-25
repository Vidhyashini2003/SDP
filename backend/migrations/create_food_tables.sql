CREATE TABLE IF NOT EXISTS foodorder (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    staff_id INT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    order_status ENUM('Pending', 'Preparing', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    total_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES KitchenStaff(staff_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orderitem (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    item_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * item_price) STORED,
    FOREIGN KEY (order_id) REFERENCES FoodOrder(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES MenuItem(item_id) ON DELETE CASCADE
);
