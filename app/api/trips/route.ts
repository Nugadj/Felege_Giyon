import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: trips, error } = await supabase
      .from("trips")
      .select(`
        *,
        buses (
          name,
          plate_number,
          total_seats
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, departure_time, arrival_time, price, bus_id, description, status } =
      await request.json()

    if (!origin || !destination || !departure_time || !arrival_time || !price || !bus_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        origin,
        destination,
        departure_time,
        arrival_time,
        price: Number.parseFloat(price),
        bus_id,
        description,
        status: status || "scheduled",
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, trip })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
