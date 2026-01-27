-- Add cancellation reason fields to booking tables
-- This allows receptionists to record why bookings were cancelled
-- when resources are marked as unavailable/maintenance

USE HotelManagement;

-- Add cancel_reason to RoomBooking
ALTER TABLE RoomBooking 
ADD COLUMN cancel_reason TEXT AFTER rb_status;

-- Add cancel_reason to ActivityBooking
ALTER TABLE ActivityBooking 
ADD COLUMN cancel_reason TEXT AFTER ab_status;

-- Verify VehicleBooking already has cancel_reason field
-- (Should have been added in previous work)
-- If the field doesn't exist, uncomment the following line:
-- ALTER TABLE VehicleBooking 
-- ADD COLUMN cancel_reason TEXT AFTER vb_status;

-- Show updated table structures
DESCRIBE RoomBooking;
DESCRIBE ActivityBooking;
DESCRIBE VehicleBooking;
