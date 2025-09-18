import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { role } = await request.json()
    const supabase = await createClient()

    // Verify current user and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use admin client for admin operations
    const adminClient = createAdminClient()

    const { error } = await adminClient.from("profiles").update({ role }).eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Verify current user and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (user.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 })
    }

    // Use admin client for admin operations
    const adminClient = createAdminClient()

    // Check for dependencies that would prevent deletion
    const [bookingsResult, tripsResult, reservationsResult] = await Promise.all([
      adminClient.from("bookings").select("id").eq("created_by", params.id).limit(1),
      adminClient.from("trips").select("id").eq("created_by", params.id).limit(1),
      adminClient.from("seat_reservations").select("id").eq("created_by", params.id).limit(1)
    ])

    const hasBookings = bookingsResult.data && bookingsResult.data.length > 0
    const hasTrips = tripsResult.data && tripsResult.data.length > 0
    const hasReservations = reservationsResult.data && reservationsResult.data.length > 0

    if (hasBookings || hasTrips || hasReservations) {
      const dependencies = []
      if (hasBookings) dependencies.push("bookings")
      if (hasTrips) dependencies.push("trips")
      if (hasReservations) dependencies.push("seat reservations")
      
      return NextResponse.json({ 
        error: `Cannot delete user with existing ${dependencies.join(", ")}. Please remove or transfer these records first.` 
      }, { status: 400 })
    }

    // Delete from profiles table first
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", params.id)

    if (profileError) {
      console.error("Profile deletion error:", profileError)
      return NextResponse.json({ error: `Failed to delete user profile: ${profileError.message}` }, { status: 400 })
    }

    // Then delete user from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(params.id)

    if (authError) {
      console.error("Auth deletion error:", authError)
      return NextResponse.json({ error: `Failed to delete user account: ${authError.message}` }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Database error deleting user" }, { status: 500 })
  }
}