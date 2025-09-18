"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Route {
  id: string
  name: string
  origin: string
  destination: string
  distance_km: number | null
  estimated_duration_hours: number | null
  description: string | null
}

interface EditRouteFormProps {
  route: Route
}

export function EditRouteForm({ route }: EditRouteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    distance_km: route.distance_km?.toString() || "",
    estimated_duration_hours: route.estimated_duration_hours?.toString() || "",
    description: route.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/routes/${route.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          origin: formData.origin,
          destination: formData.destination,
          distance_km: formData.distance_km ? Number.parseInt(formData.distance_km) : null,
          estimated_duration_hours: formData.estimated_duration_hours ? Number.parseFloat(formData.estimated_duration_hours) : null,
          description: formData.description || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update route")
      }

      toast.success("Route updated successfully!")
      router.push(`/admin/routes/${route.id}`)
    } catch (error) {
      console.error("Error updating route:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update route. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Route Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Addis Ababa - Bahir Dar"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            value={formData.origin}
            onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
            placeholder="e.g., Addis Ababa"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
            placeholder="e.g., Bahir Dar"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance_km">Distance (km)</Label>
          <Input
            id="distance_km"
            type="number"
            min="1"
            value={formData.distance_km}
            onChange={(e) => setFormData((prev) => ({ ...prev, distance_km: e.target.value }))}
            placeholder="e.g., 565"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_duration_hours">Duration (hours)</Label>
          <Input
            id="estimated_duration_hours"
            type="number"
            step="0.5"
            min="0.5"
            value={formData.estimated_duration_hours}
            onChange={(e) => setFormData((prev) => ({ ...prev, estimated_duration_hours: e.target.value }))}
            placeholder="e.g., 8.5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="e.g., Main route to Bahir Dar via Debre Markos"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Updating Route..." : "Update Route"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}