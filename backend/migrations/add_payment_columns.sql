-- Add payment card columns to Guest table
ALTER TABLE Guest 
ADD COLUMN card_number VARCHAR(19),
ADD COLUMN card_holder_name VARCHAR(100),
ADD COLUMN card_expiry VARCHAR(5),
ADD COLUMN card_cvv VARCHAR(3);

-- Note: In production, card data should be encrypted and stored securely
-- Consider using a payment gateway service instead of storing raw card data
