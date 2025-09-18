"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  amenities: string[]
}

interface Route {
  id: string
  name: string
  origin: string
  destination: string
  distance_km: number
  estimated_duration_hours: number
  description: string
}

interface AddTripFormProps {
  buses: Bus[]
}

interface TripData {
  route_id: string
  departure_time: string
  arrival_time: string
  price: number
  bus_id: string
  description: string
  status: string
}

export function AddTripForm({ buses }: AddTripFormProps) {
  const [formData, setFormData] = useState<TripData>({
    route_id: "",
    departure_time: "",
    arrival_time: "",
    price: 0,
    bus_id: "",
    description: "",
    status: "scheduled",
  })
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Fetch routes on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("routes")
          .select("*")
          .order("name", { ascending: true })

        if (error) throw error
        setRoutes(data || [])
      } catch (error) {
        console.error("Error fetching routes:", error)
        setError("Failed to load routes")
      }
    }

    fetchRoutes()
  }, [])

  // Handle route selection
  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r.id === routeId)
    setSelectedRoute(route || null)
    setFormData(prev => ({ ...prev, route_id: routeId }))
  }

  const handleInputChange = (field: keyof TripData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.route_id) {
      setError("Please select a route")
      return false
    }
    if (!formData.departure_time) {
      setError("Departure time is required")
      return false
    }
    if (!formData.arrival_time) {
      setError("Arrival time is required")
      return false
    }
    if (!formData.price || formData.price <= 0) {
      setError("Price must be greater than 0")
      return false
    }
    if (!formData.bus_id) {
      setError("Please select a bus")
      return false
    }

    // Validate that arrival time is after departure time
    const departureDate = new Date(formData.departure_time)
    const arrivalDate = new Date(formData.arrival_time)
    if (arrivalDate <= departureDate) {
      setError("Arrival time must be after departure time")
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
        throw new Error("You must be logged in to create a trip")
      }

      const { data: conflictingTrips, error: conflictError } = await supabase
        .from("trips")
        .select("id, origin, destination, departure_time, arrival_time")
        .eq("bus_id", formData.bus_id)
        .eq("status", "scheduled")
        .gte("arrival_time", formData.departure_time)
        .lte("departure_time", formData.arrival_time)

      if (conflictError) {
        console.error("Error checking bus availability:", conflictError)
        throw new Error("Failed to check bus availability. Please try again.")
      }

      if (conflictingTrips && conflictingTrips.length > 0) {
        const conflict = conflictingTrips[0]
        throw new Error(
          `Selected bus is already scheduled for ${conflict.origin} → ${conflict.destination} during this time period`,
        )
      }

      // Get the selected route data
      if (!selectedRoute) {
        throw new Error("Selected route not found")
      }

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          route_id: formData.route_id,
          origin: selectedRoute.origin,
          destination: selectedRoute.destination,
          departure_time: formData.departure_time,
          arrival_time: formData.arrival_time,
          price: formData.price,
          bus_id: formData.bus_id,
          description: formData.description || null,
          status: formData.status,
          created_by: user.id,
        })
        .select()
        .single()

      if (tripError) {
        console.error("Trip creation error:", tripError)
        throw new Error(`Failed to create trip: ${tripError.message}`)
      }

      console.log("Trip created successfully:", trip)

      setSuccess(true)
      setTimeout(() => {
        router.push("/admin/trips")
      }, 2000)
    } catch (error: unknown) {
      console.error("Trip creation error:", error)
      setError(error instanceof Error ? error.message : "An error occurred while creating the trip")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-green-800">
          Trip created successfully! Redirecting to trips management...
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">Route Information</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="route_id">Select Route *</Label>
            <Select value={formData.route_id} onValueChange={handleRouteChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name} ({route.origin} → {route.destination})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedRoute && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Distance:</span>
                  <span className="ml-2">{selectedRoute.distance_km} km</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Est. Duration:</span>
                  <span className="ml-2">{selectedRoute.estimated_duration_hours}h</span>
                </div>
              </div>
              {selectedRoute.description && (
                <div className="mt-2 text-sm text-gray-600">
                  {selectedRoute.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">Schedule</h3>
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
          <div className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium">Bus & Pricing</h3>
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
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price || ""}
                onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                className="pl-10"
                required
              />
            </div>
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Trip...
            </>
          ) : (
            "Create Trip"
          )}
        </Button>
      </div>
    </form>
  )
}
