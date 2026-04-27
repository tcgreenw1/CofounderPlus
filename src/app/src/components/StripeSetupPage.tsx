import { StripeProductionSetup } from './StripeProductionSetup';

export function StripeSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-foreground">Stripe Production Setup</h1>
          <p className="text-muted-foreground mt-2">
            Configure your production Stripe products and pricing
          </p>
        </div>
        
        <StripeProductionSetup />
      </div>
    </div>
  );
}
