export type UserRole = "student" | "faculty" | "admin";

// Simple helper functions for UI display logic
export function isAdminUser(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}

export function isFacultyOrAdmin(role: UserRole | null | undefined): boolean {
  return role === 'faculty' || role === 'admin';
}

// Only admins can change roles/status
export function canModifyUserRoles(role: UserRole | null | undefined): boolean {
  return role === 'admin'; 
}