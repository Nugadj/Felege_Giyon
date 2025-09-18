-- Add description column to trips table
ALTER TABLE trips ADD COLUMN description TEXT;

-- Update existing trips with a default description if needed
UPDATE trips SET description = 'Trip from ' || origin || ' to ' || destination WHERE description IS NULL;
