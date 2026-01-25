-- Hotel Management System Database Schema
-- Generated: 2026-01-23
-- Database: HotelManagement

-- ================================
-- TABLES OVERVIEW
-- ================================
-- 1. Guest - Guest information
-- 2. Admin - Administrator information
-- 3. Receptionist - Receptionist staff information
-- 4. KitchenStaff - Kitchen staff information
-- 5. Driver - Driver information
-- 6. Room - Hotel room information
-- 7. RoomBooking - Room booking records
-- 8. Activity - Available activities
-- 9. ActivityBooking - Activity booking records
-- 10. Vehicle - Vehicle information
-- 11. VehicleBooking - Vehicle booking records
-- 12. MenuItem - Food menu items
-- 13. FoodOrder - Food order records
-- 14. OrderItem - Individual items in food orders
-- 15. Payment - Payment records
-- 16. Refund - Refund records
-- 17. Report - System reports
-- 18. Feedback - Guest feedback

USE HotelManagement;

-- ================================
-- USER TABLES
-- ================================

-- Guest Table
CREATE TABLE IF NOT EXISTS Guest (
    guest_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(100) UNIQUE NOT NULL,
    guest_phone VARCHAR(15) NOT NULL,
    guest_password VARCHAR(255) NOT NULL,
    guest_address VARCHAR(255),
    nationality VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Table
CREATE TABLE IF NOT EXISTS Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL,
    admin_email VARCHAR(100) UNIQUE NOT NULL,
    admin_phone VARCHAR(15),
    admin_password VARCHAR(255) NOT NULL,
    admin_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receptionist Table
CREATE TABLE IF NOT EXISTS Receptionist (
    receptionist_id INT AUTO_INCREMENT PRIMARY KEY,
    receptionist_name VARCHAR(100) NOT NULL,
    receptionist_email VARCHAR(100) UNIQUE NOT NULL,
    receptionist_phone VARCHAR(15),
    receptionist_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KitchenStaff Table
CREATE TABLE IF NOT EXISTS KitchenStaff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_name VARCHAR(100) NOT NULL,
    staff_email VARCHAR(100) UNIQUE NOT NULL,
    staff_phone VARCHAR(15),
    staff_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver Table
CREATE TABLE IF NOT EXISTS Driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    driver_email VARCHAR(100) UNIQUE NOT NULL,
    driver_phone VARCHAR(15),
    driver_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- RESOURCE TABLES
-- ================================

-- Room Table
CREATE TABLE IF NOT EXISTS Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_type VARCHAR(50) NOT NULL,
    room_price_per_day DECIMAL(10,2) NOT NULL CHECK (room_price_per_day >= 0),
    room_status ENUM('Available', 'Booked', 'Maintenance') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Table
CREATE TABLE IF NOT EXISTS Activity (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    activity_price_per_hour DECIMAL(10,2) CHECK (activity_price_per_hour >= 0),
    activity_status ENUM('Available', 'Unavailable') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Table
CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_price_per_day DECIMAL(10,2) CHECK (vehicle_price_per_day >= 0),
    vehicle_price_per_hour DECIMAL(10,2) CHECK (vehicle_price_per_hour >= 0),
    vehicle_status ENUM('Available', 'Booked', 'Maintenance') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MenuItem Table
CREATE TABLE IF NOT EXISTS MenuItem (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    item_price DECIMAL(10,2) CHECK (item_price >= 0),
    item_availability ENUM('Available', 'Unavailable') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- BOOKING TABLES
-- ================================

-- RoomBooking Table
CREATE TABLE IF NOT EXISTS RoomBooking (
    rb_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    room_id INT NOT NULL,
    receptionist_id INT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    rb_status ENUM('Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled') DEFAULT 'Pending',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE CASCADE,
    FOREIGN KEY (receptionist_id) REFERENCES Receptionist(receptionist_id) ON DELETE SET NULL
);

-- ActivityBooking Table
CREATE TABLE IF NOT EXISTS ActivityBooking (
    ab_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    activity_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME,
    duration_hours DECIMAL(5,2),
    ab_status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES Activity(activity_id) ON DELETE CASCADE
);

-- VehicleBooking Table
CREATE TABLE IF NOT EXISTS VehicleBooking (
    vb_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT,
    pickup_date DATE NOT NULL,
    return_date DATE,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    vb_status ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id) ON DELETE SET NULL
);

-- ================================
-- FOOD ORDER TABLES
-- ================================

-- FoodOrder Table
CREATE TABLE IF NOT EXISTS FoodOrder (
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

-- OrderItem Table
CREATE TABLE IF NOT EXISTS OrderItem (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    item_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * item_price) STORED,
    FOREIGN KEY (order_id) REFERENCES FoodOrder(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES MenuItem(item_id) ON DELETE CASCADE
);

-- ================================
-- PAYMENT & FINANCIAL TABLES
-- ================================

-- Payment Table
CREATE TABLE IF NOT EXISTS Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount >= 0),
    payment_method ENUM('Cash', 'Card', 'Online') DEFAULT 'Cash',
    payment_status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    booking_type ENUM('Room', 'Activity', 'Vehicle', 'Food') NOT NULL,
    booking_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE
);

-- Refund Table
CREATE TABLE IF NOT EXISTS Refund (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    receptionist_id INT,
    refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount >= 0),
    refund_reason TEXT,
    refund_status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    refund_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (receptionist_id) REFERENCES Receptionist(receptionist_id) ON DELETE SET NULL
);

-- ================================
-- REPORTING & FEEDBACK TABLES
-- ================================

-- Report Table
CREATE TABLE IF NOT EXISTS Report (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    report_type ENUM('Revenue', 'Bookings', 'Staff', 'Inventory') NOT NULL,
    report_information TEXT,
    start_period DATE,
    end_period DATE,
    generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES Admin(admin_id) ON DELETE CASCADE
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS Feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    feedback_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Guest indexes
CREATE INDEX idx_guest_email ON Guest(guest_email);

-- Room indexes
CREATE INDEX idx_room_status ON Room(room_status);

-- RoomBooking indexes
CREATE INDEX idx_rb_guest ON RoomBooking(guest_id);
CREATE INDEX idx_rb_room ON RoomBooking(room_id);
CREATE INDEX idx_rb_dates ON RoomBooking(check_in_date, check_out_date);
CREATE INDEX idx_rb_status ON RoomBooking(rb_status);

-- FoodOrder indexes
CREATE INDEX idx_order_guest ON FoodOrder(guest_id);
CREATE INDEX idx_order_status ON FoodOrder(order_status);
CREATE INDEX idx_order_date ON FoodOrder(order_date);

-- Payment indexes
CREATE INDEX idx_payment_guest ON Payment(guest_id);
CREATE INDEX idx_payment_status ON Payment(payment_status);
CREATE INDEX idx_payment_type ON Payment(booking_type);

-- ================================ 
-- END OF SCHEMA
-- ================================
