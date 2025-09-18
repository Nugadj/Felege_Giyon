import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update settings one by one
    const results = []
    for (const [key, value] of Object.entries(settings)) {
      const { data, error } = await supabase
        .from("settings")
        .upsert(
          {
            key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "key",
          },
        )
        .select()

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        return NextResponse.json({ error: `Failed to update ${key}: ${error.message}` }, { status: 400 })
      }
      results.push(data)
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: settings, error } = await supabase.from("settings").select("*")

    if (error) {
      console.error("Database error fetching settings:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Convert to key-value object
    const settingsObject = settings?.reduce(
      (acc, setting) => {
        acc[setting.key] = JSON.parse(setting.value)
        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json({ settings: settingsObject })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
