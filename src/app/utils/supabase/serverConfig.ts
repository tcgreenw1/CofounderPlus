/**
 * Server Configuration Utility
 * Provides centralized server endpoint management for development/production switching
 */

import { projectId, publicAnonKey } from './info';

// Server mode type
export type ServerMode = 'production' | 'development';

// Server endpoints configuration
const SERVER_ENDPOINTS = {
  production: 'make-server-373d8b09',
  development: 'make-server-development',
  legacy: 'make-server-ac1075a9' // Deprecated - do not use
} as const;

/**
 * Get current server mode from environment or localStorage
 * Priority: Environment variable > localStorage > default to production
 */
export function getServerMode(): ServerMode {
  // Check environment variable first (for build-time configuration)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_MODE) {
    return import.meta.env.VITE_SERVER_MODE as ServerMode;
  }
  
  // Check localStorage for runtime switching (developer override)
  if (typeof window !== 'undefined') {
    const storedMode = localStorage.getItem('COFOUNDER_SERVER_MODE');
    if (storedMode === 'development' || storedMode === 'production') {
      return storedMode as ServerMode;
    }
  }
  
  // Default to production for safety
  return 'production';
}

/**
 * Set server mode (persists to localStorage)
 * Use this to switch between development and production at runtime
 */
export function setServerMode(mode: ServerMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('COFOUNDER_SERVER_MODE', mode);
    console.log(`🔧 Server mode set to: ${mode}`);
    console.log(`🔗 Using endpoint: ${getServerEndpoint()}`);
  }
}

/**
 * Get base server URL for current mode
 * Returns: https://{projectId}.supabase.co/functions/v1/{server-name}
 */
export function getServerEndpoint(): string {
  const mode = getServerMode();
  const serverName = SERVER_ENDPOINTS[mode];
  return `https://${projectId}.supabase.co/functions/v1/${serverName}`;
}

/**
 * Get full API endpoint URL for a specific route
 * Example: getApiEndpoint('/gpt-5-1/chat') -> https://.../make-server-373d8b09/gpt-5-1/chat
 */
export function getApiEndpoint(route: string): string {
  const baseUrl = getServerEndpoint();
  // Remove leading slash if present to avoid double slashes
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  return `${baseUrl}/${cleanRoute}`;
}

/**
 * Standard headers for API requests
 * Includes authorization token
 */
export function getApiHeaders(accessToken: string): HeadersInit {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Make authenticated API request to server
 * Automatically uses correct server endpoint based on current mode
 */
export async function makeApiRequest<T = any>(
  route: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    accessToken: string;
    headers?: HeadersInit;
  }
): Promise<T> {
  const { method = 'POST', body, accessToken, headers = {} } = options;
  
  const url = getApiEndpoint(route);
  const requestHeaders = {
    ...getApiHeaders(accessToken),
    ...headers
  };
  
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders
  };
  
  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Check server health
 * Returns health status from current server endpoint
 */
export async function checkServerHealth(): Promise<{
  status: string;
  timestamp: string;
  service: string;
  environment: string;
  server: string;
}> {
  const url = getApiEndpoint('health');
  const response = await fetch(url);
  return await response.json();
}

/**
 * Developer utility: Display current server configuration in console
 */
export function logServerConfig(): void {
  const mode = getServerMode();
  const endpoint = getServerEndpoint();
  
  console.group('🔧 Cofounder+ Server Configuration');
  console.log(`Mode: ${mode}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Server: ${SERVER_ENDPOINTS[mode]}`);
  console.groupEnd();
  
  // Check health
  checkServerHealth()
    .then(health => {
      console.log('✅ Server Health:', health);
    })
    .catch(error => {
      console.error('❌ Server Health Check Failed:', error);
    });
}

/**
 * Developer utility: Switch to development mode
 * Call this from browser console: switchToDevelopment()
 */
export function switchToDevelopment(): void {
  setServerMode('development');
  logServerConfig();
}

/**
 * Developer utility: Switch to production mode
 * Call this from browser console: switchToProduction()
 */
export function switchToProduction(): void {
  setServerMode('production');
  logServerConfig();
}

// Expose utilities to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).serverConfig = {
    getMode: getServerMode,
    setMode: setServerMode,
    getEndpoint: getServerEndpoint,
    checkHealth: checkServerHealth,
    switchToDevelopment,
    switchToProduction,
    logConfig: logServerConfig
  };
  
  // Log configuration on load in development
  if (getServerMode() === 'development') {
    console.log('🔧 Development mode active - use window.serverConfig for utilities');
  }
}

// Default export for convenience
export default {
  getServerMode,
  setServerMode,
  getServerEndpoint,
  getApiEndpoint,
  getApiHeaders,
  makeApiRequest,
  checkServerHealth,
  logServerConfig,
  switchToDevelopment,
  switchToProduction
};
