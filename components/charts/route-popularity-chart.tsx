"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface RoutePopularityChartProps {
  data: Array<{ route: string; bookings: number; trips: number }>
  config: any
}

export function RoutePopularityChart({ data, config }: RoutePopularityChartProps) {
  return (
    <ChartContainer config={config}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="route" type="category" width={120} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
