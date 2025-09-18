"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, Bus, Plus } from "lucide-react"
import Link from "next/link"

interface Trip {
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
  bookings: { id: string }[]
}

interface RealTimeTripsClientProps {
  initialTrips: Trip[]
  userRole: string
}

export function RealTimeTripsClient({ initialTrips, userRole }: RealTimeTripsClientProps) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel("trips-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        refreshTrips()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        refreshTrips()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshTrips = async () => {
    try {
      const { data: trips } = await supabase
        .from("trips")
        .select(`
          *,
          buses (
            name,
            plate_number,
            total_seats,
            amenities
          ),
          bookings (id)
        `)
        .order("departure_time", { ascending: true })

      if (trips) {
        setTrips(trips)
      }
    } catch (error) {
      console.error("Error refreshing trips:", error)
    }
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return "📶"
      case "breakfast":
        return "🍽️"
      case "usb_charger":
        return "🔌"
      default:
        return "✓"
    }
  }

  return (
    <div className="space-y-6">
      {/* Trips Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Bus className="w-5 h-5" />
            Available Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{trips.length}</div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trips.filter(trip => trip.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {trips.reduce((sum, trip) => sum + (trip.buses.total_seats - trip.bookings.length), 0)}
              </div>
              <div className="text-sm text-gray-600">Available Seats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {trips.reduce((sum, trip) => sum + trip.bookings.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trips Grid - Mobile First */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips?.map((trip: Trip) => (
          <Card key={trip.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
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

              {/* Route */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{trip.origin}</div>
                    <div className="text-xs text-gray-600">From</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-300"></div>
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <div className="w-8 h-0.5 bg-blue-300"></div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{trip.destination}</div>
                    <div className="text-xs text-gray-600">To</div>
                  </div>
                </div>
              </div>

              {/* Trip Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">{trip.price.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">ETB</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-600">{trip.buses.total_seats - trip.bookings.length}</div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Depart: {formatTime(trip.departure_time)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Arrive: {formatTime(trip.arrival_time)}</span>
                  </div>
                  <div className="col-span-2 text-center pt-1 border-t border-gray-200">
                    {formatDate(trip.departure_time)}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {trip.buses.amenities && trip.buses.amenities.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="text-xs text-gray-600 mb-2">Amenities</div>
                  <div className="flex gap-1 flex-wrap">
                    {trip.buses.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {getAmenityIcon(amenity)} {amenity.replace("_", " ")}
                      </Badge>
                    ))}
                    {trip.buses.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{trip.buses.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Link href={`/dashboard/trips/${trip.id}/book`}>
                    Book Now
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                  <Link href={`/dashboard/trips/${trip.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!trips || trips.length === 0 && (
        <Card className="bg-white/90 backdrop-blur-sm text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Trips Available</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              There are currently no trips scheduled. Check back later for available routes.
            </p>
            {userRole === "admin" && (
              <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/trips/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Trip
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Trip Button - For Admins */}
      {userRole === "admin" && trips && trips.length > 0 && (
        <div className="text-center pt-6">
          <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
            <Link href="/admin/trips/new">
              <Plus className="w-4 h-4 mr-2" />
              Add New Trip
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
