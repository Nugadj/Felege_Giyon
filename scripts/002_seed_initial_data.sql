-- Insert sample buses
INSERT INTO public.buses (name, plate_number, total_seats, amenities) VALUES
('Selam Bus', 'ET-001-AA', 51, ARRAY['wifi', 'breakfast', 'usb_charger']),
('Habesha Express', 'ET-002-AA', 51, ARRAY['wifi', 'usb_charger']),
('Golden Bus', 'ET-003-AA', 45, ARRAY['wifi', 'breakfast'])
ON CONFLICT (plate_number) DO NOTHING;

-- Insert sample trips (using bus IDs from above)
INSERT INTO public.trips (bus_id, origin, destination, departure_time, arrival_time, price, status)
SELECT 
  b.id,
  'Addis Ababa',
  'Adwa',
  '2025-09-14 03:30:00+03',
  '2025-09-14 22:50:00+03',
  3750.00,
  'scheduled'
FROM public.buses b 
WHERE b.plate_number = 'ET-001-AA'
ON CONFLICT DO NOTHING;

INSERT INTO public.trips (bus_id, origin, destination, departure_time, arrival_time, price, status)
SELECT 
  b.id,
  'Addis Ababa',
  'Mekelle',
  '2025-09-14 06:00:00+03',
  '2025-09-14 18:30:00+03',
  2800.00,
  'scheduled'
FROM public.buses b 
WHERE b.plate_number = 'ET-002-AA'
ON CONFLICT DO NOTHING;
