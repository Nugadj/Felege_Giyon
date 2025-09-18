import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Route } from "lucide-react"
import Link from "next/link"
import { EditRouteForm } from "@/components/edit-route-form"

interface Route {
  id: string
  name: string
  origin: string
  destination: string
  distance_km: number | null
  estimated_duration_hours: number | null
  description: string | null
}

export default async function EditRoutePage({ params }: { params: { id: string } }) {
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

  // Get route details
  const { data: route, error } = await supabase
    .from("routes")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !route) {
    redirect("/admin/routes")
  }

  const routeData = route as Route

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href={`/admin/routes/${routeData.id}`}>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Edit Route</h1>
                <p className="text-xs text-gray-500">Update route information</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-purple-600">{routeData.name}</div>
              <div className="text-xs text-gray-500">{routeData.origin} → {routeData.destination}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Route className="w-4 h-4 text-white" />
              </div>
              Route Information
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Update the route information and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditRouteForm route={routeData} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}