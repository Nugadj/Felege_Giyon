import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  Bus, 
  Users, 
  Filter,
  Eye,
  Edit,
  Settings,
  Activity,
  Gauge
} from "lucide-react"
import Link from "next/link"
import { BusDeleteButton } from "@/components/bus-delete-button"
import { RefreshButton } from "@/components/refresh-button"

interface BusWithStats {
  id: string
  name: string
  plate_number: string
  total_seats: number
  amenities: string[]
  created_at: string
  trips: { id: string }[]
}

export default async function BusesManagementPage() {
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

  // Get all buses with trip counts
  const { data: buses } = await supabase
    .from("buses")
    .select(`
      *,
      trips (id)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Fleet</h1>
                <p className="text-xs text-gray-500">Manage Bus Fleet</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="w-4 h-4" />
              </Button>
              <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/buses/new">
                  <Plus className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Fleet Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Gauge className="w-5 h-5" />
              Fleet Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{buses?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Buses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {buses?.reduce((sum, bus) => sum + (bus.trips?.length || 0), 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Trips</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {buses?.reduce((sum, bus) => sum + bus.total_seats, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Seats</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buses Grid - Mobile First */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buses?.map((bus: BusWithStats) => (
            <Card key={bus.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">{bus.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">
                        {bus.plate_number}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {bus.trips?.length || 0} trips
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Bus Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{bus.total_seats}</div>
                    <div className="text-xs text-gray-600">Seats</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{bus.trips?.length || 0}</div>
                    <div className="text-xs text-gray-600">Trips</div>
                  </div>
                </div>

                {/* Amenities */}
                {bus.amenities && bus.amenities.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-2">Amenities</div>
                    <div className="flex gap-1 flex-wrap">
                      {bus.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity.replace("_", " ")}
                        </Badge>
                      ))}
                      {bus.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{bus.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                    <Link href={`/admin/buses/${bus.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <BusDeleteButton busId={bus.id} busName={bus.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!buses || buses.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Buses Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Add your first bus to start building your transportation fleet.
              </p>
              <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/buses/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Bus
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
