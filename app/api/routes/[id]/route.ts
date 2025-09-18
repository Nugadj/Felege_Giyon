import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: route, error } = await supabase
      .from("routes")
      .select(`
        *,
        trips (
          id,
          departure_time,
          arrival_time,
          status,
          price,
          available_seats,
          buses (
            name,
            plate_number
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Database error fetching route:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ route })
  } catch (error) {
    console.error("Error fetching route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, origin, destination, distance_km, estimated_duration_hours, description } = await request.json()
    const supabase = await createClient()

    const { data: route, error } = await supabase
      .from("routes")
      .update({
        name,
        origin,
        destination,
        distance_km: distance_km ? Number.parseInt(distance_km) : null,
        estimated_duration_hours: estimated_duration_hours ? Number.parseFloat(estimated_duration_hours) : null,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error updating route:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, route })
  } catch (error) {
    console.error("Error updating route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check if there are any active trips using this route
    const { data: activeTrips, error: tripsError } = await supabase
      .from("trips")
      .select("id")
      .eq("route_id", params.id)
      .in("status", ["scheduled", "boarding", "departed", "active"])

    if (tripsError) {
      console.error("Database error checking active trips:", tripsError)
      return NextResponse.json({ error: tripsError.message }, { status: 400 })
    }

    if (activeTrips && activeTrips.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete route with active trips. Please cancel or complete all trips first.",
        },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("routes").delete().eq("id", params.id)

    if (error) {
      console.error("Database error deleting route:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}