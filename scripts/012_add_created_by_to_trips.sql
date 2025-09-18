-- Add created_by column to trips table
ALTER TABLE trips ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update existing trips to have a default created_by value (optional)
-- You can set this to a specific admin user ID if needed
UPDATE trips SET created_by = (SELECT id FROM auth.users LIMIT 1) WHERE created_by IS NULL;
