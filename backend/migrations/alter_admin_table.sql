-- Remove phone and address columns from Admin table
-- These fields are not needed for admin users

USE HotelManagement;

-- Drop admin_phone column
ALTER TABLE Admin
DROP COLUMN admin_phone;

-- Drop admin_address column
ALTER TABLE Admin
DROP COLUMN admin_address;

-- Add created_at column if it doesn't exist
ALTER TABLE Admin
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verify the changes
DESCRIBE Admin;
