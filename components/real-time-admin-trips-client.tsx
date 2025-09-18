"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Bus, MapPin, Clock, Users, Plus, Search, Filter, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AdminTrip {
  id: string
  origin: string
  destination: string
  departure_time: string
  price: number
  status: string
  buses: {
    name: string
    total_seats: number
  }
  bookings: { id: string; status: string }[]
}

interface RealTimeAdminTripsClientProps {
  initialTrips: AdminTrip[]
}

export function RealTimeAdminTripsClient({ initialTrips }: RealTimeAdminTripsClientProps) {
  const [trips, setTrips] = useState<AdminTrip[]>(initialTrips)
  const [filteredTrips, setFilteredTrips] = useState<AdminTrip[]>(initialTrips)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [routeFilter, setRouteFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel("admin-trips-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        refreshTrips()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        refreshTrips()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let filtered = trips

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (trip) =>
          trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.buses?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.status === statusFilter)
    }

    // Route filter
    if (routeFilter !== "all") {
      const [origin, destination] = routeFilter.split("-")
      filtered = filtered.filter(
        (trip) => trip.origin.toLowerCase().includes(origin) && trip.destination.toLowerCase().includes(destination),
      )
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      filtered = filtered.filter((trip) => {
        const tripDate = new Date(trip.departure_time)
        switch (dateFilter) {
          case "today":
            return tripDate >= today && tripDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          case "week":
            return tripDate >= weekStart
          case "month":
            return tripDate >= monthStart
          default:
            return true
        }
      })
    }

    setFilteredTrips(filtered)
  }, [trips, searchTerm, statusFilter, routeFilter, dateFilter])

  const refreshTrips = async () => {
    try {
      const { data: trips } = await supabase
        .from("trips")
        .select(`
          *,
          buses (name, plate_number, total_seats),
          bookings (id, status)
        `)
        .order("departure_time", { ascending: false })

      if (trips) {
        setTrips(trips)
      }
    } catch (error) {
      console.error("Error refreshing admin trips:", error)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    // this function will be triggered after the user confirms in the dialog (see UI below)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete trip")
      }

      toast.success("Trip deleted successfully!")
      await refreshTrips()
    } catch (error) {
      console.error("Error deleting trip:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete trip. Please try again.")
    }
  }

  // Calculate trip statistics
  const totalTrips = trips?.length || 0
  const activeTrips = trips?.filter((trip) => trip.status === "active").length || 0
  const completedTrips = trips?.filter((trip) => trip.status === "completed").length || 0
  const cancelledTrips = trips?.filter((trip) => trip.status === "cancelled").length || 0

  return (
    <>
      {/* Confirm Delete Trip Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTripToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!tripToDelete) return
                setDeleteDialogOpen(false)
                await handleDeleteTrip(tripToDelete)
                setTripToDelete(null)
              }}
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Statistics Cards - Mobile First */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">Total</p>
                <p className="text-xl font-bold">{totalTrips}</p>
                <p className="text-blue-100 text-xs">Trips</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Active</p>
                <p className="text-xl font-bold">{activeTrips}</p>
                <p className="text-green-100 text-xs">Running</p>
              </div>
              <Bus className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">Done</p>
                <p className="text-xl font-bold">{completedTrips}</p>
                <p className="text-purple-100 text-xs">Finished</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">Cancelled</p>
                <p className="text-xl font-bold">{cancelledTrips}</p>
                <p className="text-orange-100 text-xs">Cancelled</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 bg-white/90 backdrop-blur-sm border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search trips..."
                className="pl-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                <SelectItem value="addis-bahir dar">Addis - Bahir Dar</SelectItem>
                <SelectItem value="addis-gondar">Addis - Gondar</SelectItem>
                <SelectItem value="addis-mekelle">Addis - Mekelle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips List - Mobile Optimized */}
      <div className="space-y-4">
        {filteredTrips?.map((trip) => {
          const bookedSeats = trip.bookings?.filter((b) => b.status === "booked").length || 0
          const reservedSeats = trip.bookings?.filter((b) => b.status === "reserved").length || 0
          const totalCapacity = trip.buses?.total_seats || 0
          const occupancyRate = totalCapacity > 0 ? (((bookedSeats + reservedSeats) / totalCapacity) * 100).toFixed(1) : 0

          return (
            <Card key={trip.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {trip.origin} → {trip.destination}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <Bus className="w-3 h-3" />
                        {trip.buses?.name}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      trip.status === "active"
                        ? "default"
                        : trip.status === "completed"
                          ? "secondary"
                          : trip.status === "cancelled"
                            ? "destructive"
                            : "outline"
                    }
                    className="text-xs"
                  >
                    {trip.status}
                  </Badge>
                </div>

                {/* Trip Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{trip.price}</div>
                    <div className="text-xs text-gray-600">ETB</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{bookedSeats + reservedSeats}</div>
                    <div className="text-xs text-gray-600">/{totalCapacity} seats</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600">{occupancyRate}%</div>
                    <div className="text-xs text-gray-600">occupied</div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(trip.departure_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{bookedSeats} booked, {reservedSeats} reserved</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Link href={`/admin/trips/${trip.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setTripToDelete(trip.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Empty State */}
        {(!filteredTrips || filteredTrips.length === 0) && (
          <Card className="bg-white/90 backdrop-blur-sm text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Trips Found</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {searchTerm || statusFilter !== "all" || routeFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters to see more trips."
                  : "Create your first trip to start managing bus schedules."}
              </p>
              <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/admin/trips/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Trip
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Trip Button - Floating */}
        {filteredTrips && filteredTrips.length > 0 && (
          <div className="text-center pt-6">
            <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link href="/admin/trips/new">
                <Plus className="w-4 h-4 mr-2" />
                Add New Trip
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
