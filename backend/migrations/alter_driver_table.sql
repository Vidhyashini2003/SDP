-- Modify Driver Table to Add license_number Column
-- This adds the license_number column if it doesn't exist

USE HotelManagement;

-- Add license_number column to Driver table
ALTER TABLE Driver
ADD COLUMN license_number VARCHAR(50);

-- Verify the table structure
DESCRIBE Driver;

-- Now you can run the driver mock data insert
