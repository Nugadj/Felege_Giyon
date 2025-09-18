export interface Booking {
  id: string;
  seat_number: number;
  passenger_name: string;
  passenger_phone: string;
}

export interface Bus {
  total_seats: number;
  name: string;
  amenities: string[];
}

export interface Trip {
  id: string;
  destination: string;
  origin: string;
  departure_time: string;
  buses: Bus;
  bookings: { id: string; seat_number: number }[];
  receiverName?: string;
  routeInfo?: string;
  tripNumber?: string;
}
