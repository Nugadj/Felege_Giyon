"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Printer } from "lucide-react"
import { useRef } from "react"
import { Trip, Booking } from "@/lib/types"
import PrintButton from "@/components/print-button";

export default function EthiopianTripReceipt({ trip, bookings }: { trip: Trip, bookings: Booking[] }) {
  // create refs and passenger snapshot before print handler
  const receiptRef = useRef<HTMLDivElement>(null)

  const totalSeats = trip.buses.total_seats || 51;
  const passengers = Array.from({ length: totalSeats }, (_, i) => {
    const seatNumber = i + 1
    const passenger = bookings.find(p => p.seat_number === seatNumber)
    return passenger ? { ...passenger } : { seat_number: seatNumber, passenger_name: "", passenger_phone: "" }
  })

  const handlePrint = () => {
    const rowsHtml = passengers
      .map(
        (p) => `
          <tr>
            <td style="border:1px solid black;padding:8px;text-align:center">${(p as any).seat_number}</td>
            <td style="border:1px solid black;padding:8px;text-align:center">${(p as any).passenger_name || ''}</td>
            <td style="border:1px solid black;padding:8px;text-align:center">${(p as any).passenger_phone || ''}</td>
            <td style="border:1px solid black;padding:8px;text-align:center">${(p as any).ticket_id || ''}</td>
            <td style="border:1px solid black;padding:8px;text-align:center">${(p as any).amount_paid != null ? (p as any).amount_paid : ''}</td>
            <td style="border:1px solid black;padding:8px;text-align:center;height:48px">${(p as any).note || ''}</td>
          </tr>`,
      )
      .join('\n')

    const totalAmount = passengers.reduce((acc, p) => acc + (Number((p as any).amount_paid) || 0), 0)

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>የገንዘብ ማጠቃለያ እና መረከቢያ ሰነድ ቅጽ</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin:20px; font-size:12px; line-height:1.4 }
            .receipt-container { max-width:800px; margin:0 auto; padding:20px }
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
            <div class="header" style="position:relative;padding-left:110px;">
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
                  ${rowsHtml}
                  <!-- Fill remaining rows to match total seats visually -->
                  ${Array.from({ length: Math.max(0, totalSeats - passengers.length) })
                    .map((_, i) => `
                    <tr>
                      <td style="border:1px solid black;padding:8px;text-align:center">${passengers.length + i + 1}</td>
                      <td style="border:1px solid black;padding:8px;text-align:center"></td>
                      <td style="border:1px solid black;padding:8px;text-align:center"></td>
                      <td style="border:1px solid black;padding:8px;text-align:center"></td>
                      <td style="border:1px solid black;padding:8px;text-align:center"></td>
                      <td style="border:1px solid black;padding:8px;text-align:center"></td>
                    </tr>
                  `)
                    .join('\n')}
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

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    // small timeout to ensure styles are applied before print
    setTimeout(() => {
      printWindow.print()
    }, 200)
  }

  const handleDownload = () => {
    handlePrint() // For now, use print dialog which allows saving as PDF
  }

  // Filter only passengers with bookings for screen display (PDF still shows all seats)
  const bookedPassengers = passengers.filter(p => p.passenger_name && p.passenger_name.trim() !== '')
  const totalAmount = bookedPassengers.reduce((acc, p) => acc + (Number((p as any).amount_paid) || 0), 0)

  return (
    <div className="space-y-4">
      {/* Receipt Preview Card - Beautiful Mobile-First Design */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-orange-900 mb-1">ፈለገ ግዮን ባስ ትራንስፖርት</h3>
          <p className="text-sm text-orange-700">Ethiopian Receipt Preview</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-white/60 p-2 rounded">
            <span className="text-gray-600">Route:</span>
            <span className="font-medium ml-1">{trip.origin} - {trip.destination}</span>
          </div>
          <div className="bg-white/60 p-2 rounded">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium ml-1">{new Date(trip.departure_time).toLocaleDateString('am-ET')}</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/80 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{bookedPassengers.length}</div>
            <div className="text-xs text-gray-600">Passengers</div>
          </div>
          <div className="bg-white/80 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total ETB</div>
          </div>
          <div className="bg-white/80 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{totalSeats}</div>
            <div className="text-xs text-gray-600">Total Seats</div>
          </div>
        </div>

        {/* Booked Passengers Preview - Only show passengers with bookings */}
        {bookedPassengers.length > 0 ? (
          <div className="bg-white/80 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Booked Passengers ({bookedPassengers.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bookedPassengers.map((passenger, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {passenger.seat_number}
                    </div>
                    <div>
                      <div className="font-medium">{passenger.passenger_name}</div>
                      <div className="text-xs text-gray-600">{passenger.passenger_phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{(passenger as any).amount_paid || trip.price} ETB</div>
                    {(passenger as any).ticket_id && (
                      <div className="text-xs text-gray-600">{(passenger as any).ticket_id}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/80 rounded-lg p-6 text-center mb-4">
            <div className="text-gray-500">No passengers booked yet</div>
          </div>
        )}

        {/* Print/Download Button */}
        <div className="text-center">
          <PrintButton type="passenger-list" id={trip.id} label="Generate Full Receipt (PDF)" />
        </div>
      </div>

      {/* Hidden receipt container for PDF generation - keeps original structure */}
      <div ref={receiptRef} className="hidden receipt-container" style={{ fontFamily: "Times New Roman, serif" }}>
        <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>ፈለገ ግዮን ባስ ትራንስፖርት</h1>
            <h2 style={{ margin: 0, fontSize: 14 }}>የገንዘብ ማጠቃለያ እና መረከቢያ ሰነድ ቅጽ</h2>
          </div>
          <div>
            <PrintButton type="passenger-list" id={trip.id} label="Print / Download" />
          </div>
        </div>

        <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
          <span>የገንዘብ ተቀባይ ስም: _________________</span>
          <span>መስመር: {trip.origin} - {trip.destination}</span>
          <span>ቀን: {new Date(trip.departure_time).toLocaleDateString('am-ET')}</span>
          <span>የጎ ቁጥር: {trip.tripNumber || 'N/A'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">ተ.ቁ.</th>
                <th className="border border-gray-300 p-2 text-left">የተሳፋሪው ስም</th>
                <th className="border border-gray-300 p-2 text-left">ስልክ ቁጥር</th>
                <th className="border border-gray-300 p-2 text-left">የትኬት ቁጥር</th>
                <th className="border border-gray-300 p-2 text-left">የከፈለው ብር</th>
                <th className="border border-gray-300 p-2 text-left">አስተያየት</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((passenger, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{passenger.seat_number}</td>
                  <td className="border border-gray-300 p-2">{passenger.passenger_name}</td>
                  <td className="border border-gray-300 p-2">{passenger.passenger_phone}</td>
                  <td className="border border-gray-300 p-2">{(passenger as any).ticket_id || ''}</td>
                  <td className="border border-gray-300 p-2">{(passenger as any).amount_paid ?? ''}</td>
                  <td className="border border-gray-300 p-2 h-12">{(passenger as any).note || ''}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td colSpan={4} className="border border-gray-300 p-2 text-right">ጠቅላላ ድምር:</td>
                <td className="border border-gray-300 p-2">{passengers.reduce((s, p) => s + (Number((p as any).amount_paid) || 0), 0) || ''}</td>
                <td className="border border-gray-300 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="signatures">
          <div>
            <div>የገንዘብ ተቀባይ ስምና ፊርማ</div>
            <div className="signature-line"></div>
          </div>
          <div>
            <div>የተረካቢ ስም��� ፊርማ</div>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
