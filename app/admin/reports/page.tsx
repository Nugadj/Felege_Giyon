import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  Route, 
  MapPin, 
  Clock, 
  Percent, 
  BarChart3, 
  Target,
  Bus,
  Activity,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  FileText,
  Printer
} from "lucide-react"
import Link from "next/link"
import { ReportsClient } from "@/components/reports-client"

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  const [
    { data: monthlyBookings },
    { data: revenueData },
    { data: popularRoutes },
    { data: busUtilization },
    { data: dailyBookings },
    { data: weeklyRevenue },
    { data: routesData },
    { data: tripsWithRoutes },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("created_at, trips(price)")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("bookings").select("trips(price)").eq("status", "booked"),
    supabase.from("trips").select("origin, destination, bookings(id)").order("created_at", { ascending: false }),
    supabase.from("buses").select("name, trips(id, bookings(id))"),
    supabase
      .from("bookings")
      .select("created_at, trips(price)")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("created_at, trips(price)")
      .gte("created_at", new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "booked")
      .order("created_at", { ascending: true }),
    supabase.from("routes").select("*"),
    supabase.from("trips").select(`
      *,
      routes (
        id,
        name,
        origin,
        destination,
        distance_km,
        estimated_duration_hours
      ),
      bookings (
        id,
        status,
        created_at
      )
    `),
  ])

  // Calculate metrics
  const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.trips?.price || 0), 0) || 0
  const monthlyRevenue = monthlyBookings?.reduce((sum, booking) => sum + (booking.trips?.price || 0), 0) || 0
  const totalBookings = revenueData?.length || 0
  const monthlyBookingsCount = monthlyBookings?.length || 0

  // Calculate route popularity
  const routeStats = popularRoutes?.reduce(
    (acc, trip) => {
      const route = `${trip.origin} → ${trip.destination}`
      if (!acc[route]) {
        acc[route] = { bookings: 0, trips: 0 }
      }
      acc[route].trips += 1
      acc[route].bookings += trip.bookings?.length || 0
      return acc
    },
    {} as Record<string, { bookings: number; trips: number }>,
  )

  const topRoutes = Object.entries(routeStats || {})
    .sort(([, a], [, b]) => b.bookings - a.bookings)
    .slice(0, 5)

  // Daily bookings chart data
  const dailyBookingsChart =
    dailyBookings?.reduce(
      (acc, booking) => {
        const date = new Date(booking.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        const existing = acc.find((item) => item.date === date)
        if (existing) {
          existing.bookings += 1
          existing.revenue += booking.trips?.price || 0
        } else {
          acc.push({
            date,
            bookings: 1,
            revenue: booking.trips?.price || 0,
          })
        }
        return acc
      },
      [] as Array<{ date: string; bookings: number; revenue: number }>,
    ) || []

  // Weekly revenue chart data
  const weeklyRevenueChart =
    weeklyRevenue?.reduce(
      (acc, booking) => {
        const weekStart = new Date(booking.created_at)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })

        const existing = acc.find((item) => item.week === weekLabel)
        if (existing) {
          existing.revenue += booking.trips?.price || 0
          existing.bookings += 1
        } else {
          acc.push({
            week: weekLabel,
            revenue: booking.trips?.price || 0,
            bookings: 1,
          })
        }
        return acc
      },
      [] as Array<{ week: string; revenue: number; bookings: number }>,
    ) || []

  // Route popularity chart data
  const routeChartData = topRoutes.map(([route, stats]) => ({
    route: route.replace(" → ", "-"),
    bookings: stats.bookings,
    trips: stats.trips,
  }))

  // Bus utilization chart data
  const busChartData =
    busUtilization?.map((bus) => {
      const totalTrips = bus.trips?.length || 0
      const totalBookings = bus.trips?.reduce((sum, trip) => sum + (trip.bookings?.length || 0), 0) || 0
      const utilizationRate = totalTrips > 0 ? Math.round((totalBookings / (totalTrips * 51)) * 100) : 0

      return {
        name: bus.name,
        utilization: utilizationRate,
        trips: totalTrips,
        bookings: totalBookings,
      }
    }) || []

  // Comprehensive Route Statistics
  const routeAnalytics = routesData?.map((route) => {
    const routeTrips = tripsWithRoutes?.filter(trip => trip.routes?.id === route.id) || []
    const totalTrips = routeTrips.length
    const totalBookings = routeTrips.reduce((sum, trip) => sum + (trip.bookings?.length || 0), 0)
    const totalRevenue = routeTrips.reduce((sum, trip) => sum + (trip.price * (trip.bookings?.length || 0)), 0)
    const averageBookingsPerTrip = totalTrips > 0 ? Math.round(totalBookings / totalTrips) : 0
    const occupancyRate = totalTrips > 0 ? Math.round((totalBookings / (totalTrips * 51)) * 100) : 0
    const averageRevenuePerTrip = totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0
    
    // Calculate monthly performance
    const monthlyTrips = routeTrips.filter(trip => 
      new Date(trip.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    const monthlyBookings = monthlyTrips.reduce((sum, trip) => sum + (trip.bookings?.length || 0), 0)
    const monthlyRevenue = monthlyTrips.reduce((sum, trip) => sum + (trip.price * (trip.bookings?.length || 0)), 0)

    // Performance status
    let performanceStatus = 'average'
    if (occupancyRate >= 80) performanceStatus = 'excellent'
    else if (occupancyRate >= 60) performanceStatus = 'good'
    else if (occupancyRate >= 40) performanceStatus = 'average'
    else performanceStatus = 'poor'

    return {
      ...route,
      totalTrips,
      totalBookings,
      totalRevenue,
      averageBookingsPerTrip,
      occupancyRate,
      averageRevenuePerTrip,
      monthlyTrips: monthlyTrips.length,
      monthlyBookings,
      monthlyRevenue,
      performanceStatus
    }
  }) || []

  // Sort routes by performance metrics
  const topPerformingRoutes = [...routeAnalytics]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)

  const routeMetrics = {
    totalRoutes: routesData?.length || 0,
    activeRoutes: routeAnalytics.filter(route => route.totalTrips > 0).length,
    averageOccupancy: routeAnalytics.length > 0 
      ? Math.round(routeAnalytics.reduce((sum, route) => sum + route.occupancyRate, 0) / routeAnalytics.length)
      : 0,
    totalRouteRevenue: routeAnalytics.reduce((sum, route) => sum + route.totalRevenue, 0),
    bestPerformingRoute: topPerformingRoutes[0] || null,
    worstPerformingRoute: [...routeAnalytics]
      .filter(route => route.totalTrips > 0)
      .sort((a, b) => a.occupancyRate - b.occupancyRate)[0] || null
  }

  // Chart configurations
  const chartConfig = {
    bookings: {
      label: "Bookings",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Revenue (ETB)",
      color: "hsl(var(--chart-2))",
    },
    trips: {
      label: "Trips",
      color: "hsl(var(--chart-3))",
    },
    utilization: {
      label: "Utilization %",
      color: "hsl(var(--chart-4))",
    },
  }

  const pieColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  // Additional calculations for enhanced analytics
  const weeklyBookingsCount = dailyBookingsChart.reduce((sum, day) => sum + day.bookings, 0)
  const averageBookingsPerDay = weeklyBookingsCount > 0 ? Math.round(weeklyBookingsCount / 7) : 0
  const totalTripsCount = tripsWithRoutes?.length || 0
  const activeTripsCount = tripsWithRoutes?.filter(trip => ['scheduled', 'boarding', 'departed', 'active'].includes(trip.status)).length || 0
  const completedTripsCount = tripsWithRoutes?.filter(trip => trip.status === 'completed').length || 0
  const cancelledTripsCount = tripsWithRoutes?.filter(trip => trip.status === 'cancelled').length || 0
  
  // Fleet analytics
  const totalBuses = busUtilization?.length || 0
  const activeBuses = busUtilization?.filter(bus => (bus.trips?.length || 0) > 0).length || 0
  const averageFleetUtilization = busChartData.length > 0 
    ? Math.round(busChartData.reduce((sum, bus) => sum + bus.utilization, 0) / busChartData.length)
    : 0

  // Revenue insights
  const averageRevenuePerBooking = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0
  const monthlyGrowth = monthlyRevenue > 0 && totalRevenue > monthlyRevenue 
    ? Math.round(((monthlyRevenue / (totalRevenue - monthlyRevenue)) * 100))
    : 0

  // Prepare initial data for client component
  const initialData = {
    totalRevenue,
    monthlyRevenue,
    totalBookings,
    monthlyBookingsCount,
    activeTripsCount,
    completedTripsCount,
    activeBuses,
    totalBuses,
    averageFleetUtilization,
    averageRevenuePerBooking,
    averageBookingsPerDay,
    routeMetrics,
    dailyBookingsChart,
    weeklyRevenueChart,
    busChartData,
    topRoutes,
    routeAnalytics,
    topPerformingRoutes
  }

  return <ReportsClient initialData={initialData} />
}
