"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Users, Receipt, DollarSign } from "lucide-react"

interface BookingFormProps {
  tripId: string
  selectedSeat: number | null
}

interface BookingData {
  passengerName: string
  passengerPhone: string
  passengerIdNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  seatNumber: number
  ticketId: string
  amountPaid: number
  note: string
}

export default function BookingForm({ tripId, selectedSeat }: BookingFormProps) {
  const searchParams = useSearchParams()
  const action = searchParams.get("action") || "book"
  // Support seat provided via search params (from seat map) under either `seat` or legacy `seat_number`.
  const seatFromParams = Number(searchParams.get("seat") || searchParams.get("seat_number") || "0") || 0

  const generateTicketId = () => {
    return `FG${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`
  }

  const [formData, setFormData] = useState<BookingData>({
    passengerName: "",
    passengerPhone: "",
    passengerIdNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    // Prefill seat number from prop or URL param if provided
    seatNumber: selectedSeat || seatFromParams || 0,
    ticketId: generateTicketId(),
    amountPaid: 0,
    note: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: keyof BookingData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.passengerName.trim()) {
      setError("Passenger name is required")
      return false
    }
    if (!formData.passengerPhone.trim()) {
      setError("Passenger phone number is required")
      return false
    }
    if (!formData.seatNumber || formData.seatNumber <= 0) {
      setError("Please select a seat number")
      return false
    }
    if (formData.passengerPhone.length < 10) {
      setError("Please enter a valid phone number")
      return false
    }
    if (action === "book" && (!formData.amountPaid || formData.amountPaid <= 0)) {
      setError("Please enter the amount paid")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("You must be logged in to make a booking")
      }

      if (action === "reserve") {
        const { error: reservationError } = await supabase.from("seat_reservations").upsert({
          trip_id: tripId,
          seat_number: formData.seatNumber,
          status: "reserved",
          reserved_by: user.id,
          reserved_at: new Date().toISOString(),
          expires_at: null,
        })

        if (reservationError) throw reservationError

        await supabase.rpc("log_activity", {
          p_action: "seat_reserved",
          p_details: {
            seat_number: formData.seatNumber,
            passenger_name: formData.passengerName,
          },
          p_trip_id: tripId,
        })

        setSuccess(true)
        setTimeout(() => {
          router.push(`/dashboard/trips/${tripId}/seats`)
          router.refresh()
        }, 2000)
        return
      }

      // Check for existing reservation before booking
      const { data: existingReservation } = await supabase
        .from("seat_reservations")
        .select("id, status")
        .eq("trip_id", tripId)
        .eq("seat_number", formData.seatNumber)
        .single()

      if (existingReservation && existingReservation.status === "booked") {
        throw new Error("This seat has already been booked. Please select another seat.")
      }

      const { data: trip } = await supabase.from("trips").select("price").eq("id", tripId).single()

      if (!trip) {
        throw new Error("Trip not found")
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          trip_id: tripId,
          seat_number: formData.seatNumber,
          passenger_name: formData.passengerName,
          passenger_phone: formData.passengerPhone,
          passenger_id_number: formData.passengerIdNumber || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          created_by: user.id,
          status: "booked",
          ticket_id: formData.ticketId,
          amount_paid: formData.amountPaid,
          note: formData.note || null,
        })
        .select()
        .single()

      if (bookingError) {
        throw bookingError
      }

      await supabase.from("seat_reservations").upsert({
        trip_id: tripId,
        seat_number: formData.seatNumber,
        status: "booked",
        reserved_by: user.id,
        reserved_at: new Date().toISOString(),
      })

      await supabase.rpc("log_activity", {
        p_action: "booking_created",
        p_details: {
          seat_number: formData.seatNumber,
          passenger_name: formData.passengerName,
          passenger_phone: formData.passengerPhone,
          ticket_id: formData.ticketId,
          amount_paid: formData.amountPaid,
        },
        p_booking_id: booking.id,
        p_trip_id: tripId,
        p_amount: formData.amountPaid,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/bookings/${booking.id}`)
        router.refresh()
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred while creating the booking")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-green-800">
          {action === "reserve"
            ? "Seat reserved successfully! Redirecting to seat map..."
            : "Booking created successfully! Redirecting to booking details..."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">{action === "reserve" ? "Reserve Seat" : "Complete Booking"}</h2>
        <p className="text-sm text-gray-600">
          {action === "reserve"
            ? "Reserve this seat permanently until you decide to book or unreserve it"
            : "Fill in passenger details to complete the booking"}
        </p>
      </div>

      {/* Passenger Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Passenger Details
          </CardTitle>
          <CardDescription>Primary passenger information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="passengerName">Full Name *</Label>
              <Input
                id="passengerName"
                type="text"
                placeholder="Enter passenger full name"
                value={formData.passengerName}
                onChange={(e) => handleInputChange("passengerName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengerPhone">Phone Number *</Label>
              <Input
                id="passengerPhone"
                type="tel"
                placeholder="+251 9XX XXX XXX"
                value={formData.passengerPhone}
                onChange={(e) => handleInputChange("passengerPhone", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="passengerIdNumber">ID Number (Optional)</Label>
              <Input
                id="passengerIdNumber"
                type="text"
                placeholder="National ID or Passport number"
                value={formData.passengerIdNumber}
                onChange={(e) => handleInputChange("passengerIdNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seatNumber">Seat Number *</Label>
              <Input
                id="seatNumber"
                type="number"
                min="1"
                max="51"
                placeholder="Select seat number"
                value={formData.seatNumber || ""}
                onChange={(e) => handleInputChange("seatNumber", Number.parseInt(e.target.value) || 0)}
                required
                disabled={!!selectedSeat}
              />
              {!selectedSeat && (
                <p className="text-sm text-blue-600">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-blue-600"
                    onClick={() => router.push(`/dashboard/trips/${tripId}/seats`)}
                  >
                    Choose seat from seat map
                  </Button>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {action === "book" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Booking Details
            </CardTitle>
            <CardDescription>Ticket and payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ticketId">Ticket ID</Label>
                <Input
                  id="ticketId"
                  type="text"
                  placeholder="Auto-generated ticket ID"
                  value={formData.ticketId}
                  onChange={(e) => handleInputChange("ticketId", e.target.value)}
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (ETB) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="amountPaid"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amountPaid || ""}
                    onChange={(e) => handleInputChange("amountPaid", Number.parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Additional notes or comments"
                value={formData.note}
                onChange={(e) => handleInputChange("note", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {action === "book" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>Emergency contact information (optional but recommended)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  type="text"
                  placeholder="Emergency contact full name"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  placeholder="+251 9XX XXX XXX"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          className={`flex-1 ${action === "reserve" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {action === "reserve" ? "Reserving Seat..." : "Creating Booking..."}
            </>
          ) : action === "reserve" ? (
            "Reserve Seat (Permanent)"
          ) : (
            "Complete Booking"
          )}
        </Button>
      </div>
    </form>
  )
}
