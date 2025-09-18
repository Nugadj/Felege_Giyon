import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'

// This script creates a minimal HTML snapshot similar to components/ethiopian-trip-receipt.tsx
// and uses Puppeteer to render it to PDF. It does not import or execute your React component
// (that would require bundling/Next build). Instead it mirrors the visual layout so output
// matches the receipt on screen.

const outPdf = path.join(process.cwd(), 'out-receipt.pdf')

function buildHtml(trip, passengers) {
  const rows = passengers.map(p => `
    <tr>
      <td style="border:1px solid black;padding:8px;text-align:center">${p.seat_number}</td>
      <td style="border:1px solid black;padding:8px;text-align:center">${p.passenger_name || ''}</td>
      <td style="border:1px solid black;padding:8px;text-align:center">${p.passenger_phone || ''}</td>
      <td style="border:1px solid black;padding:8px;text-align:center">${(p.ticket_id)||''}</td>
      <td style="border:1px solid black;padding:8px;text-align:center">${p.amount_paid != null ? p.amount_paid : ''}</td>
      <td style="border:1px solid black;padding:8px;text-align:center;height:48px">${p.note || ''}</td>
    </tr>
  `).join('\n')

  const totalAmount = passengers.reduce((s,p) => s + (Number(p.amount_paid) || 0), 0)

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin:20px; font-size:12px; line-height:1.4 }
        .receipt-container { max-width:1000px; margin:0 auto; padding:20px }
        table{width:100%;border-collapse:collapse;border:2px solid black}
        th,td{border:1px solid black;padding:8px;text-align:center;font-size:11px}
        th{background:#f0f0f0;font-weight:bold}
        .header { text-align:center; margin-bottom:20px; }
        .info { display:flex; justify-content:space-between; gap:12px; margin-bottom:12px }
        .signatures{margin-top:30px;display:flex;justify-content:space-between}
        .signature-line{width:45%;border-bottom:1px solid black;padding-bottom:2px;margin-top:20px}
        @media print { body{margin:0} }
      </style>
    </head>
    <body>
      <div class="receipt-container">
          <div class="header" style="position:relative;padding-left:0;text-align:center;">
          <div class="center" style="text-align:center">
            <h1 style="margin:0;font-size:18px;font-weight:bold">ፈለገ ግዮን ባስ ትራንስፖርት</h1>
            <h2 style="margin:0;font-size:14px">የገንዘብ ማጠቃለያ እና መረከቢያ ሰነድ ቅጽ</h2>
          </div>
        </div>

        <div class="info">
          <div><strong>የገንዘብ ተቀባይ ስም:</strong> ___________________</div>
          <div><strong>መስመር:</strong> ${trip.origin} - ${trip.destination}</div>
          <div><strong>ቀን:</strong> ${new Date(trip.departure_time).toLocaleDateString('am-ET')}</div>
          <div><strong>የጎ ቁጥር:</strong> ${trip.tripNumber || 'N/A'}</div>
        </div>

        <div style="text-align:center;margin:15px 0;font-size:14px;font-weight:bold">
          ለቅድሚያ ትኬት የመንገደኞች መመዝገቢያ  የገንዘብ ማጠቃለያ እና መረካከቢያ ሰነድ ቅጽ
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width:6%">ተ.ቁ.</th>
                <th style="width:34%">የተሳፋሪው ስም</th>
                <th style="width:18%">ስልክ ቁጥር</th>
                <th style="width:14%">የትኬት ቁጥር</th>
                <th style="width:14%">የከፈለው ብር</th>
                <th style="width:14%">አስተያየት</th>
              </tr>
            </thead>
            <tbody>
              ${rows}

              <tr class="total-row">
                <td colspan="4" style="text-align:right;font-weight:bold;padding:8px;border:1px solid black">ጠቅላላ ድምር:</td>
                <td style="font-weight:bold;padding:8px;border:1px solid black">${totalAmount || ''}</td>
                <td style="border:1px solid black;padding:8px;text-align:center"></td>
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

(async () => {
  // sample data; you can replace this with dynamic input or read from a JSON file
  const trip = {
    id: 't1',
    origin: 'Addis Ababa',
    destination: 'Bahir Dar',
    departure_time: new Date().toISOString(),
    tripNumber: 'TRIP-001'
  }

  const totalSeats = 20
  const passengers = Array.from({ length: 8 }, (_, i) => ({
    seat_number: i + 1,
    passenger_name: `Passenger ${i + 1}`,
    passenger_phone: `0911${1000 + i}`,
    ticket_id: `TKT-${i + 1}`,
    amount_paid: 500,
    note: ''
  }))

  const html = buildHtml(trip, passengers)

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.pdf({ path: outPdf, format: 'A4', printBackground: true })
  await browser.close()

  console.log('Wrote', outPdf)
})()
