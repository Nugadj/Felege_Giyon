import { createClient } from "@/lib/supabase/server"
import { EditTripForm } from "@/components/edit-trip-form"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

export default async function EditTripPage({ params }: { params: { id: string } }) {
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

  const [tripResult, busesResult] = await Promise.all([
    supabase
      .from("trips")
      .select(`
        *,
        buses (
          name,
          plate_number,
          total_seats
        )
      `)
      .eq("id", params.id)
      .single(),
    supabase.from("buses").select("*").order("name"),
  ])

  if (tripResult.error || !tripResult.data) {
    notFound()
  }

  const buses = busesResult.data || []
  const trip = tripResult.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/admin/trips">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Edit Trip</h1>
                <p className="text-xs text-gray-500">Update trip information</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-blue-600">{trip.origin} → {trip.destination}</div>
              <div className="text-xs text-gray-500">{new Date(trip.departure_time).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Edit className="w-4 h-4 text-white" />
              </div>
              Trip Information
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Update trip information and schedule details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditTripForm trip={trip} buses={buses} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
