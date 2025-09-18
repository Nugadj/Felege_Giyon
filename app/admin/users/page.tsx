import { redirect } from "next/navigation"
import { headers } from 'next/headers'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Filter, UserPlus } from "lucide-react"
import Link from "next/link"
import { UserManagementClient } from "@/components/user-management-client"
import { RefreshButton } from "@/components/refresh-button"

export default async function UsersManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch initial data server-side via admin-only service endpoint to ensure full visibility
  let users: any = []
  try {
    // Build an absolute URL for server-side fetch. Prefer NEXT_PUBLIC_BASE_URL when set,
    // otherwise derive protocol+host from incoming request headers.
    const hdrs = headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const proto = hdrs.get('x-forwarded-proto') ?? 'http'
    const base = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`
    // Forward the incoming cookies so the internal API can authenticate the user server-side.
    const cookie = hdrs.get('cookie') ?? ''
    const res = await fetch(`${base}/api/admin/all-profiles`, { headers: { cookie } })

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await res.json()
      if (res.ok) {
        users = body.users || []
      } else {
        console.error('Failed to fetch all profiles via admin endpoint', body)
        // fallback to current limited query
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
        users = data || []
      }
    } else {
      // Non-JSON response (likely HTML from an auth redirect or error). Log and fall back.
      const text = await res.text()
      console.error('Admin all-profiles returned non-JSON response:', text)
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      users = data || []
    }
  } catch (err) {
    console.error('Error fetching all profiles:', err)
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
    users = data || []
  }

  // Fetch booking statistics for each user
  const { data: bookingStats } = await supabase.from("bookings").select(`
    created_by,
    status,
    trips (price)
  `)

  // Calculate user statistics
  const usersWithStats = users?.map((user: any) => {
    const userBookings = bookingStats?.filter((booking) => booking.created_by === user.id) || []
    const totalBookings = userBookings.length
    const completedBookings = userBookings.filter((b) => b.status === "booked").length
    const totalRevenue = userBookings
      .filter((b) => b.status === "booked")
      .reduce((sum: number, booking: any) => sum + (Number(booking.trips?.price) || 0), 0)

    return {
      ...user,
      totalBookings,
      completedBookings,
      totalRevenue,
    }
  }) || []

  
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
                <h1 className="text-lg font-bold text-gray-900">Users</h1>
                <p className="text-xs text-gray-500">Manage System Users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <UserManagementClient initialUsers={usersWithStats || []} />
      </main>
    </div>
  )
}
