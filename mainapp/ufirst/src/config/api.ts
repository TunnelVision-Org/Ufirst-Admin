/**
 * API Configuration
 * Switch between development and production Gadget.app endpoints
 */

const API_ENDPOINTS = {
  development: 'https://tunnel-vision-fitness--development.gadget.app/api/graphql',
  production: 'https://tunnel-vision-fitness.gadget.app/api/graphql'
};

// Change this to switch between environments
export const CURRENT_ENV: 'development' | 'production' = 'development';

export const GADGET_API_URL = API_ENDPOINTS[CURRENT_ENV];

// Get API key from environment variables
export const GADGET_API_KEY = process.env.GADGET_API_KEY;

// Admin user email from environment variables
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

/**
 * Helper function to check if a user is admin
 */
export function isAdmin(email: string): boolean {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL environment variable is not set');
    return false;
  }
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
