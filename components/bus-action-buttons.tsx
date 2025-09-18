"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Trash2, MoreVertical, Edit, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface BusActionButtonsProps {
  busId: string
  busName: string
}

export function BusActionButtons({ busId, busName }: BusActionButtonsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("buses").delete().eq("id", busId)

      if (error) throw error

      toast.success("Bus deleted successfully!")
      router.refresh()
    } catch (error) {
      console.error("Error deleting bus:", error)
      toast.error("Failed to delete bus. Please try again.")
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/admin/buses/${busId}`)}>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/admin/buses/${busId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Bus
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Bus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
