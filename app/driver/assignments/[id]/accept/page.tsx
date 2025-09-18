import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AcceptAssignmentForm } from "@/components/accept-assignment-form"

export default async function AcceptAssignmentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is a driver
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "driver") {
    redirect("/dashboard")
  }

  // Get driver information
  const { data: driver } = await supabase.from("drivers").select("*").eq("user_id", user.id).single()

  if (!driver) {
    redirect("/dashboard")
  }

  // Get assignment details
  const { data: assignment } = await supabase
    .from("trip_assignments")
    .select(`
      *,
      trips (
        *,
        buses (
          name,
          plate_number,
          total_seats
        )
      )
    `)
    .eq("id", params.id)
    .eq("driver_id", driver.id)
    .single()

  if (!assignment) {
    redirect("/driver")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accept Assignment</h1>
              <p className="text-sm text-gray-600">Confirm your acceptance of this trip assignment</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/driver">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Accept Trip Assignment
            </CardTitle>
            <CardDescription>Review the trip details and confirm your acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptAssignmentForm assignment={assignment} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
