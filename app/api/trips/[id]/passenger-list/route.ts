import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Use puppeteer if installed. For Vercel/serverless we prefer chrome-aws-lambda
let puppeteer: any = null
let chromeAwsLambda: any = null

async function getPuppeteer() {
  if (puppeteer) return puppeteer

  // In serverless (Vercel) prefer puppeteer-core + chrome-aws-lambda
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    try {
      chromeAwsLambda = await import('chrome-aws-lambda')
    } catch (err) {
      console.warn('chrome-aws-lambda not available:', err)
    }

    try {
      puppeteer = await import('puppeteer-core')
    } catch (err) {
      console.error('puppeteer-core not installed; serverless PDF may fail:', err)
      puppeteer = null
    }

    return puppeteer
  }

  // Local development: use full puppeteer package if available
  try {
    puppeteer = await import('puppeteer')
  } catch (err) {
    console.error('puppeteer not installed for local dev:', err)
    puppeteer = null
  }

  return puppeteer
}

async function buildHtml(trip: any) {
  // No logo: intentionally left blank per user request
  const logoUrl = ''

  const totalSeats = trip.buses?.total_seats || 51
  const bookings = (trip.bookings || []).slice()
  const passengers = Array.from({ length: totalSeats }, (_, i) => {
    const seatNumber = i + 1
    const p = bookings.find((b: any) => b.seat_number === seatNumber)
    return p || { seat_number: seatNumber, passenger_name: '', passenger_phone: '' }
  })

  const rows = passengers.map((p: any) => `
    <tr>
      <td style="border:1px solid black;padding:4px;text-align:center">${p.seat_number}</td>
      <td style="border:1px solid black;padding:4px;text-align:center">${p.passenger_name || ''}</td>
      <td style="border:1px solid black;padding:4px;text-align:center">${p.passenger_phone || ''}</td>
      <td style="border:1px solid black;padding:4px;text-align:center">${(p.ticket_id) || ''}</td>
      <td style="border:1px solid black;padding:4px;text-align:center">${p.amount_paid != null ? p.amount_paid : ''}</td>
      <td style="border:1px solid black;padding:4px;text-align:center;vertical-align:middle">${p.note || ''}</td>
    </tr>`).join('\n')

  const totalAmount = passengers.reduce((s: number, p: any) => s + (Number(p.amount_paid) || 0), 0)

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Passenger list</title>
      <style>
        :root { --border: #111; --muted: #f7f7f7 }
        body { font-family: 'Times New Roman', serif; margin:12px; font-size:11px; line-height:1.2; color:#111 }
        .receipt-container { max-width:820px; margin:0 auto; padding:8px }
        /* boxed header */
        .header-box { border:1px solid var(--border); padding:8px; display:flex; align-items:center; gap:12px; background:var(--muted); }
        .logo { width:64px; height:64px; object-fit:cover; border-radius:6px; border:1px solid #999 }
        .header-text { flex:1; text-align:center }
        .header-text h1 { margin:0; font-size:16px; font-weight:700 }
        .header-text h2 { margin:0; font-size:12px; font-weight:500 }
        .info { display:flex; justify-content:space-between; gap:8px; margin:8px 0; font-size:11px }
        .info div { flex:1 }
        .title-line { text-align:center; margin:8px 0; font-weight:700; font-size:12px }

        table { width:100%; border-collapse:collapse; border:1px solid var(--border); font-size:11px }
        thead th { background:#efefef; border:1px solid var(--border); padding:6px 4px; font-weight:700 }
        tbody td { border:1px solid #ddd; padding:4px 6px; vertical-align:middle }
        tbody tr { height:20px }
        .total-row td { padding:6px 8px; font-weight:700 }

        .signatures { display:flex; justify-content:space-between; gap:12px; margin-top:10px }
        .signature-line { width:45%; border-bottom:1px solid #000; padding-bottom:2px }
        @media print { body { margin:0 } }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header-box" style="justify-content:center;">
          <div class="header-text">
            <h1>ፈለገ ግዮን ባስ ትራንስፖርት</h1>
            <h2>የገንዘብ ማጠቃለያ እና መረከቢያ ሰነድ ቅጽ</h2>
            <div style="margin-top:6px;font-size:11px">Trip: ${(trip as any).tripNumber || ''} &nbsp; · &nbsp; Date: ${new Date(trip.departure_time).toLocaleDateString('am-ET')}</div>
          </div>
        </div>

        <div class="info">
          <div><strong>የገንዘብ ተቀባይ ስም:</strong> ___________________</div>
          <div><strong>መስመር:</strong> ${trip.origin} - ${trip.destination}</div>
          <div style="text-align:right"><strong>ስፋት:</strong> ${trip.buses?.name || ''}</div>
        </div>

        <div class="title-line">ለቅድሚያ ትኬት የመንገደኞች መመዝገቢያ / የገንዘብ ማጠቃለያ</div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width:6%">ተ.ቁ.</th>
                <th style="width:34%">የተሳፋሪው ስም</th>
                <th style="width:18%">ስልክ</th>
                <th style="width:14%">የትኬት</th>
                <th style="width:14%">የከፈለው</th>
                <th style="width:14%">አስተያየት</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="4" style="text-align:right">ጠቅላላ ድምር:</td>
                <td style="text-align:left">${totalAmount || ''}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="signatures">
          <div>
            <div>የገንዘብ ተቀባይ ስምና ፊርማ</div>
            <div class="signature-line"></div>
          </div>
          <div>
            <div>የተረካቢ ስምና ፊርማ</div>
            <div class="signature-line"></div>
          </div>
        </div>
      </div>
    </body>
  </html>`
}

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

    // Get trip details with bookings
    const { data: trip, error } = await supabase
      .from("trips")
      .select(`
        *,
        buses (
          name,
          plate_number,
          total_seats
        ),
        bookings (
          id,
          seat_number,
          passenger_name,
          passenger_phone,
          passenger_id_number,
          emergency_contact_name,
          emergency_contact_phone,
          status,
          created_at,
          amount_paid,
          ticket_id,
          note
        )
      `)
      .eq("id", id)
      .single()

    puppeteer = await getPuppeteer()
    if (!puppeteer) {
      // fallback to existing generator if puppeteer isn't available
      return NextResponse.json({ error: 'Puppeteer not available on server' }, { status: 500 })
    }

    const html = await buildHtml(trip)

    // Configure browser launch options based on environment
    let launchOptions: any = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      headless: true
    }

    // Use chrome-aws-lambda / serverless chromium when available on Vercel/production
    if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && chromeAwsLambda) {
      try {
        // chromeAwsLambda.executablePath may be an async function in some versions
        const exe = typeof chromeAwsLambda.executablePath === 'function'
          ? await chromeAwsLambda.executablePath()
          : chromeAwsLambda.executablePath

        if (exe) launchOptions.executablePath = exe
      } catch (e) {
        console.warn('Failed to get chrome-aws-lambda executablePath:', e)
      }

      // Merge recommended args from chrome-aws-lambda
      if (Array.isArray(chromeAwsLambda.args) && chromeAwsLambda.args.length) {
        const combined = Array.from(new Set([...(chromeAwsLambda.args || []), ...(launchOptions.args || [])]))
        launchOptions.args = combined
      }

      // On serverless it's safer to force headless and set default viewport
      launchOptions.headless = 'new' as any
    }

    // Ensure puppeteer-core has an executablePath or channel in serverless environments
    let browser: any
    try {
      browser = await puppeteer.launch(launchOptions)
    } catch (e: any) {
      console.warn('puppeteer.launch failed:', e?.message || e)
      // In production on Vercel we should not attempt to import full puppeteer (huge binary).
      // Provide a clear error that chrome-aws-lambda / puppeteer-core need proper config.
      throw e
    }
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="passenger-list-${trip.id.slice(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating passenger list PDF:", error)
    return NextResponse.json({ error: "Failed to generate passenger list" }, { status: 500 })
  }
}
