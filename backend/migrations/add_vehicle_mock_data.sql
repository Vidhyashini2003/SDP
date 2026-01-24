-- Vehicle Mock Data
-- Insert vehicles matching the Vehicle Hire UI design

USE HotelManagement;

-- Insert vehicles
INSERT INTO Vehicle (vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status) VALUES
('Van', 'VAN-001', 30000.00, 5000.00, 'Available'),
('Mini Van', 'MV-001', 20000.00, 3000.00, 'Available'),
('Jeep', 'JEEP-001', 12500.00, 2500.00, 'Available'),
('Car', 'CAR-001', 10000.00, 2000.00, 'Available'),
('Three Wheeler', 'TW-001', 1500.00, 1500.00, 'Available');

-- Verify the insertion
SELECT * FROM Vehicle;
