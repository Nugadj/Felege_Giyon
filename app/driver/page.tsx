import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, Bus, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface TripAssignment {
  id: string
  status: string
  notes: string
  assigned_at: string
  trips: {
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
    }
    bookings: { id: string }[]
  }
}

export default async function DriverDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is a driver
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "driver") {
    redirect("/dashboard")
  }

  // Get driver information
  const { data: driver } = await supabase.from("drivers").select("*").eq("user_id", user.id).single()

  if (!driver) {
    redirect("/dashboard")
  }

  // Get trip assignments for this driver
  const { data: assignments } = await supabase
    .from("trip_assignments")
    .select(`
      *,
      trips (
        *,
        buses (
          name,
          plate_number,
          total_seats
        ),
        bookings (id)
      )
    `)
    .eq("driver_id", driver.id)
    .order("assigned_at", { ascending: false })

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTripStatusColor = (status: string) => {
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

  // Calculate statistics
  const totalAssignments = assignments?.length || 0
  const pendingAssignments = assignments?.filter((a) => a.status === "assigned").length || 0
  const acceptedAssignments = assignments?.filter((a) => a.status === "accepted").length || 0
  const completedAssignments = assignments?.filter((a) => a.status === "completed").length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your trip assignments and schedule</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">License: {driver.license_number}</p>
                <p className="text-xs text-gray-500">Status: {driver.status}</p>
              </div>
              <form action="/auth/logout" method="post">
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssignments}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingAssignments}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{acceptedAssignments}</div>
              <p className="text-xs text-muted-foreground">Ready to drive</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Bus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completedAssignments}</div>
              <p className="text-xs text-muted-foreground">Trips finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Trip Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Assignments</CardTitle>
            <CardDescription>Your assigned trips and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments?.map((assignment: TripAssignment) => {
                const trip = assignment.trips
                const bookedSeats = trip.bookings?.length || 0
                const availableSeats = trip.buses.total_seats - bookedSeats
                const occupancyRate =
                  trip.buses.total_seats > 0 ? ((bookedSeats / trip.buses.total_seats) * 100).toFixed(1) : 0

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {trip.origin} → {trip.destination}
                          </span>
                        </div>
                        <Badge className={getStatusColor(assignment.status)} variant="secondary">
                          {assignment.status}
                        </Badge>
                        <Badge className={getTripStatusColor(trip.status)} variant="outline">
                          {trip.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Bus className="w-4 h-4" />
                          <span>
                            {trip.buses.name} ({trip.buses.plate_number})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatDate(trip.departure_time)} at {formatTime(trip.departure_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {bookedSeats}/{trip.buses.total_seats} passengers ({occupancyRate}%)
                          </span>
                        </div>
                      </div>
                      {assignment.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          <strong>Notes:</strong> {assignment.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">{trip.price} ETB</span>
                      <div className="flex gap-2 ml-4">
                        {assignment.status === "assigned" && (
                          <>
                            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                              <Link href={`/driver/assignments/${assignment.id}/accept`}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Link>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Link href={`/driver/assignments/${assignment.id}/decline`}>
                                <XCircle className="w-4 h-4 mr-1" />
                                Decline
                              </Link>
                            </Button>
                          </>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/driver/trips/${trip.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {(!assignments || assignments.length === 0) && (
                <div className="text-center py-12">
                  <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-600">You don't have any trip assignments at the moment.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
