export type UserRole = "student" | "faculty" | "admin" | "kiosk";

// Simple helper functions for UI display logic
export function isAdminUser(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

export function isFacultyOrAdmin(role: UserRole | null | undefined): boolean {
  return role === 'faculty' || role === 'admin';
}

export function isKioskUser(role: UserRole | null | undefined): boolean {
  return role === 'kiosk';
}

/** Kiosk accounts can access the kiosk page; admins and faculty can too */
export function canAccessKiosk(role: UserRole | null | undefined): boolean {
  return role === 'kiosk' || role === 'admin' || role === 'faculty';
}

// Only admins can change roles/status
export function canModifyUserRoles(role: UserRole | null | undefined): boolean {
  return role === 'admin'; 
}