-- Admin Mock Data
-- Insert default admin user for development

USE HotelManagement;

-- Insert admin user (plain text password for development)
INSERT INTO Admin (admin_name, admin_email, admin_password) VALUES
('Admin User', 'admin01@gmail.com', 'admin01');

-- Verify the insertion
SELECT * FROM Admin;
