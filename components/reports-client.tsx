"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  CheckCircle,
  RefreshCw,
  FileText,
  CalendarDays
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ReportsClientProps {
  initialData: {
    totalRevenue: number
    monthlyRevenue: number
    totalBookings: number
    monthlyBookingsCount: number
    activeTripsCount: number
    completedTripsCount: number
    activeBuses: number
    totalBuses: number
    averageFleetUtilization: number
    averageRevenuePerBooking: number
    averageBookingsPerDay: number
    routeMetrics: any
    dailyBookingsChart: any[]
    weeklyRevenueChart: any[]
    busChartData: any[]
    topRoutes: any[]
    routeAnalytics: any[]
    topPerformingRoutes: any[]
  }
}

export function ReportsClient({ initialData }: ReportsClientProps) {
  const [dateFilter, setDateFilter] = useState("monthly")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [filteredData, setFilteredData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [showCustomDates, setShowCustomDates] = useState(false)

  const supabase = createClient()

  const filterOptions = [
    { value: "daily", label: "Daily (Last 7 days)" },
    { value: "weekly", label: "Weekly (Last 4 weeks)" },
    { value: "monthly", label: "Monthly (Last 30 days)" },
    { value: "quarterly", label: "Quarterly (Last 3 months)" },
    { value: "yearly", label: "Yearly (Last 12 months)" },
    { value: "custom", label: "Custom Date Range" }
  ]

  const fetchFilteredData = async (filter: string, startDate?: string, endDate?: string) => {
    setLoading(true)
    try {
      let dateRange = { start: new Date(), end: new Date() }
      
      switch (filter) {
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

      // Fetch filtered data from Supabase
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

      // Process the data similar to the server-side logic
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.trips?.price || 0), 0) || 0
      const totalBookings = bookings?.length || 0
      const activeTripsCount = trips?.filter(trip => ['scheduled', 'boarding', 'departed', 'active'].includes(trip.status)).length || 0
      const completedTripsCount = trips?.filter(trip => trip.status === 'completed').length || 0

      // Update filtered data
      setFilteredData({
        ...filteredData,
        totalRevenue,
        totalBookings,
        activeTripsCount,
        completedTripsCount,
      })

      toast.success(`Report filtered for ${filter} period`)
    } catch (error) {
      console.error("Error filtering data:", error)
      toast.error("Failed to filter data")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (value: string) => {
    setDateFilter(value)
    setShowCustomDates(value === "custom")
    
    if (value !== "custom") {
      fetchFilteredData(value)
    }
  }

  const handleCustomDateFilter = () => {
    if (customStartDate && customEndDate) {
      fetchFilteredData("custom", customStartDate, customEndDate)
    } else {
      toast.error("Please select both start and end dates")
    }
  }

  const generateReportData = () => {
    const reportDate = new Date().toLocaleDateString()
    const filterLabel = filterOptions.find(opt => opt.value === dateFilter)?.label || "Custom"
    
    return {
      title: `Business Analytics Report - ${filterLabel}`,
      generatedDate: reportDate,
      period: dateFilter === "custom" && customStartDate && customEndDate 
        ? `${customStartDate} to ${customEndDate}`
        : filterLabel,
      summary: {
        totalRevenue: filteredData.totalRevenue,
        totalBookings: filteredData.totalBookings,
        activeTrips: filteredData.activeTripsCount,
        completedTrips: filteredData.completedTripsCount,
        averageRevenuePerBooking: filteredData.averageRevenuePerBooking,
        fleetUtilization: filteredData.averageFleetUtilization
      },
      routes: filteredData.routeAnalytics,
      fleet: filteredData.busChartData,
      topRoutes: filteredData.topPerformingRoutes
    }
  }

  const downloadReport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      if (format === 'csv' || format === 'json') {
        // Use API endpoint for CSV and JSON
        const response = await fetch('/api/reports/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateFilter,
            startDate: customStartDate,
            endDate: customEndDate,
            format
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate report')
        }

        if (format === 'csv') {
          const csvContent = await response.text()
          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `analytics-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`
          link.click()
          URL.revokeObjectURL(url)
        } else if (format === 'json') {
          const jsonData = await response.json()
          const dataStr = JSON.stringify(jsonData, null, 2)
          const dataBlob = new Blob([dataStr], { type: 'application/json' })
          const url = URL.createObjectURL(dataBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `analytics-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.json`
          link.click()
          URL.revokeObjectURL(url)
        }
      } else if (format === 'pdf') {
        // Generate PDF using print functionality
        const reportData = generateReportData()
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${reportData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
              .header h1 { color: #007bff; margin: 0; }
              .summary { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .summary h2 { color: #007bff; margin-top: 0; }
              .metric { display: inline-block; margin: 10px 20px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .metric strong { color: #007bff; }
              .routes-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .routes-table th, .routes-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .routes-table th { background-color: #007bff; color: white; }
              .routes-table tr:nth-child(even) { background-color: #f8f9fa; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${reportData.title}</h1>
              <p><strong>Generated on:</strong> ${reportData.generatedDate}</p>
              <p><strong>Period:</strong> ${reportData.period}</p>
            </div>
            
            <div class="summary">
              <h2>Executive Summary</h2>
              <div class="metric"><strong>Total Revenue:</strong><br>${reportData.summary.totalRevenue.toLocaleString()} ETB</div>
              <div class="metric"><strong>Total Bookings:</strong><br>${reportData.summary.totalBookings}</div>
              <div class="metric"><strong>Active Trips:</strong><br>${reportData.summary.activeTrips}</div>
              <div class="metric"><strong>Completed Trips:</strong><br>${reportData.summary.completedTrips}</div>
              <div class="metric"><strong>Avg Revenue/Booking:</strong><br>${reportData.summary.averageRevenuePerBooking} ETB</div>
              <div class="metric"><strong>Fleet Utilization:</strong><br>${reportData.summary.fleetUtilization}%</div>
            </div>

            <h2 style="color: #007bff;">Top Performing Routes</h2>
            <table class="routes-table">
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>Origin → Destination</th>
                  <th>Total Trips</th>
                  <th>Total Bookings</th>
                  <th>Revenue (ETB)</th>
                  <th>Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topRoutes.map((route: any) => `
                  <tr>
                    <td><strong>${route.name}</strong></td>
                    <td>${route.origin} → ${route.destination}</td>
                    <td>${route.totalTrips}</td>
                    <td>${route.totalBookings}</td>
                    <td>${route.totalRevenue.toLocaleString()}</td>
                    <td>${route.occupancyRate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
              <p>This report was generated automatically by the Bus Management System</p>
              <p>© ${new Date().getFullYear()} - All rights reserved</p>
            </div>
          </body>
          </html>
        `

        // Create a new window and print
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(htmlContent)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 250)
        }
      }

      toast.success(`Report downloaded as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Error downloading report:", error)
      toast.error("Failed to download report")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
                <p className="text-xs text-gray-500">Business Intelligence Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 space-y-6">
        {/* Date Filter Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CalendarDays className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <Label htmlFor="dateFilter">Time Period</Label>
                <Select value={dateFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {showCustomDates && (
                <>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleCustomDateFilter} disabled={loading}>
                      {loading ? "Filtering..." : "Apply Filter"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Download Actions */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Download className="w-5 h-5" />
              Download Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <Button 
                onClick={() => downloadReport('pdf')} 
                className="h-16 flex-col bg-red-500 hover:bg-red-600 text-white"
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Download PDF</span>
              </Button>
              <Button 
                onClick={() => downloadReport('csv')} 
                className="h-16 flex-col bg-green-500 hover:bg-green-600 text-white"
              >
                <Download className="w-5 h-5 mb-1" />
                <span className="text-xs">Download CSV</span>
              </Button>
              <Button 
                onClick={() => downloadReport('json')} 
                className="h-16 flex-col bg-blue-500 hover:bg-blue-600 text-white"
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Download JSON</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hero Stats - Mobile First */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Total Revenue</p>
                  <p className="text-xl font-bold">{filteredData.totalRevenue.toLocaleString()}</p>
                  <p className="text-blue-100 text-xs">ETB</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Monthly</p>
                  <p className="text-xl font-bold">{filteredData.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-green-100 text-xs">ETB</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">Bookings</p>
                  <p className="text-xl font-bold">{filteredData.totalBookings}</p>
                  <p className="text-purple-100 text-xs">Total</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">This Month</p>
                  <p className="text-xl font-bold">{filteredData.monthlyBookingsCount}</p>
                  <p className="text-orange-100 text-xs">Bookings</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{filteredData.activeTripsCount}</p>
              <p className="text-xs text-gray-600">Active Trips</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{filteredData.completedTripsCount}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full mx-auto mb-2">
                <Bus className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{filteredData.activeBuses}/{filteredData.totalBuses}</p>
              <p className="text-xs text-gray-600">Active Buses</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{filteredData.averageFleetUtilization}%</p>
              <p className="text-xs text-gray-600">Fleet Usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <BarChart3 className="w-5 h-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{filteredData.averageRevenuePerBooking.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Avg Revenue/Booking</div>
                <div className="text-xs text-gray-500">ETB</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{filteredData.averageBookingsPerDay}</div>
                <div className="text-sm text-gray-600">Avg Bookings/Day</div>
                <div className="text-xs text-gray-500">Current period</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{filteredData.routeMetrics.averageOccupancy}%</div>
                <div className="text-sm text-gray-600">Avg Occupancy</div>
                <div className="text-xs text-gray-500">All routes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Bookings Trend - Static Display */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Activity className="w-5 h-5 text-blue-600" />
              Daily Bookings Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData.dailyBookingsChart.slice(-7).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{day.date}</div>
                      <div className="text-xs text-gray-600">{day.bookings} bookings</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 text-sm">{day.revenue.toLocaleString()} ETB</div>
                    <div className="text-xs text-gray-500">revenue</div>
                  </div>
                </div>
              ))}
              {filteredData.dailyBookingsChart.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">No booking data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Revenue Trend - Static Display */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Weekly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData.weeklyRevenueChart.slice(-4).map((week, index) => (
                <div key={week.week} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                      W{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">Week of {week.week}</div>
                      <div className="text-xs text-gray-600">{week.bookings} bookings</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 text-sm">{week.revenue.toLocaleString()} ETB</div>
                    <div className="text-xs text-gray-500">revenue</div>
                  </div>
                </div>
              ))}
              {filteredData.weeklyRevenueChart.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">No weekly data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Performance - Mobile Optimized */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Bus className="w-5 h-5" />
              Fleet Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {filteredData.busChartData.slice(0, 6).map((bus, index) => (
                <div key={bus.name} className="bg-white/70 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm text-gray-900">{bus.name}</div>
                    <Badge variant={bus.utilization >= 70 ? 'default' : bus.utilization >= 50 ? 'secondary' : 'outline'}>
                      {bus.utilization}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(bus.utilization, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{bus.trips} trips</span>
                    <span>{bus.bookings} bookings</span>
                  </div>
                </div>
              ))}
              {filteredData.busChartData.length === 0 && (
                <div className="col-span-2 text-center py-6 text-gray-500 text-sm">No fleet data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Popular Routes List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Route Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.topRoutes.map(([route, stats], index) => (
                  <div key={route} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{route}</div>
                        <div className="text-xs text-gray-600">{stats.trips} trips</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600 text-sm">{stats.bookings}</div>
                      <div className="text-xs text-gray-500">bookings</div>
                    </div>
                  </div>
                ))}
                {filteredData.topRoutes.length === 0 && <div className="text-center py-6 text-gray-500 text-sm">No route data</div>}
              </div>
            </CardContent>
          </Card>

          {/* Bus Utilization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fleet Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.busChartData?.map((bus) => {
                  return (
                    <div key={bus.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{bus.name}</span>
                        <span className="text-xs text-gray-600">{bus.utilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(bus.utilization, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{bus.trips} trips</span>
                        <span>{bus.bookings} bookings</span>
                      </div>
                    </div>
                  )
                })}
                {(!filteredData.busChartData || filteredData.busChartData.length === 0) && (
                  <div className="text-center py-6 text-gray-500 text-sm">No bus data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Route Statistics */}
        <div className="mt-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Route Analytics</h2>
          </div>

          {/* Route Overview Metrics */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Total Routes</CardTitle>
                <Route className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{filteredData.routeMetrics.totalRoutes}</div>
                <p className="text-xs text-muted-foreground">{filteredData.routeMetrics.activeRoutes} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Avg Occupancy</CardTitle>
                <Percent className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{filteredData.routeMetrics.averageOccupancy}%</div>
                <p className="text-xs text-muted-foreground">across all routes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Route Revenue</CardTitle>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{filteredData.routeMetrics.totalRouteRevenue.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">total generated</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Best Route</CardTitle>
                <Target className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{filteredData.routeMetrics.bestPerformingRoute?.occupancyRate || 0}%</div>
                <p className="text-xs text-muted-foreground">occupancy rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Routes */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Top Performing Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.topPerformingRoutes.slice(0, 5).map((route, index) => (
                    <div key={route.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{route.name}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {route.origin} → {route.destination}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600 text-sm">{route.totalRevenue.toLocaleString()} ETB</div>
                        <div className="text-xs text-gray-500">{route.occupancyRate}% occupancy</div>
                      </div>
                    </div>
                  ))}
                  {filteredData.topPerformingRoutes.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm">No route performance data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Route Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredData.routeMetrics.bestPerformingRoute && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Best Performer</Badge>
                    </div>
                    <div className="font-medium text-sm text-green-900">{filteredData.routeMetrics.bestPerformingRoute.name}</div>
                    <div className="text-xs text-green-700 mb-2">{filteredData.routeMetrics.bestPerformingRoute.origin} → {filteredData.routeMetrics.bestPerformingRoute.destination}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-green-600">Occupancy:</span>
                        <span className="font-medium ml-1">{filteredData.routeMetrics.bestPerformingRoute.occupancyRate}%</span>
                      </div>
                      <div>
                        <span className="text-green-600">Revenue:</span>
                        <span className="font-medium ml-1">{filteredData.routeMetrics.bestPerformingRoute.totalRevenue.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  </div>
                )}

                {filteredData.routeMetrics.worstPerformingRoute && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">Needs Attention</Badge>
                    </div>
                    <div className="font-medium text-sm text-orange-900">{filteredData.routeMetrics.worstPerformingRoute.name}</div>
                    <div className="text-xs text-orange-700 mb-2">{filteredData.routeMetrics.worstPerformingRoute.origin} → {filteredData.routeMetrics.worstPerformingRoute.destination}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-orange-600">Occupancy:</span>
                        <span className="font-medium ml-1">{filteredData.routeMetrics.worstPerformingRoute.occupancyRate}%</span>
                      </div>
                      <div>
                        <span className="text-orange-600">Revenue:</span>
                        <span className="font-medium ml-1">{filteredData.routeMetrics.worstPerformingRoute.totalRevenue.toLocaleString()} ETB</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">Quick Stats</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-600">Active Routes:</span>
                      <span className="font-medium ml-1">{filteredData.routeMetrics.activeRoutes}/{filteredData.routeMetrics.totalRoutes}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Avg Occupancy:</span>
                      <span className="font-medium ml-1">{filteredData.routeMetrics.averageOccupancy}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Route Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detailed Route Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="space-y-3">
                  {filteredData.routeAnalytics.map((route) => (
                    <div key={route.id} className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="lg:col-span-2">
                        <div className="font-medium text-sm">{route.name}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {route.origin} → {route.destination}
                        </div>
                        {route.distance_km && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {route.distance_km}km • {route.estimated_duration_hours}h
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">{route.totalTrips}</div>
                        <div className="text-xs text-gray-500">Total Trips</div>
                        <div className="text-xs text-blue-600">{route.monthlyTrips} this month</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">{route.totalBookings}</div>
                        <div className="text-xs text-gray-500">Total Bookings</div>
                        <div className="text-xs text-blue-600">{route.monthlyBookings} this month</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">{route.occupancyRate}%</div>
                        <div className="text-xs text-gray-500">Occupancy Rate</div>
                        <Badge 
                          variant={
                            route.performanceStatus === 'excellent' ? 'default' :
                            route.performanceStatus === 'good' ? 'secondary' :
                            route.performanceStatus === 'average' ? 'outline' : 'destructive'
                          }
                          className="text-xs mt-1"
                        >
                          {route.performanceStatus}
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">{route.totalRevenue.toLocaleString()} ETB</div>
                        <div className="text-xs text-gray-500">Total Revenue</div>
                        <div className="text-xs text-green-600">{route.monthlyRevenue.toLocaleString()} ETB/month</div>
                      </div>
                    </div>
                  ))}
                  {filteredData.routeAnalytics.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No route data available</h3>
                      <p className="text-gray-500">Add routes and schedule trips to see performance analytics.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Filtering report data...</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}