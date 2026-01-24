-- Recreate Admin Table without phone and address
-- This will drop the existing table and create a new simplified version

USE HotelManagement;

-- Drop existing Admin table
DROP TABLE IF EXISTS Admin;

-- Create new Admin table (simplified)
CREATE TABLE Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL,
    admin_email VARCHAR(100) UNIQUE NOT NULL,
    admin_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (plain text password for development)
INSERT INTO Admin (admin_name, admin_email, admin_password) VALUES
('Administrator', 'admin@hotel.com', 'Admin01');

-- Verify the new table structure
DESCRIBE Admin;

-- Check the data
SELECT * FROM Admin;
