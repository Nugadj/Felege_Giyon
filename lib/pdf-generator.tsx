interface BookingWithTrip {
  id: string
  seat_number: number
  passenger_name: string
  passenger_phone: string
  passenger_id_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  status: string
  created_at: string
  trips: {
    id: string
    origin: string
    destination: string
    departure_time: string
    arrival_time: string
    price: number
    buses: {
      name: string
      plate_number: string
      amenities: string[]
    }
  }
}

interface TripWithBookings {
  id: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  price: number
  status: string
  buses: {
    name: string
    plate_number: string
    total_seats: number
  }
  bookings: {
    id: string
    seat_number: number
    passenger_name: string
    passenger_phone: string
    passenger_id_number: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    status: string
    created_at: string
  }[]
}

import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fs from "fs/promises"
import path from "path"
// keep fontkit for embedding custom fonts
// @ts-ignore
const fontkit = require('fontkit');

async function getEthiopicFont() {
  // Construct the path to the font file within the public directory
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansEthiopic-Regular.ttf');
  try {
    const fontBytes = await fs.readFile(fontPath);
    return fontBytes;
  } catch (error) {
    console.error("Failed to read font file. Make sure 'NotoSansEthiopic-Regular.ttf' is in the 'public/fonts' directory.", error);
    // Fallback or throw error
    return null;
  }
}

export async function generateTicketPDF(booking: BookingWithTrip): Promise<Buffer> {
  // Create a simple ticket-style PDF mirroring the receipt layout (text only)
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontBytes = await getEthiopicFont()
  const font = fontBytes ? await pdfDoc.embedFont(fontBytes) : await pdfDoc.embedFont(StandardFonts.Helvetica)

  const page = pdfDoc.addPage([600, 800])
  const { width, height } = page.getSize()
  const margin = 40

  // Header
  page.drawText('ፈለገ ግዮን ባስ ትራንስፖርት', { x: margin, y: height - 60, size: 18, font, color: rgb(0, 0, 0) })
  page.drawText(`${booking.trips.origin} → ${booking.trips.destination}`, { x: margin, y: height - 84, size: 12, font })

  // Ticket details
  let y = height - 120
  page.drawText(`Seat: ${booking.seat_number}`, { x: margin, y, size: 12, font })
  y -= 20
  page.drawText(`Name: ${booking.passenger_name}`, { x: margin, y, size: 12, font })
  y -= 20
  page.drawText(`Phone: ${booking.passenger_phone}`, { x: margin, y, size: 12, font })
  y -= 20
  page.drawText(`Price: ${booking.trips.price.toLocaleString()} ETB`, { x: margin, y, size: 14, font })

  // Optional metadata
  y -= 30
  page.drawText(`Departure: ${formatDateTime(booking.trips.departure_time)}`, { x: margin, y, size: 10, font })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function generatePassengerListPDF(trip: TripWithBookings): Promise<Buffer> {
  // Render a passenger list PDF that matches the visual receipt (text/table)
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontBytes = await getEthiopicFont()
  const font = fontBytes ? await pdfDoc.embedFont(fontBytes) : await pdfDoc.embedFont(StandardFonts.Helvetica)

  const pageSize: [number, number] = [612, 792]
  let page = pdfDoc.addPage(pageSize)
  const { width, height } = page.getSize()

  const margin = 36
  let cursorY = height - margin
  // Header text (centered)
  page.drawText('ፈለገ ግዮን ባስ ትራንስፖርት', { x: margin, y: cursorY - 8, size: 16, font })
  cursorY -= 28
  page.drawText(`${trip.origin} → ${trip.destination}`, { x: margin + 80, y: cursorY, size: 12, font })
  cursorY -= 20

  // Info row
  page.drawText(`ቀን: ${formatDate(trip.departure_time)}`, { x: margin, y: cursorY, size: 10, font })
  page.drawText(`መስመር: ${trip.origin} - ${trip.destination}`, { x: margin + 200, y: cursorY, size: 10, font })
  page.drawText(`የጎ ቁጥር: ${(trip as any).tripNumber || 'N/A'}`, { x: margin + 420, y: cursorY, size: 10, font })
  cursorY -= 24

  // Table header
  const colX = [margin, margin + 40, margin + 220, margin + 360, margin + 440, margin + 520]
  page.drawText('ተ.ቁ.', { x: colX[0], y: cursorY, size: 10, font })
  page.drawText('የተሳፋሪው ስም', { x: colX[1], y: cursorY, size: 10, font })
  page.drawText('ስልክ', { x: colX[2], y: cursorY, size: 10, font })
  page.drawText('የትኬት', { x: colX[3], y: cursorY, size: 10, font })
  page.drawText('የከፈለው', { x: colX[4], y: cursorY, size: 10, font })
  page.drawText('አስተያየት', { x: colX[5], y: cursorY, size: 10, font })
  cursorY -= 16

  // Rows - sorted by seat
  const sorted = [...trip.bookings].sort((a, b) => a.seat_number - b.seat_number)
  const rowHeight = 16
  let totalAmount = 0

  for (const b of sorted) {
    if (cursorY < 80) {
      page = pdfDoc.addPage(pageSize)
      cursorY = height - margin
    }
    page.drawText(String(b.seat_number), { x: colX[0], y: cursorY, size: 10, font })
    page.drawText(b.passenger_name || '-', { x: colX[1], y: cursorY, size: 10, font })
    page.drawText(b.passenger_phone || '-', { x: colX[2], y: cursorY, size: 10, font })
    page.drawText(((b as any).ticket_id) || '-', { x: colX[3], y: cursorY, size: 10, font })
    page.drawText(((b as any).amount_paid != null ? String((b as any).amount_paid) : '-'), { x: colX[4], y: cursorY, size: 10, font })
    page.drawText(((b as any).note) || '-', { x: colX[5], y: cursorY, size: 10, font })
    totalAmount += Number((b as any).amount_paid) || 0
    cursorY -= rowHeight
  }

  // Total
  if (cursorY < 80) {
    page = pdfDoc.addPage(pageSize)
    cursorY = height - margin
  }
  page.drawText('ጠቅላላ ድምር:', { x: colX[3], y: cursorY - 4, size: 11, font })
  page.drawText(String(totalAmount), { x: colX[4], y: cursorY - 4, size: 11, font })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}