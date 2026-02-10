import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/utils/permissions';

/**
 * Server-side permission validation functions
 * Use these in API routes for additional security
 */

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return (profile?.role as UserRole) || null;
}

export async function requireAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}

export async function requireFacultyOrAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'faculty' || role === 'admin';
}

export async function canModifyUserRoles(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}

/**
 * Middleware function to check permissions in API routes
 */
export async function withPermissionCheck(
  requiredPermission: 'admin' | 'faculty' | 'authenticated'
): Promise<{ authorized: boolean; role: UserRole | null }> {
  const role = await getCurrentUserRole();
  
  if (!role) {
    return { authorized: false, role: null };
  }
  
  switch (requiredPermission) {
    case 'admin':
      return { authorized: role === 'admin', role };
    case 'faculty': 
      return { authorized: role === 'faculty' || role === 'admin', role };
    case 'authenticated':
      return { authorized: true, role };
    default:
      return { authorized: false, role };
  }
}

/**
 * Example usage in API route:
 * 
 * // pages/api/admin/update-user-role.ts
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const { authorized } = await withPermissionCheck('admin');
 *   
 *   if (!authorized) {
 *     return res.status(403).json({ error: 'Admin access required' });
 *   }
 *   
 *   // Proceed with role update logic...
 * }
 * 
 * // pages/api/faculty/override-certificates.ts  
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const { authorized } = await withPermissionCheck('faculty');
 *   
 *   if (!authorized) {
 *     return res.status(403).json({ error: 'Faculty access required' });
 *   }
 *   
 *   // Proceed with certificate override logic...
 * }
 */