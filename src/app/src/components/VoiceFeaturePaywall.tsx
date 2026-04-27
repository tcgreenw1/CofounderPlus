/**
 * Voice Feature Paywall
 * Shows upgrade prompt for non-Scale users trying to access voice features
 * Uses design system CSS variables
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Mic, Volume2, Sparkles, Crown, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoiceFeaturePaywallProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
}

export function VoiceFeaturePaywall({ isOpen, onClose, currentTier = 'free' }: VoiceFeaturePaywallProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/beta-settings');
  };

  const voiceFeatures = [
    {
      icon: Mic,
      title: 'Voice Input',
      description: 'Speak naturally to your AI Cofounder instead of typing',
      color: '#ff4f50'
    },
    {
      icon: Volume2,
      title: 'Voice Output',
      description: 'Listen to AI responses with natural-sounding voice',
      color: '#2b7fff'
    },
    {
      icon: Sparkles,
      title: 'Hands-Free Mode',
      description: 'Have conversations while working on other tasks',
      color: '#ffe020'
    }
  ];

  const tierComparison = {
    free: {
      name: 'Free',
      color: '#999999',
      features: ['Text chat only', 'Limited messages', 'No voice features']
    },
    starter: {
      name: 'Starter',
      color: '#999999',
      features: ['Text chat only', 'Limited messages', 'No voice features']
    },
    creator: {
      name: 'Launch',
      color: '#4B00FF',
      features: ['Text chat only', 'Unlimited messages', 'No voice features']
    },
    builder: {
      name: 'Grow',
      color: '#FF6B00',
      features: ['Text chat only', 'Unlimited messages', 'No voice features']
    },
    scale: {
      name: 'Scale',
      color: '#00D4AA',
      features: ['Text & Voice chat', 'Unlimited messages', 'Voice input & output', 'Priority AI access']
    }
  };

  const currentTierInfo = tierComparison[currentTier as keyof typeof tierComparison] || tierComparison.free;
  const scaleTierInfo = tierComparison.scale;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--spacing-6)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-center" style={{ marginBottom: 'var(--spacing-4)' }}>
            <div
              className="size-16 flex items-center justify-center"
              style={{
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(0, 212, 170, 0.1))',
                border: '2px solid rgba(0, 212, 170, 0.3)',
              }}
            >
              <Crown className="size-8" style={{ color: '#00D4AA' }} />
            </div>
          </div>

          <DialogTitle className="text-center text-2xl" style={{ marginBottom: 'var(--spacing-2)' }}>
            Voice Features are Scale-Only
          </DialogTitle>
          
          <DialogDescription className="text-center">
            Upgrade to <strong style={{ color: '#00D4AA' }}>Scale</strong> to unlock voice input and output for hands-free AI conversations
          </DialogDescription>
        </DialogHeader>

        <div style={{ marginTop: 'var(--spacing-6)' }}>
          {/* Voice Features Showcase */}
          <div 
            className="grid gap-4"
            style={{ 
              marginBottom: 'var(--spacing-6)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
            }}
          >
            {voiceFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  className="border"
                  style={{
                    borderColor: 'var(--border)',
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <CardContent style={{ padding: 'var(--spacing-4)' }}>
                    <div className="flex flex-col items-center text-center" style={{ gap: 'var(--spacing-3)' }}>
                      <div
                        className="size-12 flex items-center justify-center"
                        style={{
                          borderRadius: 'var(--radius-lg)',
                          background: `${feature.color}20`,
                          border: `1px solid ${feature.color}40`,
                        }}
                      >
                        <Icon className="size-6" style={{ color: feature.color }} />
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ marginBottom: 'var(--spacing-1)' }}>
                          {feature.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tier Comparison */}
          <div 
            className="grid gap-4"
            style={{ 
              marginBottom: 'var(--spacing-6)',
              gridTemplateColumns: '1fr 1fr'
            }}
          >
            {/* Current Tier */}
            <Card 
              className="border"
              style={{
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <CardContent style={{ padding: 'var(--spacing-4)' }}>
                <div className="text-center" style={{ marginBottom: 'var(--spacing-3)' }}>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground" style={{ marginBottom: 'var(--spacing-2)' }}>
                    Your Current Plan
                  </div>
                  <h3 className="text-xl" style={{ color: currentTierInfo.color }}>
                    {currentTierInfo.name}
                  </h3>
                </div>
                <div className="space-y-2">
                  {currentTierInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-start" style={{ gap: 'var(--spacing-2)' }}>
                      <X className="size-4 flex-shrink-0 text-muted-foreground" style={{ marginTop: '2px' }} />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scale Tier */}
            <Card 
              className="border relative overflow-hidden"
              style={{
                borderColor: scaleTierInfo.color,
                borderWidth: '2px',
                borderRadius: 'var(--radius-xl)',
                background: `linear-gradient(135deg, ${scaleTierInfo.color}10, ${scaleTierInfo.color}05)`,
              }}
            >
              <div 
                className="absolute top-0 right-0 text-xs px-3 py-1 text-white"
                style={{
                  background: scaleTierInfo.color,
                  borderBottomLeftRadius: 'var(--radius-lg)',
                }}
              >
                Recommended
              </div>
              <CardContent style={{ padding: 'var(--spacing-4)' }}>
                <div className="text-center" style={{ marginBottom: 'var(--spacing-3)' }}>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground" style={{ marginBottom: 'var(--spacing-2)' }}>
                    Upgrade To
                  </div>
                  <h3 className="text-xl" style={{ color: scaleTierInfo.color }}>
                    {scaleTierInfo.name}
                  </h3>
                </div>
                <div className="space-y-2">
                  {scaleTierInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-start" style={{ gap: 'var(--spacing-2)' }}>
                      <Check className="size-4 flex-shrink-0" style={{ marginTop: '2px', color: scaleTierInfo.color }} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row" style={{ gap: 'var(--spacing-3)' }}>
            <Button
              onClick={handleUpgrade}
              className="flex-1"
              size="lg"
              style={{
                background: 'linear-gradient(135deg, #00D4AA, #00B894)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-4) var(--spacing-6)',
              }}
            >
              <Crown className="size-5" style={{ marginRight: 'var(--spacing-2)' }} />
              Upgrade to Scale
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-4) var(--spacing-6)',
              }}
            >
              Maybe Later
            </Button>
          </div>

          {/* Additional Info */}
          <div 
            className="text-center text-xs text-muted-foreground"
            style={{ marginTop: 'var(--spacing-4)' }}
          >
            All plans include a 7-day free trial • Cancel anytime
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}