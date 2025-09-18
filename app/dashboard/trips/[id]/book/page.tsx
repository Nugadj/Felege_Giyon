import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Clock, User } from "lucide-react"
import Link from "next/link"
import BookingForm from "@/components/booking-form"

interface TripForBooking {
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

export default async function BookTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ seat?: string; action?: string }>
}) {
  const { id } = await params
  const { seat, action } = await searchParams // Get action from search params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get trip details
  const { data: trip } = await supabase
    .from("trips")
    .select(`
      *,
      buses (
        name,
        plate_number
      )
    `)
    .eq("id", id)
    .single()

  if (!trip) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href={seat ? `/dashboard/trips/${trip.id}/seats` : `/dashboard/trips/${trip.id}`}>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {action === "reserve" ? "Reserve Seat" : "Book Ticket"}
                </h1>
                <p className="text-xs text-gray-500">
                  {action === "reserve" ? "Reserve temporarily" : "Complete booking"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-orange-600">{trip.price.toLocaleString()} ETB</div>
              <div className="text-xs text-gray-500">
                {action === "reserve" ? "Free reservation" : "Total amount"}
              </div>
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

            {/* Bus & Seat Info */}
            <div className="bg-white/80 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">{trip.buses.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{trip.buses.plate_number}</div>
                </div>
                {seat && (
                  <Badge
                    className={`${
                      action === "reserve" 
                        ? "bg-orange-500 text-white" 
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    Seat {seat}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form - Mobile Optimized */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <User className="w-5 h-5" />
              {action === "reserve" ? "Reservation Details" : "Passenger Information"}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {action === "reserve"
                ? "Provide basic details to reserve this seat"
                : "Please provide the passenger details for this booking"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm tripId={trip.id} selectedSeat={seat ? Number.parseInt(seat) : null} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
