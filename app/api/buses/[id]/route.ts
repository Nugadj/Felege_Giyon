import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: bus, error } = await supabase.from("buses").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Database error fetching bus:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ bus })
  } catch (error) {
    console.error("Error fetching bus:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, plate_number, total_seats, amenities } = await request.json()
    const supabase = await createClient()

    const { data: bus, error } = await supabase
      .from("buses")
      .update({
        name,
        plate_number,
        total_seats: Number.parseInt(total_seats),
        amenities: amenities || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Database error updating bus:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, bus })
  } catch (error) {
    console.error("Error updating bus:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: activeTrips, error: tripsError } = await supabase
      .from("trips")
      .select("id")
      .eq("bus_id", params.id)
      .in("status", ["scheduled", "boarding", "departed", "active"])

    if (tripsError) {
      console.error("Database error checking active trips:", tripsError)
      return NextResponse.json({ error: tripsError.message }, { status: 400 })
    }

    if (activeTrips && activeTrips.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete bus with active trips. Please cancel or complete all trips first.",
        },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("buses").delete().eq("id", params.id)

    if (error) {
      console.error("Database error deleting bus:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bus:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
