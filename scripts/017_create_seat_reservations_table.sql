-- Create seat_reservations table
CREATE TABLE IF NOT EXISTS public.seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'disabled')) DEFAULT 'reserved',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(trip_id, seat_number)
);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Add RLS policies for seat_reservations
ALTER TABLE public.seat_reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "seat_reservations_select_all" ON public.seat_reservations;
DROP POLICY IF EXISTS "seat_reservations_insert_authenticated" ON public.seat_reservations;
DROP POLICY IF EXISTS "seat_reservations_delete_own" ON public.seat_reservations;
DROP POLICY IF EXISTS "seat_reservations_insert_admin" ON public.seat_reservations;
DROP POLICY IF EXISTS "seat_reservations_delete_admin" ON public.seat_reservations;


-- RLS Policies
CREATE POLICY "seat_reservations_select_all" ON public.seat_reservations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "seat_reservations_insert_own_or_admin" ON public.seat_reservations
  FOR INSERT WITH CHECK (
    (auth.uid() = created_by) OR (public.is_admin())
  );

CREATE POLICY "seat_reservations_delete_own_or_admin" ON public.seat_reservations
  FOR DELETE USING (
    (auth.uid() = created_by) OR (public.is_admin())
  );

-- Function to remove expired seat reservations
CREATE OR REPLACE FUNCTION public.delete_expired_seat_reservations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.seat_reservations
  WHERE status = 'reserved' AND expires_at IS NOT NULL AND expires_at < NOW();
END;
$$;
