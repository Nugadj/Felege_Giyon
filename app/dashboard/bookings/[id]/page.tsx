import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, User, Phone, CreditCard, Calendar, Bus, Users, Receipt, DollarSign } from "lucide-react"
import Link from "next/link"
// PDF rendering is handled server-side; avoid importing react-pdf in client-rendered pages

interface BookingDetails {
  id: string
  seat_number: number
  passenger_name: string
  passenger_phone: string
  passenger_id_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  status: string
  created_at: string
  ticket_id: string | null
  amount_paid: number | null
  note: string | null
  trips: {
    id: string
    origin: string
    destination: string
    departure_time: string
    arrival_time: string
    price: number
    buses: {
      name: string
      plate_number: string
    }
  }
}

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      *,
      trips (
        id,
        origin,
        destination,
        departure_time,
        arrival_time,
        price,
        buses (
          name,
          plate_number
        )
      )
    `)
    .eq("id", id)
    .single()

  if (!booking) {
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
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
                <h1 className="text-lg font-bold text-gray-900">Booking Details</h1>
                <p className="text-xs text-gray-500">ID: {booking.id.slice(0, 8)}</p>
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)} variant="secondary">
              {booking.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Trip Information */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">{booking.trips.buses.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{booking.trips.buses.plate_number}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Route Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg">{booking.trips.origin}</div>
                  <div className="text-xs text-gray-600">{formatTime(booking.trips.departure_time)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-300"></div>
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <div className="w-8 h-0.5 bg-blue-300"></div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg">{booking.trips.destination}</div>
                  <div className="text-xs text-gray-600">{formatTime(booking.trips.arrival_time)}</div>
                </div>
              </div>
              <div className="text-center mt-3 pt-3 border-t border-blue-200">
                <div className="text-sm text-gray-700">{formatDate(booking.trips.departure_time)}</div>
                <div className="text-xs text-gray-500">
                  Duration: {Math.round((new Date(booking.trips.arrival_time).getTime() - new Date(booking.trips.departure_time).getTime()) / (1000 * 60 * 60))}h {Math.round(((new Date(booking.trips.arrival_time).getTime() - new Date(booking.trips.departure_time).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
                </div>
              </div>
            </div>

            {/* Seat and Price */}
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {booking.seat_number}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Seat {booking.seat_number}</div>
                  <div className="text-xs text-gray-600">Reserved seat</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{booking.trips.price.toLocaleString()} ETB</div>
                <div className="text-xs text-gray-600">Total amount</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passenger Information */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <User className="w-5 h-5" />
              Passenger Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
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
                    <span className="text-xs text-gray-600">ID Number</span>
                    <span className="font-medium text-sm flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-gray-500" />
                      {booking.passenger_id_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Receipt className="w-5 h-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Ticket ID</span>
                  <span className="font-medium text-sm">{booking.ticket_id || `FG${booking.id.slice(-6)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Amount Paid</span>
                  <span className="font-bold text-sm text-green-600">
                    {booking.amount_paid ? `${booking.amount_paid.toLocaleString()} ETB` : `${booking.trips.price.toLocaleString()} ETB`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Booked</span>
                  <span className="font-medium text-sm">{formatDateTime(booking.created_at)}</span>
                </div>
              </div>
            </div>
            {booking.note && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Note</div>
                <div className="text-sm font-medium">{booking.note}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {(booking.emergency_contact_name || booking.emergency_contact_phone) && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Users className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="grid gap-2">
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
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.status === "booked" && (
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                Check In Passenger
              </Button>
            )}
            <Button variant="outline" className="w-full">
              Send SMS Confirmation
            </Button>
            {booking.status === "booked" && (
              <Button variant="destructive" className="w-full">
                Cancel Booking
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
