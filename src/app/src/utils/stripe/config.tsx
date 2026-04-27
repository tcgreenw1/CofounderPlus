// Stripe configuration
// IMPORTANT: The publishable key here must match the secret key set in STRIPE_SECRET_KEY env variable
export const STRIPE_CONFIG = {
  // Hardcoded publishable key that matches the STRIPE_SECRET_KEY environment variable
  // This is the LIVE key for account acct_1RvhDFGOnlWNZwGe
  publishableKey: 'pk_live_51RvhDFGOnlWNZwGeFXgSdEHbsQFqoqwBRMaRi1JpsQTHq05WRf6cfO4qZTRlNIF9vxevETa7tivorSW69rfkcnM800C4bIixsh',
  
  // Test card numbers for testing
  testCards: {
    visa: '4242424242424242',
    visaDebit: '4000056655665556',
    mastercard: '5555555555554444',
    amex: '378282246310005',
    declined: '4000000000000002',
    insufficientFunds: '4000000000009995',
    requiresAuthentication: '4000002500003155'
  }
};

export const getStripePublishableKey = () => STRIPE_CONFIG.publishableKey;

// NOTE: Secret key is ONLY used on the backend via STRIPE_SECRET_KEY env variable
// The env variable MUST be set to: REMOVED51RvhDFGOnlWNZwGeFEgAneD3Y2U6LKL1UNlVpMxCP49xnjdIvPrkhEBi3rf2MPFq1SFKMvoEbYV6UtoQZNBdrKz100bi9hcShb
// to match the publishable key above