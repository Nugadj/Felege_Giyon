import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { SettingsFormClient } from "@/components/settings-form-client"
import { RefreshButton } from "@/components/refresh-button"

export default async function SystemSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch current settings
  let settings = {}
  try {
    const { data: settingsData } = await supabase.from("settings").select("*")
    settings = settingsData?.reduce(
      (acc, setting) => {
        acc[setting.key] = JSON.parse(setting.value)
        return acc
      },
      {} as Record<string, any>,
    ) || {}
  } catch (error) {
    console.log("Settings table not found, will use defaults")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Settings</h1>
                <p className="text-xs text-gray-500">System Configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6">
        <SettingsFormClient initialSettings={settings} userEmail={user.email || ""} />
      </main>
    </div>
  )
}