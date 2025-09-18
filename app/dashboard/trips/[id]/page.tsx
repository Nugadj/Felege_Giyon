import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Users, Bus, Calendar, Phone, User, ArrowLeft, Receipt, DollarSign, CreditCard } from "lucide-react"
import Link from "next/link"
import EthiopianTripReceipt from "@/components/ethiopian-trip-receipt"
import PassengerCancelButton from "@/components/passenger-cancel-button"

interface TripDetails {
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
    id: string
    seat_number: number
    passenger_name: string
    passenger_phone: string
    passenger_id_number?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    ticket_id?: string
    amount_paid?: number
    note?: string
    status: string
  }[]
}

export default async function TripDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get trip details with bookings
  const { data: trip } = await supabase
    .from("trips")
    .select(`
      *,
      buses (
        name,
        plate_number,
        total_seats,
        amenities
      ),
      bookings (
        id,
        seat_number,
        passenger_name,
        passenger_phone,
        passenger_id_number,
        emergency_contact_name,
        emergency_contact_phone,
        ticket_id,
        amount_paid,
        note,
        status
      )
    `)
    .eq("id", id)
    .single()

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Trip not found</h1>
          <p className="text-gray-500">The requested trip could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
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
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "boarding":
        return "bg-yellow-100 text-yellow-800"
      case "departed":
        return "bg-green-100 text-green-800"
      case "arrived":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-800"
      case "checked_in":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const availableSeats = trip.buses.total_seats - trip.bookings.length;
  const totalRevenue = trip.bookings.reduce((sum: number, booking: TripDetails["bookings"][0]) => sum + (booking.amount_paid || trip.price), 0);

  // Determine if current user is an admin so we can show admin-only actions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const PassengerDetailsDialog = ({ booking }: { booking: TripDetails["bookings"][0] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
              {booking.seat_number}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm">{booking.passenger_name}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{booking.passenger_phone}</span>
              </div>
            </div>
          </div>
          <Badge className={`${getBookingStatusColor(booking.status)} text-xs`} variant="secondary">
            {booking.status.replace("_", " ")}
          </Badge>
        </div>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {booking.seat_number}
            </div>
            Seat {booking.seat_number}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            {booking.passenger_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Name</span>
                <span className="font-medium text-sm">{booking.passenger_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Phone</span>
                <span className="font-medium text-sm flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-500" />
                  {booking.passenger_phone}
                </span>
              </div>
              {booking.passenger_id_number && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">ID</span>
                  <span className="font-medium text-sm flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-gray-500" />
                    {booking.passenger_id_number}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Ticket ID</span>
                <span className="font-medium text-sm">{booking.ticket_id || `FG${booking.id.slice(-6)}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Amount</span>
                <span className="font-bold text-sm text-green-600">
                  {(booking.amount_paid || trip.price).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {booking.note && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Note</div>
              <div className="text-sm font-medium">{booking.note}</div>
            </div>
          )}

          {(booking.emergency_contact_name || booking.emergency_contact_phone) && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-2 font-medium">Emergency Contact</div>
              <div className="grid gap-1">
                {booking.emergency_contact_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Name</span>
                    <span className="font-medium text-sm">{booking.emergency_contact_name}</span>
                  </div>
                )}
                {booking.emergency_contact_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Phone</span>
                    <span className="font-medium text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-500" />
                      {booking.emergency_contact_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="pt-2 border-t">
              <PassengerCancelButton bookingId={booking.id} tripId={trip.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  // removed unused client placeholder; using `components/passenger-cancel-button.tsx` client component instead
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Trip Details</h1>
                <p className="text-xs text-gray-500">{trip.buses.name} - {trip.buses.plate_number}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Trip Overview Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{trip.buses.name}</div>
                  <div className="text-xs text-gray-600 font-mono">{trip.buses.plate_number}</div>
                </div>
              </div>
              <Badge 
                variant={trip.status === 'scheduled' ? 'default' : trip.status === 'departed' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {trip.status}
              </Badge>
            </div>

            {/* Route Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg">{trip.origin}</div>
                  <div className="text-xs text-gray-600">{formatTime(trip.departure_time)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-300"></div>
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <div className="w-8 h-0.5 bg-blue-300"></div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg">{trip.destination}</div>
                  <div className="text-xs text-gray-600">{formatTime(trip.arrival_time)}</div>
                </div>
              </div>
              <div className="text-center mt-3 pt-3 border-t border-blue-200">
                <div className="text-sm text-gray-700">{formatDate(trip.departure_time)}</div>
                <div className="text-xs text-gray-500">
                  Duration: {Math.round((new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime()) / (1000 * 60 * 60))}h {Math.round(((new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
                </div>
              </div>
            </div>

            {/* Price and Availability */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-green-600">{trip.price.toLocaleString()}</div>
                <div className="text-xs text-gray-600">ETB per seat</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">{availableSeats}</div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
            </div>

            {/* Amenities */}
            {trip.buses.amenities && trip.buses.amenities.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-2">Amenities</div>
                <div className="flex gap-1 flex-wrap">
                  {trip.buses.amenities.slice(0, 4).map((amenity: string) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity.replace("_", " ")}
                    </Badge>
                  ))}
                  {trip.buses.amenities.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{trip.buses.amenities.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link href={`/dashboard/trips/${trip.id}/book`}>
                Book Ticket
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
              <Link href={`/dashboard/trips/${trip.id}/seats`}>
                Seat Map
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Users className="w-5 h-5" />
              Trip Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/80 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-600">{trip.buses.total_seats}</div>
                <div className="text-xs text-gray-600">Total Seats</div>
              </div>
              <div className="bg-white/80 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-green-600">{trip.bookings.length}</div>
                <div className="text-xs text-gray-600">Booked</div>
              </div>
              <div className="bg-white/80 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600">{availableSeats}</div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
              <div className="bg-white/80 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">
                  {Math.round((trip.bookings.length / trip.buses.total_seats) * 100)}%
                </div>
                <div className="text-xs text-gray-600">Occupancy</div>
              </div>
            </div>
            <div className="bg-white/80 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} ETB</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers List */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="w-5 h-5" />
              Passengers ({trip.bookings.length})
            </CardTitle>
            <CardDescription>Tap passenger to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {trip.bookings.length > 0 ? (
              <div className="space-y-3">
                {trip.bookings
                  .sort((a: TripDetails["bookings"][0], b: TripDetails["bookings"][0]) => a.seat_number - b.seat_number)
                  .map((booking: TripDetails["bookings"][0]) => (
                    <PassengerDetailsDialog key={booking.id} booking={booking} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Passengers Yet</h3>
                <p className="text-gray-500 mb-6">This trip has no bookings yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ethiopian Receipt */}
        {trip.bookings.length > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Receipt className="w-5 h-5" />
                Ethiopian Receipt
              </CardTitle>
              <CardDescription>Generate official receipt in Amharic</CardDescription>
            </CardHeader>
            <CardContent>
              <EthiopianTripReceipt
                trip={trip}
                bookings={trip.bookings}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
