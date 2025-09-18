import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { RealTimeAdminTripsClient } from "@/components/real-time-admin-trips-client"
import { RefreshButton } from "@/components/refresh-button"

export default async function TripsManagementPage() {
  const supabase = await createClient()
  let user: any = null
  try {
    const client = supabase
    const result = await client.auth.getUser()
    user = result?.data?.user
    if (!user) {
      redirect("/auth/login")
    }
  } catch (err: any) {
    // Network/DNS issues (eg. ENOTFOUND) while contacting Supabase should not crash the whole page.
    // Render a helpful UI so the admin can see what's wrong and proceed.
    const message = err?.message || String(err)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-xl bg-white border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-2">Connection error</h2>
          <p className="text-sm text-gray-700 mb-4">There was a problem reaching the Supabase backend: <span className="font-mono">{message}</span></p>
          <p className="text-sm text-gray-600">Common fixes: ensure <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> is set and your network/DNS can resolve it.</p>
          <div className="mt-4">
            <a className="text-sm text-blue-600 underline" href="/">Return home</a>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all trips with bus and booking information
  const { data: trips } = await supabase
    .from("trips")
    .select(`
      *,
      buses (name, plate_number, total_seats),
      bookings (id, status)
    `)
    .order("departure_time", { ascending: false })

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
                <h1 className="text-lg font-bold text-gray-900">Trips</h1>
                <p className="text-xs text-gray-500">Manage Bus Trips</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="w-4 h-4" />
              </Button>
              <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/trips/new">
                  <Plus className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <RealTimeAdminTripsClient initialTrips={trips || []} />
      </main>
    </div>
  )
}
