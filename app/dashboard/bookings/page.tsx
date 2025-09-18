import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, User, Phone, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

interface BookingListItem {
  id: string
  seat_number: number
  passenger_name: string
  passenger_phone: string
  status: string
  created_at: string
  trips: {
    id: string
    origin: string
    destination: string
    departure_time: string
    price: number
    buses: {
      name: string
      plate_number: string
    }
  }
}

export default async function BookingsListPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get all bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      trips (
        id,
        origin,
        destination,
        departure_time,
        price,
        buses (
          name,
          plate_number
        )
      )
    `)
    .order("created_at", { ascending: false })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3">
            <Button asChild variant="ghost" size="sm" className="self-start">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">All Bookings</h1>
              <p className="text-xs text-gray-600">Manage passenger bookings and reservations</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Search and Filters */}
        <Card className="mb-3 sm:mb-4">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base">Search Bookings</CardTitle>
            <CardDescription className="text-xs">Find bookings by passenger name, phone, or booking ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search by name, phone, or booking ID..." className="pl-10 h-10" />
              </div>
              <Button className="h-10">Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-2 sm:space-y-3">
          {bookings?.map((booking: BookingListItem) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                      {booking.seat_number}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-500" />
                        <span className="font-semibold text-xs sm:text-sm truncate">{booking.passenger_name}</span>
                        <Badge className={getStatusColor(booking.status)} variant="secondary">
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{booking.passenger_phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Booked {formatDate(booking.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="font-medium text-xs sm:text-sm">
                        {booking.trips.origin} → {booking.trips.destination}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {formatDate(booking.trips.departure_time)} at {formatTime(booking.trips.departure_time)}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{booking.trips.buses.name}</div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <div className="text-sm sm:text-base font-bold text-orange-600">
                        {booking.trips.price.toLocaleString()} ETB
                      </div>
                      <Button asChild size="sm" className="text-xs">
                        <Link href={`/dashboard/bookings/${booking.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!bookings ||
          (bookings.length === 0 && (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-sm text-gray-500 mb-4">There are currently no bookings in the system.</p>
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
      </main>
    </div>
  )
}
