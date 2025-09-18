import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bus, Users, Calendar, MapPin, Edit } from "lucide-react"
import Link from "next/link"
import { DeleteBusButton } from "@/components/delete-bus-button"

interface BusWithTrips {
  id: string
  name: string
  plate_number: string
  total_seats: number
  amenities: string[]
  created_at: string
  trips: {
    id: string
    departure_location: string
    arrival_location: string
    departure_time: string
    status: string
  }[]
}

export default async function BusDetailPage({ params }: { params: { id: string } }) {
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

  // Get bus details with trips
  const { data: bus, error } = await supabase
    .from("buses")
    .select(`
      *,
      trips (
        id,
        departure_location,
        arrival_location,
        departure_time,
        status
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !bus) {
    notFound()
  }

  const busData = bus as BusWithTrips

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/buses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Buses
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{busData.name}</h1>
              <p className="text-sm text-gray-600">Bus Details & Trip History</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/admin/buses/${busData.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Bus
                </Link>
              </Button>
              <DeleteBusButton busId={busData.id} busName={busData.name} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bus Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bus className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle>{busData.name}</CardTitle>
                    <CardDescription>{busData.plate_number}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Capacity</span>
                  </div>
                  <span className="font-medium">{busData.total_seats} seats</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Trips</span>
                  <span className="font-medium">{busData.trips?.length || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Added</span>
                  <span className="font-medium">{new Date(busData.created_at).toLocaleDateString()}</span>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Amenities</div>
                  <div className="flex gap-1 flex-wrap">
                    {busData.amenities?.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trip History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Trip History</CardTitle>
                <CardDescription>All trips assigned to this bus</CardDescription>
              </CardHeader>
              <CardContent>
                {busData.trips && busData.trips.length > 0 ? (
                  <div className="space-y-3">
                    {busData.trips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {trip.departure_location} → {trip.arrival_location}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(trip.departure_time).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={trip.status === "completed" ? "default" : "secondary"}>{trip.status}</Badge>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/trips/${trip.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
                    <p className="text-gray-500">This bus hasn't been assigned to any trips.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
