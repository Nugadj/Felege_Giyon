"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function RefreshButton() {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="w-4 h-4" />
    </Button>
  )
}