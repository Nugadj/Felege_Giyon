import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const { seat_number, status } = await request.json()
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

    // Use admin client for service role operations
    const adminClient = createAdminClient()

    // Delete seat reservation using service role
    const { error } = await adminClient
      .from('seat_reservations')
      .delete()
      .eq('trip_id', params.tripId)
      .eq('seat_number', seat_number)
      .eq('status', status)

    if (error) {
      console.error("Error deleting seat reservation:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in admin seat deletion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}