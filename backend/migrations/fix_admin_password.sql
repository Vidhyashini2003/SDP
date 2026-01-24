-- Fix Admin Password
-- Delete existing admin and re-insert with correct hash

USE HotelManagement;

DELETE FROM Admin WHERE admin_email = 'admin01@gmail.com';

INSERT INTO Admin (admin_name, admin_email, admin_phone, admin_password, admin_address)
VALUES ('Akshayan Mukunthan', 'admin01@gmail.com', '0761234567', '$2b$10$1Tr1cAuenGc4miKOfO1uwOKuUgSuq8nAMqaVu8kpabIyz/04WWpSa', '65, Orrshill, Trincomalee');

-- Verify the insertion
SELECT admin_id, admin_name, admin_email FROM Admin WHERE admin_email = 'admin01@gmail.com';
