/**
 * AI Model Selection Page
 * Allows users to choose their preferred AI model for Cofounder interactions
 * Uses design system CSS variables for consistent styling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Brain, 
  ChevronLeft, 
  Check, 
  Lock, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Globe,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { useBusiness } from './BusinessContext';
import { toast } from 'sonner@2.0.3';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: React.ComponentType<any>;
  description: string;
  benefits: string[];
  efficiency: string;
  cons: string[];
  available: boolean;
  comingSoon?: boolean;
  brandColor: string;
  selected: boolean;
}

export function AIModelSelection() {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [selectedModelId, setSelectedModelId] = useState('chatgpt');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const models: AIModel[] = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      provider: 'OpenAI',
      icon: Brain,
      description: 'Industry-leading conversational AI with exceptional reasoning and context understanding. Powers Cofounder with reliable, accurate business insights backed by continuous improvements.',
      benefits: [
        'Superior natural language understanding',
        'Excellent context retention across conversations',
        'Highly accurate business analysis',
        'Robust API reliability and uptime',
        'Regular model updates and improvements',
        'Best-in-class reasoning capabilities'
      ],
      efficiency: 'Fast response times (1-3 seconds) with optimized token usage',
      cons: [
        'Higher cost per request compared to some alternatives',
        'Occasional creativity limitations in highly specialized domains'
      ],
      available: true,
      brandColor: '#10A37F',
      selected: true
    },
    {
      id: 'gemini',
      name: 'Gemini Pro',
      provider: 'Google',
      icon: Sparkles,
      description: 'Google\'s advanced multimodal AI with strong analytical capabilities. Coming soon to Cofounder.',
      benefits: [
        'Strong integration with Google ecosystem',
        'Advanced multimodal capabilities',
        'Competitive pricing',
        'Fast inference speeds'
      ],
      efficiency: 'Very fast response times with efficient processing',
      cons: [
        'Limited availability in certain regions',
        'Newer to market with evolving capabilities'
      ],
      available: false,
      comingSoon: true,
      brandColor: '#4285F4',
      selected: false
    },
    {
      id: 'copilot',
      name: 'Copilot',
      provider: 'Microsoft',
      icon: MessageSquare,
      description: 'Microsoft\'s enterprise-focused AI assistant. Coming soon to Cofounder.',
      benefits: [
        'Deep Microsoft 365 integration',
        'Enterprise-grade security',
        'Strong productivity features',
        'Azure infrastructure reliability'
      ],
      efficiency: 'Optimized for enterprise workflows',
      cons: [
        'Best suited for Microsoft ecosystem users',
        'May have higher enterprise pricing'
      ],
      available: false,
      comingSoon: true,
      brandColor: '#0078D4',
      selected: false
    },
    {
      id: 'grok',
      name: 'Grok',
      provider: 'X',
      icon: Globe,
      description: 'X\'s AI with real-time information access. Coming soon to Cofounder.',
      benefits: [
        'Real-time information from X platform',
        'Unique conversational personality',
        'Integration with X ecosystem',
        'Innovative approach to AI interactions'
      ],
      efficiency: 'Real-time data processing capabilities',
      cons: [
        'Limited track record',
        'Platform-specific focus',
        'Availability restrictions'
      ],
      available: false,
      comingSoon: true,
      brandColor: '#000000',
      selected: false
    }
  ];

  // Load user's selected model on mount
  useEffect(() => {
    loadSelectedModel();
  }, [selectedBusiness?.id]);

  const loadSelectedModel = async () => {
    if (!selectedBusiness?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('ai_model_preference')
        .eq('id', selectedBusiness.id)
        .single();

      if (!error && data?.ai_model_preference) {
        setSelectedModelId(data.ai_model_preference);
      }
    } catch (error) {
      console.error('Error loading AI model preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    
    if (!model?.available) {
      toast.error('This AI model is not yet available. Stay tuned!');
      return;
    }

    setSelectedModelId(modelId);
  };

  const handleSave = async () => {
    if (!selectedBusiness?.id) {
      toast.error('Please select a business first');
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('businesses')
        .update({ ai_model_preference: selectedModelId })
        .eq('id', selectedBusiness.id);

      if (error) throw error;

      toast.success('AI model preference saved successfully');
      navigate('/integrations');
    } catch (error: any) {
      console.error('Error saving AI model preference:', error);
      toast.error('Failed to save AI model preference');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="max-w-6xl mx-auto"
        style={{ 
          padding: 'var(--spacing-4) var(--spacing-4) var(--spacing-8) var(--spacing-4)'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <Button
            variant="ghost"
            onClick={() => navigate('/integrations')}
            className="mb-4"
            style={{ gap: 'var(--spacing-2)' }}
          >
            <ChevronLeft className="size-4" />
            Back to Integrations
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
                <div
                  className="size-12 flex items-center justify-center"
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.2), rgba(43, 127, 255, 0.1))',
                    border: '1px solid rgba(43, 127, 255, 0.3)',
                  }}
                >
                  <Brain className="size-6 text-primary" />
                </div>
                <div>
                  <h1 style={{ marginBottom: 'var(--spacing-1)' }}>
                    Choose Your AI Model
                  </h1>
                  <p className="text-muted-foreground">
                    Select the AI model that powers your Cofounder interactions
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #2b7fff, #1e5dd9)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2) var(--spacing-6)',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Preference'}
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert 
          className="border"
          style={{
            marginBottom: 'var(--spacing-6)',
            borderColor: 'rgba(43, 127, 255, 0.3)',
            background: 'rgba(43, 127, 255, 0.05)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <AlertCircle className="size-4" style={{ color: '#2b7fff' }} />
          <AlertDescription style={{ color: '#2b7fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Sparkles className="size-4" />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Enhanced AI Experience</span>
            </div>
            <p className="text-sm" style={{ marginTop: 'var(--spacing-1)' }}>
              Your selected AI model will be used across all Cofounder features including chat, roadmap assistance, and business analysis.
            </p>
          </AlertDescription>
        </Alert>

        {/* AI Models Grid */}
        <div 
          className="grid gap-6"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
          }}
        >
          {models.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModelId === model.id;
            const isDisabled = !model.available;

            return (
              <Card
                key={model.id}
                className={`relative border transition-all cursor-pointer ${
                  isDisabled ? 'opacity-60' : 'hover:shadow-lg'
                }`}
                style={{
                  borderRadius: 'var(--radius-2xl)',
                  borderColor: isSelected ? model.brandColor : 'var(--border)',
                  borderWidth: isSelected ? '2px' : '1px',
                  background: isSelected 
                    ? `linear-gradient(135deg, ${model.brandColor}10, ${model.brandColor}05)`
                    : 'var(--card)',
                }}
                onClick={() => !isDisabled && handleModelSelect(model.id)}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div
                    className="absolute top-4 right-4 flex items-center text-white text-xs px-2 py-1"
                    style={{
                      background: model.brandColor,
                      borderRadius: 'var(--radius-full)',
                      gap: 'var(--spacing-1)',
                    }}
                  >
                    <Check className="size-3" />
                    Selected
                  </div>
                )}

                {/* Coming Soon Badge */}
                {model.comingSoon && (
                  <div
                    className="absolute top-4 right-4 flex items-center text-white text-xs px-2 py-1"
                    style={{
                      background: '#999999',
                      borderRadius: 'var(--radius-full)',
                      gap: 'var(--spacing-1)',
                    }}
                  >
                    <Lock className="size-3" />
                    Coming Soon
                  </div>
                )}

                <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                  <div className="flex items-start" style={{ gap: 'var(--spacing-4)' }}>
                    <div
                      className="size-14 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderRadius: 'var(--radius-xl)',
                        background: `${model.brandColor}20`,
                        border: `1px solid ${model.brandColor}40`,
                      }}
                    >
                      <Icon className="size-7" style={{ color: model.brandColor }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle style={{ marginBottom: 'var(--spacing-1)' }}>
                        {model.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        by {model.provider}
                      </CardDescription>
                    </div>
                  </div>

                  <p 
                    className="text-sm" 
                    style={{ 
                      marginTop: 'var(--spacing-3)',
                      lineHeight: '1.5'
                    }}
                  >
                    {model.description}
                  </p>
                </CardHeader>

                <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6) var(--spacing-6)' }}>
                  {/* Benefits */}
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div 
                      className="flex items-center text-xs uppercase tracking-wide text-muted-foreground"
                      style={{ 
                        marginBottom: 'var(--spacing-2)',
                        gap: 'var(--spacing-2)'
                      }}
                    >
                      <TrendingUp className="size-3" />
                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Benefits</span>
                    </div>
                    <ul className="space-y-1">
                      {model.benefits.slice(0, 4).map((benefit, index) => (
                        <li 
                          key={index} 
                          className="flex items-start text-sm"
                          style={{ gap: 'var(--spacing-2)' }}
                        >
                          <Check 
                            className="size-3 flex-shrink-0" 
                            style={{ 
                              marginTop: '3px',
                              color: model.brandColor 
                            }} 
                          />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Efficiency */}
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div 
                      className="flex items-center text-xs uppercase tracking-wide text-muted-foreground"
                      style={{ 
                        marginBottom: 'var(--spacing-2)',
                        gap: 'var(--spacing-2)'
                      }}
                    >
                      <Zap className="size-3" />
                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Efficiency</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {model.efficiency}
                    </p>
                  </div>

                  {/* Cons */}
                  <div>
                    <div 
                      className="flex items-center text-xs uppercase tracking-wide text-muted-foreground"
                      style={{ 
                        marginBottom: 'var(--spacing-2)',
                        gap: 'var(--spacing-2)'
                      }}
                    >
                      <AlertCircle className="size-3" />
                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Considerations</span>
                    </div>
                    <ul className="space-y-1">
                      {model.cons.map((con, index) => (
                        <li 
                          key={index} 
                          className="flex items-start text-sm"
                          style={{ gap: 'var(--spacing-2)' }}
                        >
                          <span 
                            className="flex-shrink-0" 
                            style={{ 
                              marginTop: '2px',
                              color: '#ff4f50',
                              fontSize: '10px'
                            }}
                          >
                            ●
                          </span>
                          <span className="text-muted-foreground">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Select Button for Available Models */}
                  {!isSelected && model.available && (
                    <Button
                      variant="outline"
                      className="w-full"
                      style={{
                        marginTop: 'var(--spacing-4)',
                        borderRadius: 'var(--radius-lg)',
                        borderColor: model.brandColor,
                        color: model.brandColor,
                      }}
                      onClick={() => handleModelSelect(model.id)}
                    >
                      Select {model.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div 
          className="text-center text-sm text-muted-foreground"
          style={{ marginTop: 'var(--spacing-8)' }}
        >
          <p>
            More AI models coming soon. We're constantly evaluating new options to provide you with the best AI experience.
          </p>
        </div>
      </div>
    </div>
  );
}
