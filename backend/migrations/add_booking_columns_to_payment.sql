-- Add booking_type and booking_id columns to Payment table if they don't exist

-- Check if columns exist and add them if not
ALTER TABLE Payment 
ADD COLUMN IF NOT EXISTS booking_type ENUM('Room', 'Activity', 'Vehicle', 'Food') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS booking_id INT DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_type ON Payment(booking_type);
CREATE INDEX IF NOT EXISTS idx_payment_booking ON Payment(booking_id);
