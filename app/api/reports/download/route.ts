import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { dateFilter, startDate, endDate, format } = await request.json()
    const supabase = await createClient()

    // Determine date range
    let dateRange = { start: new Date(), end: new Date() }
    
    switch (dateFilter) {
      case "daily":
        dateRange.start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case "weekly":
        dateRange.start = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        dateRange.start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      case "quarterly":
        dateRange.start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        break
      case "yearly":
        dateRange.start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        break
      case "custom":
        if (startDate && endDate) {
          dateRange.start = new Date(startDate)
          dateRange.end = new Date(endDate)
        }
        break
    }

    // Fetch filtered data
    const [
      { data: bookings },
      { data: trips },
      { data: routes },
      { data: buses }
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("created_at, trips(price, route_id)")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString()),
      supabase
        .from("trips")
        .select(`
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
        `)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString()),
      supabase.from("routes").select("*"),
      supabase.from("buses").select("name, trips(id, bookings(id))")
    ])

    // Process data
    const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.trips?.price || 0), 0) || 0
    const totalBookings = bookings?.length || 0
    const activeTripsCount = trips?.filter(trip => ['scheduled', 'boarding', 'departed', 'active'].includes(trip.status)).length || 0
    const completedTripsCount = trips?.filter(trip => trip.status === 'completed').length || 0

    // Generate route analytics
    const routeAnalytics = routes?.map((route) => {
      const routeTrips = trips?.filter(trip => trip.routes?.id === route.id) || []
      const totalTrips = routeTrips.length
      const totalBookings = routeTrips.reduce((sum, trip) => sum + (trip.bookings?.length || 0), 0)
      const totalRevenue = routeTrips.reduce((sum, trip) => sum + (trip.price * (trip.bookings?.length || 0)), 0)
      const occupancyRate = totalTrips > 0 ? Math.round((totalBookings / (totalTrips * 51)) * 100) : 0

      return {
        ...route,
        totalTrips,
        totalBookings,
        totalRevenue,
        occupancyRate
      }
    }) || []

    const reportData = {
      title: `Business Analytics Report - ${dateFilter}`,
      generatedDate: new Date().toLocaleDateString(),
      period: dateFilter === "custom" && startDate && endDate 
        ? `${startDate} to ${endDate}`
        : dateFilter,
      summary: {
        totalRevenue,
        totalBookings,
        activeTrips: activeTripsCount,
        completedTrips: completedTripsCount,
        averageRevenuePerBooking: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0
      },
      routes: routeAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue),
      fleet: buses?.map(bus => ({
        name: bus.name,
        trips: bus.trips?.length || 0,
        bookings: bus.trips?.reduce((sum, trip) => sum + (trip.bookings?.length || 0), 0) || 0
      })) || []
    }

    if (format === 'json') {
      return NextResponse.json(reportData)
    } else if (format === 'csv') {
      let csvContent = `Business Analytics Report - ${reportData.period}\n`
      csvContent += `Generated: ${reportData.generatedDate}\n\n`
      csvContent += `SUMMARY\n`
      csvContent += `Total Revenue,${reportData.summary.totalRevenue} ETB\n`
      csvContent += `Total Bookings,${reportData.summary.totalBookings}\n`
      csvContent += `Active Trips,${reportData.summary.activeTrips}\n`
      csvContent += `Completed Trips,${reportData.summary.completedTrips}\n`
      csvContent += `Average Revenue per Booking,${reportData.summary.averageRevenuePerBooking} ETB\n\n`
      
      csvContent += `ROUTES\n`
      csvContent += `Route Name,Origin,Destination,Total Trips,Total Bookings,Revenue,Occupancy Rate\n`
      reportData.routes.forEach((route: any) => {
        csvContent += `${route.name},${route.origin},${route.destination},${route.totalTrips},${route.totalBookings},${route.totalRevenue},${route.occupancyRate}%\n`
      })

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}