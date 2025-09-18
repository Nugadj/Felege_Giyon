"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Download, Loader2 } from "lucide-react"

interface PrintButtonProps {
  type: "ticket" | "passenger-list"
  id: string
  label?: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export default function PrintButton({ type, id, label, variant = "default", size = "default" }: PrintButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePrint = async () => {
    setIsLoading(true)
    try {
      const endpoint = type === "ticket" ? `/api/bookings/${id}/ticket` : `/api/trips/${id}/passenger-list`

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link to download the PDF
      const link = document.createElement("a")
      link.href = url
      link.download = `${type}-${id.slice(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error printing:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePrint} disabled={isLoading} variant={variant} size={size}>
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <>
          <Printer className="w-4 h-4 mr-2" />
          <Download className="w-4 h-4 mr-2" />
        </>
      )}
      {isLoading ? "Generating..." : label || (type === "ticket" ? "Print Ticket" : "Print Passenger List")}
    </Button>
  )
}
