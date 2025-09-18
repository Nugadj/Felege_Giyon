"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface BusDeleteButtonProps {
  busId: string
  busName: string
}

export function BusDeleteButton({ busId, busName }: BusDeleteButtonProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/buses/${busId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete bus")
      }

      toast.success("Bus deleted successfully!")
      router.refresh()
    } catch (error) {
      console.error("Error deleting bus:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete bus. Please try again.")
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700 bg-transparent"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{busName}"? This action cannot be undone and will remove all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete Bus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
