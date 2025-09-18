import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Route, MapPin, Clock, Ruler, Bus, Calendar } from "lucide-react"
import Link from "next/link"
import { DeleteRouteButton } from "@/components/delete-route-button"

interface RouteWithTrips {
  id: string
  name: string
  origin: string
  destination: string
  distance_km: number
  estimated_duration_hours: number
  description: string
  created_at: string
  trips: {
    id: string
    departure_time: string
    arrival_time: string
    status: string
    price: number
    available_seats: number
    buses: {
      name: string
      plate_number: string
    }
  }[]
}

export default async function RouteDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get route details with trips
  const { data: route, error } = await supabase
    .from("routes")
    .select(`
      *,
      trips (
        id,
        departure_time,
        arrival_time,
        status,
        price,
        available_seats,
        buses (
          name,
          plate_number
        )
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !route) {
    redirect("/admin/routes")
  }

  const routeData = route as RouteWithTrips

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-2 py-2 h-12">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link href="/admin/routes">
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span className="text-xs">Routes</span>
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-sm font-bold text-gray-900">{routeData.name}</h1>
              <p className="text-xs text-gray-600">Route Details</p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/routes/${routeData.id}/edit`}>Edit</Link>
              </Button>
              <DeleteRouteButton routeId={routeData.id} routeName={routeData.name} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Route Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Route className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl">{routeData.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {routeData.origin} → {routeData.destination}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">Distance</div>
                      <div className="font-medium">{routeData.distance_km || 'N/A'} km</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium">{routeData.estimated_duration_hours || 'N/A'}h</div>
                    </div>
                  </div>
                </div>

                {routeData.description && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Description</div>
                    <p className="text-gray-800">{routeData.description}</p>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-600 mb-2">Created</div>
                  <p className="text-gray-800">
                    {new Date(routeData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Trips ({routeData.trips?.length || 0})
                </CardTitle>
                <CardDescription>All trips scheduled for this route</CardDescription>
              </CardHeader>
              <CardContent>
                {routeData.trips && routeData.trips.length > 0 ? (
                  <div className="space-y-3">
                    {routeData.trips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {new Date(trip.departure_time).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(trip.departure_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(trip.arrival_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium">{trip.buses?.name}</div>
                            <div className="text-sm text-gray-600">{trip.buses?.plate_number}</div>
                          </div>
                          <Badge variant={
                            trip.status === 'scheduled' ? 'default' :
                            trip.status === 'active' ? 'secondary' :
                            trip.status === 'completed' ? 'outline' : 'destructive'
                          }>
                            {trip.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trips scheduled</h3>
                    <p className="text-gray-500 mb-4">No trips have been scheduled for this route yet.</p>
                    <Button asChild>
                      <Link href="/admin/trips/new">Schedule Trip</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Trips</span>
                  <span className="font-medium">{routeData.trips?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Trips</span>
                  <span className="font-medium">
                    {routeData.trips?.filter(trip => ['scheduled', 'boarding', 'departed', 'active'].includes(trip.status)).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Trips</span>
                  <span className="font-medium">
                    {routeData.trips?.filter(trip => trip.status === 'completed').length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/admin/trips/new">Schedule New Trip</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/admin/routes/${routeData.id}/edit`}>Edit Route</Link>
                </Button>
                <DeleteRouteButton routeId={routeData.id} routeName={routeData.name} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}