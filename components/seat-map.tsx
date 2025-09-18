"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface SeatMapProps {
  tripId: string
  totalSeats: number
  bookedSeats: number[]
}

interface SeatStatus {
  seat_number: number
  status: "available" | "reserved" | "booked" | "disabled"
  reserved_by?: string
  expires_at?: string
}

export default function SeatMap({ tripId, totalSeats, bookedSeats }: SeatMapProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  const [showSeatDialog, setShowSeatDialog] = useState(false)
  const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSeatStatuses()
  }, [tripId])

  const fetchSeatStatuses = async () => {
    try {
      const { data, error } = await supabase.from("seat_reservations").select("*").eq("trip_id", tripId)

      if (error) throw error

      // Create seat status array for all seats
      const statuses: SeatStatus[] = []
      for (let i = 1; i <= totalSeats; i++) {
        const seatData = data?.find((s) => s.seat_number === i)
        const isBooked = bookedSeats.includes(i)

        statuses.push({
          seat_number: i,
          status: isBooked ? "booked" : seatData?.status || "available",
          reserved_by: seatData?.reserved_by,
          expires_at: seatData?.expires_at,
        })
      }

      setSeatStatuses(statuses)
    } catch (error) {
      console.error("Error fetching seat statuses:", error)
    }
  }

  const handleSeatClick = (seatNumber: number) => {
    const seatStatus = seatStatuses.find((s) => s.seat_number === seatNumber)
    if (seatStatus?.status === "available") {
      setSelectedSeat(seatNumber)
      setShowSeatDialog(true)
    }
  }

  const handleSeatAction = async (action: "reserve" | "book" | "disable") => {
    if (!selectedSeat) return

    setIsLoading(true)
    try {
      if (action === "disable") {
        const { error } = await supabase.from("seat_reservations").upsert({
          trip_id: tripId,
          seat_number: selectedSeat,
          status: "disabled",
        })

        if (error) throw error

        // Log activity
        await supabase.rpc("log_activity", {
          p_action: "seat_disabled",
          p_details: { seat_number: selectedSeat },
          p_trip_id: tripId,
        })

        fetchSeatStatuses()
        setShowSeatDialog(false)
        setSelectedSeat(null)
      } else {
        const actionParam = action === "reserve" ? "reserve" : "book"
        router.push(`/dashboard/trips/${tripId}/book?seat=${selectedSeat}&action=${actionParam}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing seat:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSeatLayout = () => {
    const seats = []
    let seatNumber = 1

    // Driver area with steering wheel
    seats.push(
      <div key="driver-area" className="col-span-4 flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-8 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-600">
            <div className="w-6 h-6 bg-gray-400 rounded-full border border-gray-500"></div>
          </div>
          <span className="text-xs text-gray-600 font-medium">Driver</span>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Front Exit Door</div>
      </div>,
    )

    // Generate rows of seats with proper bus layout
    for (let row = 0; row < Math.ceil(totalSeats / 4); row++) {
      const rowSeats = []

      // Left side seats (2 seats)
      for (let leftSeat = 0; leftSeat < 2; leftSeat++) {
        if (seatNumber <= totalSeats) {
          const seatStatus = seatStatuses.find((s) => s.seat_number === seatNumber)
          const status = seatStatus?.status || "available"

          rowSeats.push(
            <button
              key={seatNumber}
              onClick={() => handleSeatClick(seatNumber)}
              disabled={status !== "available"}
              className={cn(
                "w-14 h-14 rounded-lg border-2 text-xs font-bold transition-all duration-200 hover:scale-105 relative",
                {
                  "bg-green-500 border-green-600 text-white shadow-lg": status === "available",
                  "bg-orange-500 border-orange-600 text-white cursor-not-allowed": status === "reserved",
                  "bg-gray-500 border-gray-600 text-white cursor-not-allowed": status === "booked",
                  "bg-red-500 border-red-600 text-white cursor-not-allowed": status === "disabled",
                  "hover:border-green-400 hover:bg-green-400": status === "available",
                },
              )}
            >
              {seatNumber}
              {status === "reserved" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-300 rounded-full"></div>
              )}
            </button>,
          )
          seatNumber++
        }
      }

      // Aisle space with carpet pattern
      rowSeats.push(
        <div key={`aisle-${row}`} className="w-12 flex justify-center">
          <div className="w-2 h-12 bg-gradient-to-b from-blue-100 to-blue-200 rounded-sm border border-blue-300"></div>
        </div>,
      )

      // Right side seats (2 seats)
      for (let rightSeat = 0; rightSeat < 2; rightSeat++) {
        if (seatNumber <= totalSeats) {
          const seatStatus = seatStatuses.find((s) => s.seat_number === seatNumber)
          const status = seatStatus?.status || "available"

          rowSeats.push(
            <button
              key={seatNumber}
              onClick={() => handleSeatClick(seatNumber)}
              disabled={status !== "available"}
              className={cn(
                "w-14 h-14 rounded-lg border-2 text-xs font-bold transition-all duration-200 hover:scale-105 relative",
                {
                  "bg-green-500 border-green-600 text-white shadow-lg": status === "available",
                  "bg-orange-500 border-orange-600 text-white cursor-not-allowed": status === "reserved",
                  "bg-gray-500 border-gray-600 text-white cursor-not-allowed": status === "booked",
                  "bg-red-500 border-red-600 text-white cursor-not-allowed": status === "disabled",
                  "hover:border-green-400 hover:bg-green-400": status === "available",
                },
              )}
            >
              {seatNumber}
              {status === "reserved" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-300 rounded-full"></div>
              )}
            </button>,
          )
          seatNumber++
        }
      }

      seats.push(
        <div key={`row-${row}`} className="col-span-4 grid grid-cols-5 gap-3 mb-3 justify-items-center px-4">
          {rowSeats}
        </div>,
      )
    }

    // Back exit door
    seats.push(
      <div key="back-exit" className="col-span-4 flex justify-center mt-6">
        <div className="text-xs text-gray-500 bg-gray-100 px-4 py-2 rounded-lg border">Back Exit Door</div>
      </div>,
    )

    return seats
  }

  return (
    <div className="space-y-6">
      {/* Bus Frame */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 p-6 rounded-2xl border-4 border-gray-300 shadow-xl">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">{generateSeatLayout()}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-medium mb-3 text-center">Seat Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
              3
            </div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 border-2 border-orange-600 rounded text-white text-xs flex items-center justify-center font-bold">
              7
            </div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-500 border-2 border-gray-600 rounded text-white text-xs flex items-center justify-center font-bold">
              11
            </div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 border-2 border-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
              15
            </div>
            <span>Disabled</span>
          </div>
        </div>
      </div>

      {/* Seat Action Dialog */}
      <Dialog open={showSeatDialog} onOpenChange={setShowSeatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seat {selectedSeat} Actions</DialogTitle>
            <DialogDescription>Choose an action for seat {selectedSeat}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => handleSeatAction("reserve")}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Reserve Seat
            </Button>
            <Button
              onClick={() => handleSeatAction("book")}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Book Seat
            </Button>
            <Button
              onClick={() => handleSeatAction("disable")}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              Disable Seat
            </Button>
            <Button onClick={() => setShowSeatDialog(false)} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p>Click on any available (green) seat to see booking options.</p>
      </div>
    </div>
  )
}
