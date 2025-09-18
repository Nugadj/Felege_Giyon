"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, Clock, Bus, Users } from "lucide-react"

interface AcceptAssignmentFormProps {
  assignment: {
    id: string
    status: string
    notes: string
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
        total_seats: number
      }
    }
  }
}

export function AcceptAssignmentForm({ assignment }: AcceptAssignmentFormProps) {
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("trip_assignments")
        .update({
          status: "accepted",
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignment.id)

      if (updateError) throw updateError

      // Log activity
      await supabase.rpc("log_activity", {
        p_action: "assignment_accepted",
        p_details: {
          assignment_id: assignment.id,
          trip_id: assignment.trips.id,
          notes: notes,
        },
        p_trip_id: assignment.trips.id,
      })

      router.push("/driver")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred while accepting the assignment")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Trip Details
          </CardTitle>
          <CardDescription>Review the trip information before accepting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Route</Label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {assignment.trips.origin} → {assignment.trips.destination}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Bus</Label>
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-gray-500" />
                <span>
                  {assignment.trips.buses.name} ({assignment.trips.buses.plate_number})
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Departure</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">{formatTime(assignment.trips.departure_time)}</div>
                  <div className="text-sm text-gray-600">{formatDate(assignment.trips.departure_time)}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Arrival</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">{formatTime(assignment.trips.arrival_time)}</div>
                  <div className="text-sm text-gray-600">{formatDate(assignment.trips.arrival_time)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Capacity</Label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{assignment.trips.buses.total_seats} seats</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Trip Price</Label>
              <div className="font-medium text-lg text-green-600">{assignment.trips.price} ETB</div>
            </div>
          </div>
          {assignment.notes && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Assignment Notes</Label>
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">{assignment.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acceptance Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
          <CardDescription>Add any notes or comments about accepting this assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes or comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Accepting Assignment...
            </>
          ) : (
            "Accept Assignment"
          )}
        </Button>
      </div>
    </div>
  )
}
