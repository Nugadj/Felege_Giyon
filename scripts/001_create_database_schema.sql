-- Create user profiles table for employee management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create buses table
CREATE TABLE IF NOT EXISTS public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL UNIQUE,
  total_seats INTEGER NOT NULL DEFAULT 51,
  amenities TEXT[] DEFAULT ARRAY['wifi', 'breakfast', 'usb_charger'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on buses
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- RLS policies for buses (all authenticated users can read)
CREATE POLICY "buses_select_all" ON public.buses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "buses_insert_admin" ON public.buses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "buses_update_admin" ON public.buses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- RLS policies for trips
CREATE POLICY "trips_select_all" ON public.trips FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "trips_insert_admin" ON public.trips FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "trips_update_admin" ON public.trips FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_id_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('booked', 'checked_in', 'cancelled')) DEFAULT 'booked',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, seat_number)
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "bookings_select_all" ON public.bookings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "bookings_insert_authenticated" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "bookings_update_authenticated" ON public.bookings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
