import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()

    // verify current user and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client for service role operations
    const adminClient = createAdminClient()

    const { data: users, error } = await adminClient.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Service query error fetching profiles:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch profiles' }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (err: any) {
    console.error('Error in all-profiles route:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
