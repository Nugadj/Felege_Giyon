"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Server, Wifi } from "lucide-react"

export default function SystemHealthMonitor() {
  const healthMetrics = [
    {
      name: "Database",
      status: "healthy",
      icon: Database,
      responseTime: "12ms",
      uptime: "99.9%",
    },
    {
      name: "API Server",
      status: "healthy",
      icon: Server,
      responseTime: "45ms",
      uptime: "99.8%",
    },
    {
      name: "Network",
      status: "healthy",
      icon: Wifi,
      responseTime: "8ms",
      uptime: "100%",
    },
    {
      name: "Background Jobs",
      status: "healthy",
      icon: Activity,
      responseTime: "2s",
      uptime: "99.7%",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{metric.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.responseTime} • {metric.uptime}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(metric.status)}>{metric.status}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
