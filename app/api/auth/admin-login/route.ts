import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Admin login API called")

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.log("[v0] Failed to parse request body:", parseError)
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    const { email, password } = body
    console.log("[v0] Received email:", email)

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    if (email !== "felegegiyon@outlook.com") {
      console.log("[v0] Non-admin email attempted login:", email)
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("[v0] Auth result:", { authData: !!authData.user, error: authError })

    if (authError || !authData.user) {
      console.log("[v0] Authentication failed:", authError)
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      console.log("[v0] User is not admin:", { profileError, role: profile?.role })
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    console.log("[v0] Admin login successful")

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: "admin",
      },
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
