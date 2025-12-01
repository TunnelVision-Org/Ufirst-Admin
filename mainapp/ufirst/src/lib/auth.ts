/**
 * Authentication and User Management Utilities
 */

// Read admin email from environment variable (NEXT_PUBLIC_ prefix exposes it to client)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@ufirst.com';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Get current logged-in user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get user's full name
 */
export function getUserFullName(user: User | null): string {
  if (!user) return 'User';
  return `${user.firstName} ${user.lastName}`.trim() || 'User';
}

/**
 * Clear user session
 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}
