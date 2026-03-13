-- Add meal_type column to menuitem table
ALTER TABLE menuitem 
ADD COLUMN meal_type ENUM('Breakfast', 'Lunch', 'Dinner', 'All Day') DEFAULT 'All Day' AFTER item_category;

-- Update existing items with appropriate meal types
-- Breakfast items
UPDATE menuitem SET meal_type = 'Breakfast' WHERE item_name IN ('Dosa', 'Pol Sambol & Hoppers', 'Chicken Bun');

-- Lunch/Dinner items  
UPDATE menuitem SET meal_type = 'Dinner' WHERE item_name IN ('Koththu Roti', 'Fried Rice');

-- Display updated items
SELECT item_id, item_name, item_category, meal_type, item_price, item_availability FROM menuitem;
