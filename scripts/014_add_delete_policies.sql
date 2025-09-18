-- Add missing DELETE policies for buses and trips tables

-- DELETE policy for buses (admin only)
CREATE POLICY "buses_delete_admin" ON public.buses FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- DELETE policy for trips (admin only)
CREATE POLICY "trips_delete_admin" ON public.trips FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- DELETE policy for bookings (authenticated users)
CREATE POLICY "bookings_delete_authenticated" ON public.bookings FOR DELETE USING (auth.uid() IS NOT NULL);