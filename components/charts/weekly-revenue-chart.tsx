"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface WeeklyRevenueChartProps {
  data: Array<{ week: string; revenue: number; bookings: number }>
  config: any
}

export function WeeklyRevenueChart({ data, config }: WeeklyRevenueChartProps) {
  return (
    <ChartContainer config={config}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
