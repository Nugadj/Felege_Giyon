import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("seat_reservations").select("*").eq("trip_id", params.tripId)

    if (error) throw error

    return NextResponse.json({ seats: data || [] })
  } catch (error) {
    console.error("Error fetching seat statuses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const { seat_number, status, action } = await request.json()
    const supabase = await createClient()

    const { error } = await supabase.from("seat_reservations").upsert({
      trip_id: params.tripId,
      seat_number,
      status,
      reserved_by: status === "reserved" ? (await supabase.auth.getUser()).data.user?.id : null,
      reserved_at: status === "reserved" ? new Date().toISOString() : null,
      expires_at: null,
    })

    if (error) throw error

    // Log activity
    await supabase.rpc("log_activity", {
      p_action: `seat_${action}`,
      p_details: { seat_number },
      p_trip_id: params.tripId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating seat status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
