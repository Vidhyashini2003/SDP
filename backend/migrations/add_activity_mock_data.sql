-- First, let's add a description column to make activities more informative
-- (Optional - run this if you want descriptions on activity cards)
ALTER TABLE Activity 
ADD COLUMN activity_description TEXT AFTER activity_name,
ADD COLUMN activity_duration VARCHAR(50) AFTER activity_price_per_hour;

-- Now insert mock data for Sri Lankan hotel activities
INSERT INTO Activity (activity_name, activity_description, activity_price_per_hour, activity_duration, activity_time, activity_status) VALUES
-- Water Sports
('Jet Skiing', 'Experience the thrill of riding the waves on a high-speed jet ski along the pristine coastline', 3500.00, '30 minutes', '8:00 AM - 6:00 PM', 'Available'),
('Snorkeling', 'Explore the vibrant underwater world with guided snorkeling tours in crystal clear waters', 2000.00, '1 hour', '9:00 AM - 5:00 PM', 'Available'),
('Scuba Diving', 'Dive deep into the ocean and discover colorful coral reefs and marine life', 8000.00, '2 hours', '8:00 AM - 4:00 PM', 'Available'),
('Banana Boat Ride', 'Fun-filled banana boat ride for the whole family, hold on tight!', 1500.00, '15 minutes', '10:00 AM - 6:00 PM', 'Available'),
('Kayaking', 'Peaceful kayaking experience along the calm coastal waters', 1200.00, '1 hour', '7:00 AM - 7:00 PM', 'Available'),

-- Beach & Boat Activities
('Sunset Boat Tour', 'Romantic sunset cruise along the coast with refreshments', 5000.00, '2 hours', '5:00 PM - 7:00 PM', 'Available'),
('Fishing Trip', 'Deep sea fishing adventure with experienced local fishermen', 6000.00, '3 hours', '6:00 AM - 10:00 AM', 'Available'),
('Beach Volleyball', 'Competitive beach volleyball games with professional equipment', 500.00, '1 hour', '9:00 AM - 7:00 PM', 'Available'),

-- Cultural & Sightseeing
('Cultural Tour', 'Visit ancient temples, local markets, and traditional Sri Lankan villages', 4000.00, '4 hours', '9:00 AM - 2:00 PM', 'Available'),
('Elephant Safari', 'Guided safari to see elephants in their natural habitat at nearby national park', 7000.00, '3 hours', '6:00 AM - 10:00 AM', 'Available'),
('Spice Garden Tour', 'Explore aromatic spice gardens and learn about Sri Lankan cuisine', 2500.00, '2 hours', '10:00 AM - 3:00 PM', 'Available'),
('Swami Rock Visit & View Point Visit', 'Cultural tour to historic temple and scenic rock', 250.00, '1 hour', '', 'Available'),

-- Wellness & Relaxation
('Ayurvedic Spa', 'Traditional Ayurvedic massage and spa treatments for relaxation', 4500.00, '1.5 hours', '9:00 AM - 8:00 PM', 'Available'),
('Yoga Session', 'Beachside yoga sessions for mindfulness and wellness', 1500.00, '1 hour', '6:00 AM - 8:00 AM', 'Available'),
('Meditation Class', 'Guided meditation sessions in a peaceful garden setting', 1000.00, '45 minutes', '6:30 AM - 7:30 AM', 'Available'),

-- Adventure Activities
('Surfing Lessons', 'Learn to surf with professional instructors on perfect waves', 3000.00, '2 hours', '8:00 AM - 5:00 PM', 'Available'),
('Parasailing', 'Soar high above the ocean with breathtaking aerial views', 5500.00, '20 minutes', '10:00 AM - 5:00 PM', 'Available'),
('Water Skiing', 'Adrenaline-pumping water skiing experience for all skill levels', 3200.00, '30 minutes', '9:00 AM - 6:00 PM', 'Available');

-- If you don't want to add the description and duration columns, use this simpler version instead:
-- DELETE FROM Activity; -- Clear any existing data first
-- 
-- INSERT INTO Activity (activity_name, activity_price_per_hour, activity_time, activity_status) VALUES
-- ('Jet Skiing', 3500.00, '8:00 AM - 6:00 PM', 'Available'),
-- ('Snorkeling', 2000.00, '9:00 AM - 5:00 PM', 'Available'),
-- ('Scuba Diving', 8000.00, '8:00 AM - 4:00 PM', 'Available'),
-- ('Banana Boat Ride', 1500.00, '10:00 AM - 6:00 PM', 'Available'),
-- ('Kayaking', 1200.00, '7:00 AM - 7:00 PM', 'Available'),
-- ('Sunset Boat Tour', 5000.00, '5:00 PM - 7:00 PM', 'Available'),
-- ('Fishing Trip', 6000.00, '6:00 AM - 10:00 AM', 'Available'),
-- ('Beach Volleyball', 500.00, '9:00 AM - 7:00 PM', 'Available'),
-- ('Cultural Tour', 4000.00, '9:00 AM - 2:00 PM', 'Available'),
-- ('Elephant Safari', 7000.00, '6:00 AM - 10:00 AM', 'Available'),
-- ('Spice Garden Tour', 2500.00, '10:00 AM - 3:00 PM', 'Available'),
-- ('Ayurvedic Spa', 4500.00, '9:00 AM - 8:00 PM', 'Available'),
-- ('Yoga Session', 1500.00, '6:00 AM - 8:00 AM', 'Available'),
-- ('Meditation Class', 1000.00, '6:30 AM - 7:30 AM', 'Available'),
-- ('Surfing Lessons', 3000.00, '8:00 AM - 5:00 PM', 'Available'),
-- ('Parasailing', 5500.00, '10:00 AM - 5:00 PM', 'Available'),
-- ('Water Skiing', 3200.00, '9:00 AM - 6:00 PM', 'Available');
