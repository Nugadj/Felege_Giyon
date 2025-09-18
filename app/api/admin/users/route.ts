import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // First verify the requesting user is an admin
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "User not allowed" }, { status: 403 })
    }

    const { email, full_name, role, password } = await request.json()

    if (!email || !full_name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use admin client for user creation
    const adminClient = createAdminClient()

    // Create user in Supabase Auth with email confirmation bypassed
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation for admin-created users
      user_metadata: {
        full_name,
        role: role || "employee",
      },
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log("User created successfully:", authData.user?.id)

    // Wait a moment for the trigger to create the profile, then update it
    if (authData.user) {
      // Small delay to ensure trigger has executed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Update the profile record (created by trigger) with correct role
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          full_name,
          role: role || "employee",
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error("Error updating profile:", updateError)
        // If update fails, the profile might not exist yet, so try to create it
        const { error: insertError } = await adminClient
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name,
            email,
            role: role || "employee",
          })

        if (insertError) {
          if (insertError.code === '23505') {
            console.log("Profile already exists, this is expected")
          } else {
            console.error("Error creating profile fallback:", insertError)
          }
        } else {
          console.log("Profile created successfully as fallback")
        }
      } else {
        console.log("Profile updated successfully")
      }
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
