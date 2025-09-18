import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddRouteForm } from "@/components/add-route-form"

export default async function NewRoutePage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/admin/routes">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Add New Route</h1>
                <p className="text-xs text-gray-500">Add route to network</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-purple-600">New Route</div>
              <div className="text-xs text-gray-500">Network expansion</div>
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
                <ArrowLeft className="w-4 h-4 text-white rotate-90" />
              </div>
              Route Information
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Enter the details for the new route you want to add to your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddRouteForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}