import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Clock, Wifi, Coffee, Zap } from "lucide-react"
import Link from "next/link"
import EnhancedSeatMap from "@/components/enhanced-seat-map"

interface TripWithSeats {
  id: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  price: number
  status: string
  buses: {
    name: string
    plate_number: string
    total_seats: number
    amenities: string[]
  }
  bookings: {
    seat_number: number
    status: string
  }[]
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get trip details with bookings
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      buses(*),
      bookings(id, seat_number)
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    redirect("/dashboard")
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return <Wifi className="w-4 h-4" />
      case "breakfast":
        return <Coffee className="w-4 h-4" />
      case "usb_charger":
        return <Zap className="w-4 h-4" />
      default:
        return null
    }
  }

  // Provide bookedSeats in the shape EnhancedSeatMap expects: { seat_number, booking_id }
  const bookedSeats = Array.isArray(trip.bookings)
    ? trip.bookings.map((booking: any) => ({ seat_number: booking.seat_number, booking_id: booking.id }))
    : [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href={`/dashboard/trips/${trip.id}`}>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Select Seat</h1>
                <p className="text-xs text-gray-500">Choose your preferred seat</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-orange-600">{trip.price.toLocaleString()} ETB</div>
              <div className="text-xs text-gray-500">per seat</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Trip Summary Card - Mobile First */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            {/* Route */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="font-bold text-gray-900">{trip.origin}</span>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">{trip.destination}</span>
              </div>
              <div className="text-sm text-gray-600">{formatDate(trip.departure_time)}</div>
            </div>

            {/* Time & Bus Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/80 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Departure</span>
                </div>
                <div className="font-bold text-gray-900">{formatTime(trip.departure_time)}</div>
              </div>
              <div className="bg-white/80 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Arrival</span>
                </div>
                <div className="font-bold text-gray-900">{formatTime(trip.arrival_time)}</div>
              </div>
            </div>

            {/* Bus & Amenities */}
            <div className="bg-white/80 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">{trip.buses.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{trip.buses.plate_number}</div>
                </div>
                <Badge className="bg-blue-500 text-white">{trip.buses.total_seats} seats</Badge>
              </div>
              {Array.isArray(trip.buses.amenities) && trip.buses.amenities.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {trip.buses.amenities.map((amenity: string) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {getAmenityIcon(amenity)}
                      <span className="ml-1">{amenity.replace("_", " ")}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Seat Map - Mobile Optimized */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MapPin className="w-5 h-5" />
              Select Your Seat
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Tap on an available seat to select it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedSeatMap
              tripId={trip.id}
              totalSeats={trip.buses.total_seats}
              bookedSeats={bookedSeats}
              busName={trip.buses.name}
              amenities={trip.buses.amenities}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}