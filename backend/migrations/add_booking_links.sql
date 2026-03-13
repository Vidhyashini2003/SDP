-- Migration: Add Room Booking Links to Services
-- Purpose: Link food orders, activities, and vehicle hire to room bookings
-- Author: Hotel Management System Reorganization
-- Date: 2026-01-30

-- ============================================
-- BACKUP REMINDER
-- ============================================
-- IMPORTANT: Backup your database before running this migration!
-- Run: mysqldump -u root -p hotel_management > backup_before_migration.sql

-- ============================================
-- 1. Add rb_id to foodorder table
-- ============================================

-- Check if column already exists (safety check)
SET @dbname = DATABASE();
SET @tablename = 'foodorder';
SET @columnname = 'rb_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column rb_id already exists in foodorder" AS message;',
  'ALTER TABLE foodorder 
   ADD COLUMN rb_id INT NULL COMMENT "Links to room booking - NULL for standalone/legacy orders";'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint (only if column was just added or exists without FK)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'foodorder')
      AND (COLUMN_NAME = 'rb_id')
      AND (CONSTRAINT_NAME LIKE 'fk_%')
  ) > 0,
  'SELECT "Foreign key already exists on foodorder.rb_id" AS message;',
  'ALTER TABLE foodorder 
   ADD CONSTRAINT fk_foodorder_roombooking 
   FOREIGN KEY (rb_id) REFERENCES roombooking(rb_id) 
   ON DELETE SET NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 2. Add rb_id to activitybooking table
-- ============================================

SET @tablename = 'activitybooking';
SET @columnname = 'rb_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column rb_id already exists in activitybooking" AS message;',
  'ALTER TABLE activitybooking 
   ADD COLUMN rb_id INT NULL COMMENT "Links to room booking - NULL for legacy bookings";'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'activitybooking')
      AND (COLUMN_NAME = 'rb_id')
      AND (CONSTRAINT_NAME LIKE 'fk_%')
  ) > 0,
  'SELECT "Foreign key already exists on activitybooking.rb_id" AS message;',
  'ALTER TABLE activitybooking 
   ADD CONSTRAINT fk_activitybooking_roombooking 
   FOREIGN KEY (rb_id) REFERENCES roombooking(rb_id) 
   ON DELETE SET NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 3. Add rb_id to vehiclebooking table
-- ============================================

SET @tablename = 'vehiclebooking';
SET @columnname = 'rb_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "Column rb_id already exists in vehiclebooking" AS message;',
  'ALTER TABLE vehiclebooking 
   ADD COLUMN rb_id INT NULL COMMENT "Links to room booking - NULL for legacy bookings";'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'vehiclebooking')
      AND (COLUMN_NAME = 'rb_id')
      AND (CONSTRAINT_NAME LIKE 'fk_%')
  ) > 0,
  'SELECT "Foreign key already exists on vehiclebooking.rb_id" AS message;',
  'ALTER TABLE vehiclebooking 
   ADD CONSTRAINT fk_vehiclebooking_roombooking 
   FOREIGN KEY (rb_id) REFERENCES roombooking(rb_id) 
   ON DELETE SET NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 4. Create indices for better query performance
-- ============================================

-- Index on foodorder.rb_id
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'foodorder')
      AND (INDEX_NAME = 'idx_foodorder_rb_booking')
  ) > 0,
  'SELECT "Index idx_foodorder_rb_booking already exists" AS message;',
  'CREATE INDEX idx_foodorder_rb_booking ON foodorder(rb_id);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Index on activitybooking.rb_id
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'activitybooking')
      AND (INDEX_NAME = 'idx_activitybooking_rb_booking')
  ) > 0,
  'SELECT "Index idx_activitybooking_rb_booking already exists" AS message;',
  'CREATE INDEX idx_activitybooking_rb_booking ON activitybooking(rb_id);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Index on vehiclebooking.rb_id
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = 'vehiclebooking')
      AND (INDEX_NAME = 'idx_vehiclebooking_rb_booking')
  ) > 0,
  'SELECT "Index idx_vehiclebooking_rb_booking already exists" AS message;',
  'CREATE INDEX idx_vehiclebooking_rb_booking ON vehiclebooking(rb_id);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 5. Verification Queries
-- ============================================

-- Show updated table structures
SELECT 'foodorder table structure:' AS info;
DESCRIBE foodorder;

SELECT 'activitybooking table structure:' AS info;
DESCRIBE activitybooking;

SELECT 'vehiclebooking table structure:' AS info;
DESCRIBE vehiclebooking;

-- Show foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_NAME IN ('foodorder', 'activitybooking', 'vehiclebooking')
    AND COLUMN_NAME = 'rb_id';

-- ============================================
-- Migration Notes
-- ============================================

-- What this migration does:
-- 1. Adds rb_id (room booking ID) column to foodorder, activitybooking, vehiclebooking
-- 2. Adds order_type column to foodorder to distinguish pre-booked vs during-stay orders
-- 3. Creates foreign key constraints linking services to roombooking table
-- 4. Creates indices for better query performance
-- 5. Uses safe "IF NOT EXISTS" logic to prevent errors if re-run
-- 6. Sets ON DELETE SET NULL to preserve service records if room booking is deleted

-- Existing data:
-- - All existing records will have rb_id = NULL (grandfathered)
-- - They represent standalone/legacy bookings before this system change
-- - New bookings will be required to link to a room booking

-- To rollback (if needed):
-- ALTER TABLE foodorder DROP FOREIGN KEY fk_foodorder_roombooking;
-- ALTER TABLE foodorder DROP COLUMN rb_id, DROP COLUMN order_type;
-- ALTER TABLE activitybooking DROP FOREIGN KEY fk_activitybooking_roombooking;
-- ALTER TABLE activitybooking DROP COLUMN rb_id;
-- ALTER TABLE vehiclebooking DROP FOREIGN KEY fk_vehiclebooking_roombooking;
-- ALTER TABLE vehiclebooking DROP COLUMN rb_id;
