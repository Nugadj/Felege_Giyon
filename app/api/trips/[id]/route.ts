import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: trip, error } = await supabase
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
      .single()

    if (error) {
      console.error("Database error fetching trip:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Error fetching trip:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { origin, destination, departure_time, arrival_time, price, bus_id, description, status } =
      await request.json()
    const supabase = await createClient()

    const { data: trip, error } = await supabase
      .from("trips")
      .update({
        origin,
        destination,
        departure_time,
        arrival_time,
        price: Number.parseFloat(price),
        bus_id,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error updating trip:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, trip })
  } catch (error) {
    console.error("Error updating trip:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("trip_id", params.id)
      .eq("status", "booked")

    if (bookingsError) {
      console.error("Database error checking bookings:", bookingsError)
      return NextResponse.json({ error: bookingsError.message }, { status: 400 })
    }

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete trip with active bookings. Please cancel all bookings first.",
        },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("trips").delete().eq("id", params.id)

    if (error) {
      console.error("Database error deleting trip:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting trip:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
