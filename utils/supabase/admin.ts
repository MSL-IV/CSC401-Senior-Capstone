import { createClient } from '@supabase/supabase-js'

// Create regular client for profile operations
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Types for our database
export type Profile = {
  id: string
  first_name: string
  last_name: string
  student_id: string
  role: 'student' | 'faculty' | 'admin'
  status: 'active' | 'pending' | 'suspended'
  created_at: string
  updated_at: string
}

// We'll fetch users differently since we can't use admin.listUsers() without service key
export async function fetchAllUsers() {
  const supabase = createAdminClient()
  
  // Get all profiles with their basic info
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }
  
  return profiles
}