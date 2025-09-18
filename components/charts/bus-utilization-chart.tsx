"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"

interface BusUtilizationChartProps {
  data: Array<{ name: string; utilization: number; trips: number; bookings: number }>
  config: any
  pieColors: string[]
}

export function BusUtilizationChart({ data, config, pieColors }: BusUtilizationChartProps) {
  return (
    <ChartContainer config={config}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, utilization }) => `${name}: ${utilization}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="utilization"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  )
}
