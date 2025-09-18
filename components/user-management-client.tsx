"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Plus, Edit, Trash2, Activity, Eye, Calendar, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  totalBookings?: number
  completedBookings?: number
  totalRevenue?: number
}

interface UserManagementClientProps {
  initialUsers: User[]
}

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToView, setUserToView] = useState<User | null>(null)
  const [userBookingDetails, setUserBookingDetails] = useState<any[]>([])
  const [userReservationDetails, setUserReservationDetails] = useState<any[]>([])
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee",
  })
  const router = useRouter()

  const supabase = createClient()

  // Real-time subscription for users
  useEffect(() => {
    const channel = supabase
      .channel("user-management")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        refreshUsers()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        refreshUsers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshUsers = async () => {
    try {
      // use admin-only endpoint to fetch full profiles (service role) in case RLS restricts server queries
      const allRes = await fetch('/api/admin/all-profiles')
      let users = []
      if (allRes.ok) {
        const body = await allRes.json()
        users = body.users || []
      } else {
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
        users = data || []
      }

      const { data: bookingStats } = await supabase.from("bookings").select(`
        created_by,
        status,
        trips (price)
      `)

      const userStats =
        users?.map((user: any) => {
          const userBookings = bookingStats?.filter((booking: any) => booking.created_by === user.id) || []
          const totalBookings = userBookings.length
          const completedBookings = userBookings.filter((b: any) => b.status === "booked").length
          const totalRevenue = userBookings
            .filter((b: any) => b.status === "booked")
            .reduce((sum: number, booking: any) => sum + (Number(booking.trips?.price) || 0), 0)

          return {
            ...user,
            totalBookings,
            completedBookings,
            totalRevenue,
          }
        }) || []

  setUsers(userStats)
    } catch (error) {
      console.error("Error refreshing users:", error)
    }
  }

  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }

      setSuccess("User created successfully!")
      setNewUser({ full_name: "", email: "", password: "", role: "employee" })
      setIsAddUserOpen(false)
      refreshUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedUser.role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      setSuccess("User updated successfully!")
      setIsEditUserOpen(false)
      setSelectedUser(null)
      refreshUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      console.log("Fetching details for user:", userId)
      
      // Fetch user bookings with trip details
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          seat_number,
          status,
          created_at,
          trip_id,
          trips (
            id,
            origin,
            destination,
            departure_time,
            arrival_time,
            price
          )
        `)
        .eq("created_by", userId)
        .order("created_at", { ascending: false })

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError)
      } else {
        console.log("Fetched bookings:", bookings)
      }

      // Fetch user seat reservations with trip details
      const { data: reservations, error: reservationsError } = await supabase
        .from("seat_reservations")
        .select(`
          id,
          seat_number,
          status,
          created_at,
          expires_at,
          trip_id,
          trips (
            id,
            origin,
            destination,
            departure_time,
            arrival_time
          )
        `)
        .eq("created_by", userId)
        .order("created_at", { ascending: false })

      if (reservationsError) {
        console.error("Error fetching reservations:", reservationsError)
      } else {
        console.log("Fetched reservations:", reservations)
      }

      setUserBookingDetails(bookings || [])
      setUserReservationDetails(reservations || [])
    } catch (error) {
      console.error("Error fetching user details:", error)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      setSuccess("User deleted successfully!")
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      refreshUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsLoading(false)
    }
  }

  
  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Users Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5" />
            Users Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(user => user.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(user => user.role === 'employee').length}
              </div>
              <div className="text-sm text-gray-600">Employees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {users.reduce((sum, user) => sum + (user.totalBookings || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">System Users</h3>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-black">Add New User</DialogTitle>
                <DialogDescription>Create a new employee account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Grid - Mobile First */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{user.full_name}</h4>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={user.role === "admin" ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {user.role}
                  </Badge>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{user.totalBookings || 0}</div>
                    <div className="text-xs text-gray-600">Bookings</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">
                      {(user.totalRevenue || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">ETB</div>
                  </div>
                </div>

                {/* User Details */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>{user.completedBookings || 0} completed</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={async () => {
                      setUserToView(user)
                      await fetchUserDetails(user.id)
                      setIsViewDetailsOpen(true)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-200 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      setSelectedUser(user)
                      setIsEditUserOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setUserToDelete(user)
                      setIsDeleteDialogOpen(true)
                    }}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Users Yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Add your first user to start managing system access and permissions.
              </p>
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setIsAddUserOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Edit User</DialogTitle>
            <DialogDescription>Update user role and permissions</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={selectedUser.full_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-black text-white hover:bg-gray-800">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update User"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog - Mobile Optimized */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="bg-white w-[95vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base text-black">User Details</DialogTitle>
            <DialogDescription className="text-xs">Complete user information</DialogDescription>
          </DialogHeader>
          {userToView && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Name</span>
                    <span className="font-medium text-sm text-black">{userToView.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Email</span>
                    <span className="font-medium text-sm text-black">{userToView.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Role</span>
                    <Badge variant={userToView.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {userToView.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Joined</span>
                    <span className="font-medium text-sm text-black">{new Date(userToView.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{userToView.totalBookings || 0}</div>
                    <div className="text-xs text-gray-600">Total Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{userToView.completedBookings || 0}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                </div>
                <div className="text-center mt-3 pt-3 border-t border-green-200">
                  <div className="text-xl font-bold text-green-600">{(userToView.totalRevenue || 0).toLocaleString()} ETB</div>
                  <div className="text-xs text-gray-600">Total Revenue</div>
                </div>
              </div>

              {/* Bookings Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">Recent Bookings ({userBookingDetails.length})</div>
                {userBookingDetails.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {userBookingDetails.slice(0, 3).map((booking: any) => (
                      <div key={booking.id} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-black">
                              {booking.trips?.origin} → {booking.trips?.destination}
                            </p>
                            <p className="text-xs text-gray-600">
                              Seat {booking.seat_number} • {new Date(booking.trips?.departure_time).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={booking.status === "booked" ? "default" : "secondary"} className="text-xs">
                              {booking.status}
                            </Badge>
                            <p className="text-xs font-bold text-green-600 mt-1">
                              {booking.trips?.price ? `${Number(booking.trips.price).toLocaleString()} ETB` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userBookingDetails.length > 3 && (
                      <div className="text-center text-xs text-gray-500">
                        +{userBookingDetails.length - 3} more bookings
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">No bookings found</p>
                )}
              </div>

              {/* Reservations Section */}
              {userReservationDetails.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">Active Reservations ({userReservationDetails.length})</div>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {userReservationDetails.slice(0, 2).map((reservation: any) => (
                      <div key={reservation.id} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-black">
                              {reservation.trips?.origin} → {reservation.trips?.destination}
                            </p>
                            <p className="text-xs text-gray-600">
                              Seat {reservation.seat_number}
                            </p>
                          </div>
                          <Badge variant={reservation.status === "reserved" ? "secondary" : "destructive"} className="text-xs">
                            {reservation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <Button onClick={() => setIsViewDetailsOpen(false)} className="w-full bg-black text-white hover:bg-gray-800">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Delete User</DialogTitle>
            <DialogDescription className="text-red-600">
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-black">
                  <strong>User:</strong> {userToDelete.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {userToDelete.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Role:</strong> {userToDelete.role}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setUserToDelete(null)
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteUser} 
                  disabled={isLoading} 
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete User"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
