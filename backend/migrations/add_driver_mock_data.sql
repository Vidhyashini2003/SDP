-- Driver Mock Data
-- Insert sample drivers for vehicle bookings

USE HotelManagement;

-- Note: Passwords should be hashed with bcrypt in production

-- Insert drivers with license numbers
INSERT INTO Driver (driver_name, driver_email, driver_phone, driver_password, license_number) VALUES
('Rajesh Kumar', 'rajesh.driver@hotel.com', '0771234567', 'Driver123', 'DL-TN-2020-001'),
('Sunil Perera', 'sunil.driver@hotel.com', '0772345678', 'Driver123', 'DL-TN-2021-002'),
('Arun Silva', 'arun.driver@hotel.com', '0773456789', 'Driver123', 'DL-TN-2022-003');

-- Verify the insertion
SELECT driver_id, driver_name, driver_email, driver_phone, license_number FROM Driver;
