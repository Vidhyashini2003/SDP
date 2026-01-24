-- Menu Items Mock Data
-- Food items for the Food Ordering system

USE HotelManagement;

-- Insert menu items
INSERT INTO MenuItem (item_name, item_price, item_availability) VALUES
-- Main Course
('Koththu Roti', 1200.00, 'Available'),
('Fried Rice', 1500.00, 'Available'),

-- Breakfast
('Pol Sambol & Hoppers', 900.00, 'Available'),
('Dosa', 650.00, 'Available'),

-- Snacks
('Chicken Bun', 450.00, 'Available');

-- Verify the insertion
SELECT * FROM MenuItem;
