import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/auth'
  loginUrl.searchParams.set('suspended', '1')

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh auth token if a session cookie exists; ignore missing-refresh-token errors.
  let currentUser = null
  try {
    const { data } = await supabase.auth.getUser()
    currentUser = data?.user ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (!message.toLowerCase().includes('refresh token')) {
      throw err
    }
    // No valid session cookie present; proceed without failing the request.
  }

  // Update last_active for signed-in users
  if (currentUser) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', currentUser.id)
      .single()

    if (profileError) {
      console.error('Failed to load profile status:', profileError.message)
    } else if (profile?.status === 'suspended') {
      await supabase.auth.signOut()

      if (request.nextUrl.pathname !== '/auth') {
        return NextResponse.redirect(loginUrl)
      }

      return supabaseResponse
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', currentUser.id)

    if (updateError) {
      console.error('Failed to update last_active:', updateError.message)
    }
  }

  return supabaseResponse
}
