"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

interface DailyBookingsChartProps {
  data: Array<{ date: string; bookings: number; revenue: number }>
  config: any
}

export function DailyBookingsChart({ data, config }: DailyBookingsChartProps) {
  return (
    <ChartContainer config={config}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="bookings"
          stroke="var(--color-bookings)"
          strokeWidth={2}
          dot={{ fill: "var(--color-bookings)" }}
        />
      </LineChart>
    </ChartContainer>
  )
}
