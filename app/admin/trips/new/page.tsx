import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { AddTripForm } from "@/components/add-trip-form"

export default async function AddTripPage() {
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

  const { data: buses } = await supabase.from("buses").select("*").order("name")

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
                <h1 className="text-lg font-bold text-gray-900">Add New Trip</h1>
                <p className="text-xs text-gray-500">Create a new bus trip schedule</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-600">New Trip</div>
              <div className="text-xs text-gray-500">{buses?.length || 0} buses available</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <Card className="bg-white/90 backdrop-blur-sm border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Trip Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Fill in the information below to create a new trip schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddTripForm buses={buses || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
