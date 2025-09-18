"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PassengerCancelButton({ bookingId, tripId }: { bookingId: string; tripId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to cancel booking')
      toast({ title: "Success", description: "Booking cancelled.", variant: "default" })
      setOpen(false)
      try { router.refresh() } catch { window.location.reload() }
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err?.message || "Could not cancel booking.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)} className="w-full">Cancel Booking</Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the booking and free the seat. This action cannot be undone. Are you sure you want to
              proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? 'Cancelling...' : 'Yes, cancel booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
