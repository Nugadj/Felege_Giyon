import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: buses, error } = await supabase.from("buses").select("*").order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ buses })
  } catch (error) {
    console.error("Error fetching buses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, plate_number, total_seats, amenities } = await request.json()

    if (!name || !plate_number || !total_seats) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: bus, error } = await supabase
      .from("buses")
      .insert({
        name,
        plate_number,
        total_seats: Number.parseInt(total_seats),
        amenities: amenities || [],
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, bus })
  } catch (error) {
    console.error("Error creating bus:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
