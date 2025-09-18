"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface EnhancedSeatMapProps {
  tripId: string
  totalSeats: number
  bookedSeats: { seat_number: number; booking_id: string }[]
  busName?: string
  amenities?: string[]
  isAdmin: boolean
}

interface SeatStatus {
  seat_number: number
  status: "available" | "reserved" | "booked" | "disabled"
  reserved_by?: string
  expires_at?: string
}

export default function EnhancedSeatMap({
  tripId,
  totalSeats,
  bookedSeats,
  busName = "Felege Giyon Express",
  amenities = ["wifi", "breakfast", "usb_charger"],
  isAdmin,
}: EnhancedSeatMapProps) {
  const [selectedSeat, setSelectedSeat] = useState<{ seatNumber: number; bookingId?: string } | null>(null)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSeatStatusState, setSelectedSeatStatusState] = useState<SeatStatus['status'] | null>(null);
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchSeatStatuses()
  }, [tripId])

  const fetchSeatStatuses = async () => {
    try {
      console.log("[v0] Fetching seat statuses for trip:", tripId)
      const { data, error } = await supabase.from("seat_reservations").select("*").eq("trip_id", tripId)

      if (error) {
        console.error("[v0] Error fetching seat statuses:", error)
        throw error
      }

      const statuses: SeatStatus[] = []
      for (let i = 1; i <= totalSeats; i++) {
        const seatData = data?.find((s: { seat_number: number }) => s.seat_number === i)
        const bookingInfo = bookedSeats.find(b => b.seat_number === i);

        statuses.push({
          seat_number: i,
          status: bookingInfo ? "booked" : seatData?.status || "available",
          reserved_by: seatData?.reserved_by,
          expires_at: seatData?.expires_at,
        })
      }
      setSeatStatuses(statuses)
    } catch (error) {
      console.error("Error fetching seat statuses:", error)
    }
  }

  const handleSeatClick = async (seatNumber: number) => {
    if (seatNumber > totalSeats) {
      console.warn(`Seat number ${seatNumber} is out of range.`);
      return;
    }
    const seatStatus = seatStatuses.find(s => s.seat_number === seatNumber)?.status || 'available';
    const booking = bookedSeats.find(b => b.seat_number === seatNumber);
    
    setSelectedSeat({ seatNumber, bookingId: booking?.booking_id });
    setSelectedSeatStatusState(seatStatus);
    setDialogVisible(true);
  };

  const handleSeatAction = async (action: 'book' | 'reserve' | 'disable' | 'unreserve' | 'undisable' | 'cancel-booking') => {
    if (!selectedSeat) return;

    const { seatNumber, bookingId } = selectedSeat;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
        return;
    }

    setDialogVisible(false);

  if (action === 'book') {
    // navigate to booking page with `seat` query param (booking page reads `seat`)
    router.push(`/dashboard/trips/${tripId}/book?seat=${seatNumber}`);
    return;
  }

    if (action === 'cancel-booking') {
        if (!isAdmin || !bookingId) return;

        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) {
            console.error('Error cancelling booking:', error);
            toast({ title: "Error", description: "Could not cancel the booking.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Booking for seat ${seatNumber} has been cancelled.` });
      await fetchSeatStatuses();
      try { router.refresh(); } catch (e) { /* noop if router.refresh unavailable */ }
      await logActivity(`Booking for seat ${seatNumber} cancelled for trip ${tripId}`);
    }
        return;
    }

    if (action === 'reserve' || action === 'disable') {
        const status = action === 'reserve' ? 'reserved' : 'disabled';
        const expires_at = action === 'reserve' ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
        
        const { error } = await supabase
            .from('seat_reservations')
            .insert({ 
                trip_id: tripId, 
                seat_number: seatNumber, 
                status,
                created_by: user.id,
                expires_at,
            });

        if (error) {
            console.error(`Error ${action}ing seat:`, error);
            toast({ title: `Error ${action}ing seat`, description: error.message, variant: "destructive" });
      } else {
      toast({ title: "Success", description: `Seat ${seatNumber} has been ${status}.` });
      await fetchSeatStatuses();
      try { router.refresh(); } catch (e) { }
      await logActivity(`Seat ${seatNumber} ${status} for trip ${tripId}`);
    }
        return;
    }

    if (action === 'unreserve' || action === 'undisable') {
        const status = action === 'unreserve' ? 'reserved' : 'disabled';
        
        console.log(`Admin ${action}ing seat ${seatNumber} with status ${status} for trip ${tripId}`);
        
        if (isAdmin) {
          // Use admin API endpoint for admins to bypass RLS
          try {
            const response = await fetch(`/api/admin/seats/${tripId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                seat_number: seatNumber,
                status: status
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to unreserve seat');
            }

            const successMessage = action === 'unreserve' ? 'unreserved' : 'enabled';
            console.log(`Successfully ${successMessage} seat ${seatNumber}`);
            toast({ title: "Success", description: `Seat ${seatNumber} has been ${successMessage}.` });
            await fetchSeatStatuses();
            try { router.refresh(); } catch (e) { }
            await logActivity(`Seat ${seatNumber} ${successMessage} for trip ${tripId}`);
          } catch (error: any) {
            console.error(`Error ${action}ing seat:`, error);
            toast({ title: `Error ${action}ing seat`, description: error.message, variant: "destructive" });
          }
        } else {
          // For regular users, use direct Supabase query (RLS will handle permissions)
          const { error } = await supabase
              .from('seat_reservations')
              .delete()
              .eq('trip_id', tripId)
              .eq('seat_number', seatNumber)
              .eq('status', status);

          if (error) {
              console.error(`Error ${action}ing seat:`, error);
              toast({ title: `Error ${action}ing seat`, description: error.message, variant: "destructive" });
          } else {
            const successMessage = action === 'unreserve' ? 'unreserved' : 'enabled';
            console.log(`Successfully ${successMessage} seat ${seatNumber}`);
            toast({ title: "Success", description: `Seat ${seatNumber} has been ${successMessage}.` });
            await fetchSeatStatuses();
            try { router.refresh(); } catch (e) { }
            await logActivity(`Seat ${seatNumber} ${successMessage} for trip ${tripId}`);
          }
        }
        return;
    }
  };

  const logActivity = async (action: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc('log_activity', {
        p_action: action,
        p_details: { user: user.email },
        p_trip_id: tripId,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const generateBusLayout = () => {
    const layout = [];
    let currentSeatNumber = 1;
    
    // Calculate rows needed based on total seats
    // Standard bus layout: 4 seats per row (2-2 with aisle), plus driver area
    const seatsPerRow = 4;
    const totalRows = Math.ceil(totalSeats / seatsPerRow) + 1; // +1 for driver area
    
    for (let i = 0; i < totalRows; i++) {
      const row = [];
      
      // First row is driver area (no seats)
      if (i === 0) {
        row.push(<div key="driver-left" className="w-10 h-10" />);
        row.push(<div key="driver-wheel" className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xs">🚗</div>);
        row.push(<div key="aisle-0" className="w-10 h-10" />);
        row.push(<div key="driver-door" className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">🚪</div>);
        row.push(<div key="driver-right" className="w-10 h-10" />);
      } else {
        // Regular seat rows: Left seat, Left seat, Aisle, Right seat, Right seat
        for (let j = 0; j < 5; j++) {
          if (j === 2) {
            // Aisle space
            row.push(<div key={`aisle-${i}`} className="w-10 h-10" />);
            continue;
          }
          
          if (currentSeatNumber > totalSeats) {
            // Empty space if we've run out of seats
            row.push(<div key={`empty-${i}-${j}`} className="w-10 h-10" />);
            continue;
          }

          const seatNum = currentSeatNumber;
          const seatStatus = seatStatuses.find(s => s.seat_number === seatNum)?.status || 'available';
          
          const button = (
            <Button
              key={seatNum}
              onClick={() => handleSeatClick(seatNum)}
              className={cn("w-10 h-10 text-xs font-bold", {
                "bg-gray-400 hover:bg-gray-500": seatStatus === 'booked',
                "bg-yellow-400 hover:bg-yellow-500": seatStatus === 'reserved',
                "bg-red-500 hover:bg-red-600": seatStatus === 'disabled',
                "bg-green-500 hover:bg-green-600": seatStatus === 'available',
              })}
              disabled={seatStatus === 'booked'}
            >
              {seatNum}
            </Button>
          );
          row.push(button);
          currentSeatNumber++;
        }
      }
      
      layout.push(<div key={`row-${i}`} className="flex justify-center gap-2 mb-2">{row}</div>);
    }
    return layout;
  };

  return (
    <div className="space-y-4">
      {/* Bus Info */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{busName}</h2>
        {amenities && amenities.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-center mb-3">
            {amenities.slice(0, 4).map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity.replace("_", " ")}
              </Badge>
            ))}
            {amenities.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{amenities.length - 4} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Seat Statistics */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-green-50 p-2 rounded-lg">
          <div className="text-lg font-bold text-green-600">{seatStatuses.filter(s => s.status === 'available').length}</div>
          <div className="text-xs text-gray-600">Available</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <div className="text-lg font-bold text-gray-600">{bookedSeats.length}</div>
          <div className="text-xs text-gray-600">Booked</div>
        </div>
        <div className="bg-yellow-50 p-2 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">{seatStatuses.filter(s => s.status === 'reserved').length}</div>
          <div className="text-xs text-gray-600">Reserved</div>
        </div>
        <div className="bg-red-50 p-2 rounded-lg">
          <div className="text-lg font-bold text-red-600">{seatStatuses.filter(s => s.status === 'disabled').length}</div>
          <div className="text-xs text-gray-600">Disabled</div>
        </div>
      </div>

      {/* Seat Map */}
      <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-200 p-4 rounded-lg">
        <div className="text-center mb-3">
          <div className="text-xs text-gray-600 mb-2">Front of Bus</div>
          <div className="w-full h-1 bg-blue-300 rounded"></div>
        </div>
        {generateBusLayout()}
        <div className="text-center mt-3">
          <div className="w-full h-1 bg-blue-300 rounded mb-2"></div>
          <div className="text-xs text-gray-600">Back of Bus</div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Disabled</span>
        </div>
      </div>
      <Dialog open={dialogVisible} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedSeat(null);
          setSelectedSeatStatusState(null);
        }
        setDialogVisible(isOpen);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seat {selectedSeat?.seatNumber} Actions</DialogTitle>
            <DialogDescription>
              Choose what you'd like to do with seat {selectedSeat?.seatNumber} (Status: {selectedSeatStatusState})
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
              {selectedSeatStatusState === 'available' && (
                <>
                  <Button onClick={() => handleSeatAction('book')}>Book Seat</Button>
                  <Button onClick={() => handleSeatAction('reserve')} variant="secondary">Reserve Seat</Button>
                  {isAdmin && <Button onClick={() => handleSeatAction('disable')} variant="destructive">Disable Seat</Button>}
                </>
              )}
              {selectedSeatStatusState === 'booked' && (
                 <>
                  <p>This seat is already booked.</p>
                  {isAdmin && <Button onClick={() => handleSeatAction('cancel-booking')} variant="destructive">Cancel Booking</Button>}
                </>
              )}
              {selectedSeatStatusState === 'reserved' && (
                 <>
                  <p>This seat is currently reserved.</p>
                  {isAdmin && <Button onClick={() => handleSeatAction('unreserve')} variant="outline">Unreserve Seat</Button>}
                </>
              )}
              {selectedSeatStatusState === 'disabled' && (
                <>
                  <p>This seat is currently disabled.</p>
                  {isAdmin && <Button onClick={() => handleSeatAction('undisable')} variant="outline">Enable Seat</Button>}
                </>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}