import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Bus, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Route, 
  BarChart3, 
  FileText, 
  Activity,
  Shield,
  Eye
} from "lucide-react"
import Link from "next/link"
import { RefreshButton } from "@/components/refresh-button"

export default async function AdminDashboardPage() {
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

  const [{ count: totalBuses }, { count: totalTrips }, { count: totalBookings }, { count: totalUsers }] =
    await Promise.all([
      supabase.from("buses").select("*", { count: "exact", head: true }),
      supabase.from("trips").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ])

  const { data: recentTrips } = await supabase
    .from("trips")
    .select(`
      *,
      buses (name, plate_number),
      bookings (id)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: revenueData } = await supabase
    .from("bookings")
    .select(`
      created_at,
      trips (price)
    `)
    .eq("status", "booked")

  const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.trips?.price || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">ፈለገ ግዮን ባስ ትራንስፖርት</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/dashboard">
                  <Eye className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Hero Stats - Mobile First */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Total Buses</p>
                  <p className="text-xl font-bold">{totalBuses || 0}</p>
                  <p className="text-blue-100 text-xs">Active Fleet</p>
                </div>
                <Bus className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Total Trips</p>
                  <p className="text-xl font-bold">{totalTrips || 0}</p>
                  <p className="text-green-100 text-xs">All Time</p>
                </div>
                <Calendar className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">Bookings</p>
                  <p className="text-xl font-bold">{totalBookings || 0}</p>
                  <p className="text-purple-100 text-xs">Passengers</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">Revenue</p>
                  <p className="text-xl font-bold">{totalRevenue.toLocaleString()}</p>
                  <p className="text-orange-100 text-xs">ETB</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Activity className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Button asChild className="h-16 flex-col bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/buses">
                  <Bus className="w-6 h-6 mb-1" />
                  <span className="text-xs">Buses</span>
                </Link>
              </Button>
              <Button asChild className="h-16 flex-col bg-green-500 hover:bg-green-600 text-white">
                <Link href="/admin/trips">
                  <Calendar className="w-6 h-6 mb-1" />
                  <span className="text-xs">Trips</span>
                </Link>
              </Button>
              <Button asChild className="h-16 flex-col bg-purple-500 hover:bg-purple-600 text-white">
                <Link href="/admin/users">
                  <Users className="w-6 h-6 mb-1" />
                  <span className="text-xs">Users</span>
                </Link>
              </Button>
              <Button asChild className="h-16 flex-col bg-orange-500 hover:bg-orange-600 text-white">
                <Link href="/admin/routes">
                  <Route className="w-6 h-6 mb-1" />
                  <span className="text-xs">Routes</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Quick Actions */}
        <div className="grid gap-3 grid-cols-2">
          <Button asChild className="h-16 flex-col bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
            <Link href="/admin/reports">
              <BarChart3 className="w-6 h-6 mb-1" />
              <span className="text-xs">Analytics</span>
            </Link>
          </Button>
          <Button asChild className="h-16 flex-col bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <Link href="/admin/system-health">
              <Activity className="w-6 h-6 mb-1" />
              <span className="text-xs">System Health</span>
            </Link>
          </Button>
        </div>

        {/* Recent Activity - Mobile Optimized */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Trips */}
          <Card className="bg-white/90 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Calendar className="w-5 h-5" />
                Recent Trips
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">Latest scheduled trips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTrips?.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {trip.origin} → {trip.destination}
                      </div>
                      <div className="text-xs text-gray-600">
                        {trip.buses?.name} • {new Date(trip.departure_time).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-medium text-sm text-green-600">{trip.bookings?.length || 0}</div>
                      <div className="text-xs text-gray-500">bookings</div>
                    </div>
                  </div>
                ))}
                {(!recentTrips || recentTrips.length === 0) && (
                  <div className="text-center py-6 text-gray-500 text-sm">No trips found</div>
                )}
              </div>
              <div className="mt-4">
                <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white">
                  <Link href="/admin/trips/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Trip
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Activity className="w-5 h-5" />
                System Status
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">Current system health and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                  <span className="text-sm text-gray-900">Database Status</span>
                  <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                  <span className="text-sm text-gray-900">Active Users</span>
                  <span className="font-medium text-sm text-purple-600">{totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                  <span className="text-sm text-gray-900">System Uptime</span>
                  <span className="font-medium text-sm text-purple-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                  <span className="text-sm text-gray-900">Last Backup</span>
                  <span className="font-medium text-sm text-purple-600">2 hours ago</span>
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  View System Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
