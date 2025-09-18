import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Plus, 
  Route, 
  MapPin, 
  Clock,
  Navigation,
  Filter,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { DeleteRouteButton } from "@/components/delete-route-button"
import { RefreshButton } from "@/components/refresh-button"

interface RouteWithStats {
  id: string
  name: string
  origin: string
  destination: string
  distance_km: number
  estimated_duration_hours: number
  description: string
  created_at: string
  trips: { id: string }[]
}

export default async function RoutesManagementPage() {
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

  // Get all routes with trip counts
  const { data: routes } = await supabase
    .from("routes")
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
                <h1 className="text-lg font-bold text-gray-900">Routes</h1>
                <p className="text-xs text-gray-500">Manage Bus Routes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="w-4 h-4" />
              </Button>
              <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/routes/new">
                  <Plus className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Routes Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Navigation className="w-5 h-5" />
              Routes Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{routes?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Routes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {routes?.reduce((sum, route) => sum + (route.trips?.length || 0), 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Trips</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {routes?.reduce((sum, route) => sum + route.distance_km, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total KM</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routes Grid - Mobile First */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes?.map((route: RouteWithStats) => (
            <Card key={route.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-white/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Route className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">{route.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3" />
                        {route.origin} → {route.destination}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {route.trips?.length || 0} trips
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Route Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{route.distance_km}</div>
                    <div className="text-xs text-gray-600">KM</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{route.estimated_duration_hours}</div>
                    <div className="text-xs text-gray-600">Hours</div>
                  </div>
                </div>

                {/* Description */}
                {route.description && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-2">{route.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Link href={`/admin/routes/${route.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                    <Link href={`/admin/routes/${route.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <DeleteRouteButton routeId={route.id} routeName={route.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!routes || routes.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Routes Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first bus route to start managing transportation schedules and trips.
              </p>
              <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/routes/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Route
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}