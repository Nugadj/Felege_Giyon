-- Add new fields to bookings table for ticket ID, amount paid, and note
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS ticket_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS note TEXT;

-- Create index on ticket_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_id ON bookings(ticket_id);
