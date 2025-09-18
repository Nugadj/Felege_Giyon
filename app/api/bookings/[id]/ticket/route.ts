import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateTicketPDF } from "@/lib/pdf-generator"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get booking details with trip and bus information
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        trips (
          *,
          buses (
            name,
            plate_number,
            amenities
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(booking)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${booking.id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating ticket PDF:", error)
    return NextResponse.json({ error: "Failed to generate ticket" }, { status: 500 })
  }
}
