// Plaid configuration for bank connections
export const PLAID_CONFIG = {
  // Client ID (same for all environments)
  clientId: '690b80cb1a623c001feb6e2f',
  
  // Environment: 'sandbox', 'development', or 'production'
  environment: 'sandbox',
  
  // Products to use
  products: ['transactions', 'auth'],
  
  // Country codes
  countryCodes: ['US'],
  
  // Redirect URI (must match what's configured in Plaid dashboard)
  redirectUri: 'https://www.cofounderplus.com/operations/finance',
  
  // Webhook URL (for transaction updates)
  webhookUrl: 'https://mktlvijfqgzmnfudfqvn.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/webhook',
};

export const getPlaidEnvironment = () => PLAID_CONFIG.environment;
export const getPlaidClientId = () => PLAID_CONFIG.clientId;
export const getPlaidRedirectUri = () => PLAID_CONFIG.redirectUri;

// Note: Secret keys are stored in backend environment variables
// Sandbox: PLAID_SANDBOX_SECRET = 1a2a7c18898503eff801ea1d60b96f
// Production: PLAID_SECRET (to be set later)
