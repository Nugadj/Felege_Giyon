-- Create routes table
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km INTEGER,
  estimated_duration_hours DECIMAL(3,1),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- RLS policies for routes (all authenticated users can read)
CREATE POLICY "routes_select_all" ON public.routes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "routes_insert_admin" ON public.routes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "routes_update_admin" ON public.routes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "routes_delete_admin" ON public.routes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add route_id to trips table
ALTER TABLE public.trips ADD COLUMN route_id UUID REFERENCES public.routes(id);

-- Insert some sample routes
INSERT INTO public.routes (name, origin, destination, distance_km, estimated_duration_hours, description) VALUES
('Addis Ababa - Bahir Dar', 'Addis Ababa', 'Bahir Dar', 565, 8.5, 'Main route to Bahir Dar via Debre Markos'),
('Addis Ababa - Gondar', 'Addis Ababa', 'Gondar', 727, 11.0, 'Route to Gondar via Bahir Dar'),
('Addis Ababa - Mekelle', 'Addis Ababa', 'Mekelle', 783, 12.0, 'Northern route to Mekelle'),
('Addis Ababa - Hawassa', 'Addis Ababa', 'Hawassa', 275, 4.5, 'Southern route to Hawassa'),
('Addis Ababa - Jimma', 'Addis Ababa', 'Jimma', 346, 6.0, 'Western route to Jimma'),
('Bahir Dar - Gondar', 'Bahir Dar', 'Gondar', 180, 3.0, 'Lake Tana to Gondar route'),
('Hawassa - Arba Minch', 'Hawassa', 'Arba Minch', 275, 4.5, 'Southern lakes route');