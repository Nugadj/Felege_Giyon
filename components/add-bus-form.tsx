"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const AMENITIES = [
  { id: "wifi", label: "WiFi" },
  { id: "ac", label: "Air Conditioning" },
  { id: "usb_charging", label: "USB Charging" },
  { id: "entertainment", label: "Entertainment System" },
  { id: "breakfast", label: "Breakfast Service" },
  { id: "blanket", label: "Blanket & Pillow" },
  { id: "reading_light", label: "Reading Light" },
  { id: "reclining_seats", label: "Reclining Seats" },
]

export function AddBusForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    plate_number: "",
    total_seats: "",
    amenities: [] as string[],
  })

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      amenities: checked ? [...prev.amenities, amenityId] : prev.amenities.filter((id) => id !== amenityId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("buses").insert({
        name: formData.name,
        plate_number: formData.plate_number,
        total_seats: Number.parseInt(formData.total_seats),
        amenities: formData.amenities,
      })

      if (error) throw error

      toast.success("Bus added successfully!")
      router.push("/admin/buses")
    } catch (error) {
      console.error("Error adding bus:", error)
      toast.error("Failed to add bus. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Bus Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Express Coach 1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plate_number">Plate Number</Label>
        <Input
          id="plate_number"
          value={formData.plate_number}
          onChange={(e) => setFormData((prev) => ({ ...prev, plate_number: e.target.value }))}
          placeholder="e.g., ABC-123"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_seats">Total Seats</Label>
        <Input
          id="total_seats"
          type="number"
          min="1"
          max="100"
          value={formData.total_seats}
          onChange={(e) => setFormData((prev) => ({ ...prev, total_seats: e.target.value }))}
          placeholder="e.g., 52"
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {AMENITIES.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Checkbox
                id={amenity.id}
                checked={formData.amenities.includes(amenity.id)}
                onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
              />
              <Label htmlFor={amenity.id} className="text-sm font-normal">
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Adding Bus..." : "Add Bus"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
