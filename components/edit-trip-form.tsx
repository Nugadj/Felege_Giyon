"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, Clock, DollarSign } from "lucide-react"

interface Bus {
  id: string
  name: string
  plate_number: string
  total_seats: number
}

interface Trip {
  id: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  price: number
  bus_id: string
  description: string | null
  status: string
}

interface EditTripFormProps {
  trip: Trip
  buses: Bus[]
}

export function EditTripForm({ trip, buses }: EditTripFormProps) {
  const [formData, setFormData] = useState({
    origin: trip.origin,
    destination: trip.destination,
    departure_time: trip.departure_time.slice(0, 16), // Format for datetime-local input
    arrival_time: trip.arrival_time.slice(0, 16),
    price: trip.price.toString(),
    bus_id: trip.bus_id,
    description: trip.description || "",
    status: trip.status,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: formData.origin,
          destination: formData.destination,
          departure_time: formData.departure_time,
          arrival_time: formData.arrival_time,
          price: Number.parseFloat(formData.price),
          bus_id: formData.bus_id,
          description: formData.description,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update trip")
      }

      router.push("/admin/trips")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred while updating the trip")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-black">Route Information</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="origin">Origin *</Label>
            <Input
              id="origin"
              type="text"
              value={formData.origin}
              onChange={(e) => handleInputChange("origin", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              type="text"
              value={formData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-black">Schedule</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="departure_time">Departure Time *</Label>
            <Input
              id="departure_time"
              type="datetime-local"
              value={formData.departure_time}
              onChange={(e) => handleInputChange("departure_time", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrival_time">Arrival Time *</Label>
            <Input
              id="arrival_time"
              type="datetime-local"
              value={formData.arrival_time}
              onChange={(e) => handleInputChange("arrival_time", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Bus and Pricing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-black">Bus & Pricing</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bus_id">Select Bus *</Label>
            <Select value={formData.bus_id} onValueChange={(value) => handleInputChange("bus_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.name} ({bus.plate_number}) - {bus.total_seats} seats
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (ETB) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="boarding">Boarding</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Additional trip information, stops, or special notes"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-black text-white hover:bg-gray-800" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating Trip...
            </>
          ) : (
            "Update Trip"
          )}
        </Button>
      </div>
    </form>
  )
}
