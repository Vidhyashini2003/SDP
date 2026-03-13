-- Update room prices with realistic values
UPDATE room SET room_price_per_day = 15000 WHERE room_type = 'Suite';
UPDATE room SET room_price_per_day = 10000 WHERE room_type = 'Deluxe Room';
UPDATE room SET room_price_per_day = 8000 WHERE room_type = 'Double Bedroom with Sea View';
UPDATE room SET room_price_per_day = 7000 WHERE room_type = 'Triple Bed with Sea View';
UPDATE room SET room_price_per_day = 6000 WHERE room_type = 'Double Bedroom without Sea View';
UPDATE room SET room_price_per_day = 5000 WHERE room_type = 'Standard Room';

-- Display updated rooms
SELECT room_id, room_number, room_type, room_price_per_day, room_status FROM room;
