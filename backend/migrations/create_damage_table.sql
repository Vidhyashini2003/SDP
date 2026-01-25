CREATE TABLE IF NOT EXISTS Damage (
    damage_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    reported_by VARCHAR(50), -- Role e.g., 'Receptionist', 'Driver'
    damage_type ENUM('Room', 'Food', 'Vehicle', 'Other') NOT NULL,
    description TEXT,
    charge_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id) ON DELETE CASCADE
);
