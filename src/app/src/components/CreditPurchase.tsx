/**
 * Credit Purchase Component
 * Allows users to purchase additional AI credits
 * Supports web (Stripe) and iOS (In-App Purchase)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreditPurchaseProps {
  isIOSApp?: boolean;
}

const CREDIT_PACK_SIZE = 10000;
const CREDIT_PACK_PRICE = 20;

export function CreditPurchase({ isIOSApp = false }: CreditPurchaseProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const totalCredits = quantity * CREDIT_PACK_SIZE;
  const totalPrice = quantity * CREDIT_PACK_PRICE;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);

    try {
      if (isIOSApp) {
        // iOS In-App Purchase
        // This will trigger the iOS IAP flow through Capacitor
        const productId = `credit_pack_${CREDIT_PACK_SIZE}`;
        
        toast.info('Opening App Store purchase...', {
          description: 'Complete the purchase in the App Store dialog'
        });

        // TODO: Implement iOS IAP call through Capacitor
        // This is a placeholder - you'll implement the actual IAP logic
        console.log('iOS IAP: Purchasing', quantity, 'packs of', CREDIT_PACK_SIZE, 'credits');
        
        // Simulate IAP flow
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // After successful purchase, the backend will be notified via Apple's server
        toast.success('Purchase initiated!', {
          description: 'Credits will be added to your account once the purchase completes.'
        });
      } else {
        // Web Stripe Purchase
        toast.info('Opening payment page...', {
          description: 'You will be redirected to Stripe Checkout'
        });

        // TODO: Implement Stripe Checkout for credit purchase
        // This is a placeholder - you'll implement the actual Stripe logic
        console.log('Stripe: Purchasing', quantity, 'packs of', CREDIT_PACK_SIZE, 'credits');
        
        // Simulate Stripe flow
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast.success('Redirecting to checkout...', {
          description: 'Complete your purchase securely with Stripe'
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed', {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card 
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <CardTitle 
          className="flex items-center"
          style={{ 
            gap: 'var(--spacing-2)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShoppingCart 
              style={{ 
                width: '18px', 
                height: '18px',
                color: 'var(--primary)' 
              }} 
            />
          </div>
          Purchase Additional Credits
        </CardTitle>
        <CardDescription style={{ fontSize: '14px', fontWeight: 'var(--font-weight-normal)' }}>
          Buy credits as needed for AI actions beyond your monthly plan
        </CardDescription>
      </CardHeader>

      <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
        {/* Credit Pack Info */}
        <div 
          className="mb-4 p-4"
          style={{
            background: 'var(--muted)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Sparkles 
                style={{ 
                  width: '20px', 
                  height: '20px',
                  color: 'var(--primary)' 
                }} 
              />
              <span 
                style={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: '16px',
                  color: 'var(--foreground)'
                }}
              >
                Credit Pack
              </span>
            </div>
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '18px',
                color: 'var(--primary)'
              }}
            >
              ${CREDIT_PACK_PRICE}
            </span>
          </div>
          <p 
            style={{ 
              fontSize: '14px',
              color: 'var(--muted-foreground)',
              fontWeight: 'var(--font-weight-normal)'
            }}
          >
            {CREDIT_PACK_SIZE.toLocaleString()} AI Credits per pack
          </p>
        </div>

        {/* Quantity Selector - Desktop */}
        <div 
          className="hidden md:flex items-center justify-between mb-4 p-4"
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)'
          }}
        >
          <span 
            style={{ 
              fontWeight: 'var(--font-weight-medium)',
              fontSize: '15px',
              color: 'var(--foreground)'
            }}
          >
            Number of packs
          </span>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="transition-all hover:bg-accent active:scale-95"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                opacity: quantity <= 1 ? 0.5 : 1
              }}
            >
              <Minus style={{ width: '16px', height: '16px', color: 'var(--foreground)' }} />
            </button>
            
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '20px',
                minWidth: '40px',
                textAlign: 'center',
                color: 'var(--foreground)'
              }}
            >
              {quantity}
            </span>
            
            <button
              onClick={handleIncrease}
              className="transition-all hover:bg-accent active:scale-95"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus style={{ width: '16px', height: '16px', color: 'var(--foreground)' }} />
            </button>
          </div>
        </div>

        {/* Quantity Selector - Mobile */}
        <div 
          className="md:hidden mb-4 p-4"
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="mb-3">
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-medium)',
                fontSize: '14px',
                color: 'var(--muted-foreground)'
              }}
            >
              Number of packs
            </span>
          </div>
          <div className="flex items-center justify-center" style={{ gap: 'var(--spacing-4)' }}>
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="transition-all active:scale-95"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                opacity: quantity <= 1 ? 0.5 : 1
              }}
            >
              <Minus style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            </button>
            
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '28px',
                minWidth: '60px',
                textAlign: 'center',
                color: 'var(--foreground)'
              }}
            >
              {quantity}
            </span>
            
            <button
              onClick={handleIncrease}
              className="transition-all active:scale-95"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus style={{ width: '20px', height: '20px', color: 'var(--foreground)' }} />
            </button>
          </div>
        </div>

        {/* Total Summary */}
        <div 
          className="mb-4 p-4"
          style={{
            background: 'var(--primary-soft)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--primary)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-medium)',
                fontSize: '14px',
                color: 'var(--foreground)'
              }}
            >
              Total Credits
            </span>
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '18px',
                color: 'var(--primary)'
              }}
            >
              {totalCredits.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-medium)',
                fontSize: '14px',
                color: 'var(--foreground)'
              }}
            >
              Total Price
            </span>
            <span 
              style={{ 
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '24px',
                color: 'var(--primary)'
              }}
            >
              ${totalPrice}
            </span>
          </div>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full transition-all active:scale-95"
          style={{
            padding: 'var(--spacing-3)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: '16px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            cursor: isPurchasing ? 'not-allowed' : 'pointer',
            opacity: isPurchasing ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="animate-spin" style={{ width: '18px', height: '18px', marginRight: 'var(--spacing-2)' }} />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart style={{ width: '18px', height: '18px', marginRight: 'var(--spacing-2)' }} />
              Purchase {totalCredits.toLocaleString()} Credits
            </>
          )}
        </Button>

        {/* Info Text */}
        <p 
          className="text-center mt-4"
          style={{ 
            fontSize: '12px',
            color: 'var(--muted-foreground)',
            fontWeight: 'var(--font-weight-normal)',
            lineHeight: '1.5'
          }}
        >
          {isIOSApp 
            ? 'Purchases are securely processed through the App Store. Credits are added instantly to your account.'
            : 'Purchases are securely processed through Stripe. Credits are added instantly to your account.'
          }
        </p>
      </CardContent>
    </Card>
  );
}
