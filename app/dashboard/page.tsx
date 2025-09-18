import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Settings, 
  User, 
  LogOut, 
  Shield,
  Activity,
  Plus
} from "lucide-react"
import Link from "next/link"
import { RealTimeTripsClient } from "@/components/real-time-trips-client"
import { RefreshButton } from "@/components/refresh-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get trips with bus and booking information
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-500">ፈለገ ግዮን ባስ ትራንስፖርት</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              {profile?.role === "admin" && (
                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Link href="/admin">
                    <Shield className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <form action="/auth/logout" method="post">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <RealTimeTripsClient initialTrips={trips || []} userRole={profile?.role || "employee"} />
      </main>
    </div>
  )
}
