import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Target,
  Sparkles,
  Loader2,
  ShoppingCart,
  BarChart3,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useCredits } from '../../hooks/useCredits';

interface UserResearchSession {
  id: string;
  type: 'interview' | 'survey' | 'usability' | 'focus-group';
  title: string;
  description?: string;
  company?: string;
  participants?: number;
  responses?: number;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  notes?: string;
  insights: number;
}

interface ProductResearchProps {
  user?: any;
  userData?: any;
  userResearch?: UserResearchSession[];
  isLoadingResearch?: boolean;
  expandedResearch?: boolean;
  setExpandedResearch?: (expanded: boolean) => void;
  isAnalyzingResearch?: boolean;
  onAddSession?: () => void;
  onEditSession?: (session: UserResearchSession) => void;
  onAnalyzeResearch?: (sessionId: string) => void;
}

interface ResearchResult {
  id: string;
  productName: string;
  category: string;
  marketDemand: 'high' | 'medium' | 'low';
  profitMargin: number;
  competitionLevel: 'low' | 'medium' | 'high';
  priceRange: { min: number; max: number };
  estimatedMonthlySales: number;
  supplierSources: string[];
  keyInsights: string[];
  pros: string[];
  cons: string[];
  recommendation: string;
  researchScore: number;
  trends: string[];
  targetAudience: string;
  timestamp: string;
}

export function ProductResearch({ 
  user, 
  userData,
  userResearch = [],
  isLoadingResearch = false,
  expandedResearch = false,
  setExpandedResearch = () => {},
  isAnalyzingResearch = false,
  onAddSession = () => {},
  onEditSession = () => {},
  onAnalyzeResearch = () => {}
}: ProductResearchProps) {
  const { deductCredits, checkCredits } = useCredits();
  const [researchQuery, setResearchQuery] = useState('');
  const [niche, setNiche] = useState('');
  const [budget, setBudget] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(null);
  const [researchHistory, setResearchHistory] = useState<ResearchResult[]>([]);

  const handleResearch = async () => {
    if (!researchQuery.trim()) {
      toast.error('Please enter a product idea or category to research');
      return;
    }

    // Check and deduct credits (8 credits for comprehensive product research)
    if (!checkCredits(8)) {
      return;
    }

    setIsResearching(true);
    toast.loading('🔍 Researching products for you...');

    try {
      // Deduct credits before API call
      const success = await deductCredits(8, 'Product Market Research');
      if (!success) {
        setIsResearching(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.dismiss();
        toast.error('Please log in to use product research');
        setIsResearching(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/product-research/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: researchQuery,
            niche: niche || undefined,
            budget: budget ? parseFloat(budget) : undefined,
            targetMarket: targetMarket || undefined,
            businessId: userData?.current_business_id || userData?.businesses?.[0]?.id
          })
        }
      );

      const data = await response.json();
      
      toast.dismiss();

      if (data.success && data.results) {
        toast.success(`Found ${data.results.length} product opportunities!`);
        setResults(data.results);
        setResearchHistory(prev => [...data.results, ...prev].slice(0, 20)); // Keep last 20
        
        if (data.results.length > 0) {
          setSelectedResult(data.results[0]);
        }
      } else {
        throw new Error(data.error || 'Research failed');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Research failed: ${error.message}`);
      console.error('Product research error:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'var(--success)';
      case 'medium': return '#f59e0b';
      case 'low': return 'var(--muted-foreground)';
      default: return 'var(--muted-foreground)';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'var(--success)';
      case 'medium': return '#f59e0b';
      case 'high': return 'var(--destructive)';
      default: return 'var(--muted-foreground)';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return '#f59e0b';
    return 'var(--destructive)';
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-6)',
        paddingTop: 'var(--spacing-4)',
      }}
    >
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
        style={{ gap: 'var(--spacing-4)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
            <div
              className="size-12 flex items-center justify-center"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 100%)'
              }}
            >
              <Search className="size-6" style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-1)' }}>Product Research</h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                AI-powered research for ecommerce reselling opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert 
        style={{ 
          borderColor: 'var(--primary)',
          background: 'var(--primary-soft)'
        }}
      >
        <Lightbulb className="size-4" style={{ color: 'var(--primary)' }} />
        <AlertDescription>
          <strong style={{ color: 'var(--primary)' }}>Cofounder Product Research</strong>
          <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-1)', color: 'var(--foreground)' }}>
            Get AI-powered insights on trending products, profit margins, competition analysis, and supplier sources. 
            Perfect for finding winning products to resell on Amazon, Shopify, or your own store.
          </p>
        </AlertDescription>
      </Alert>

      {/* Research Form */}
      <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <CardHeader style={{ padding: 'var(--spacing-6)' }}>
          <CardTitle>What do you want to sell?</CardTitle>
          <CardDescription>
            Tell us about your product idea, niche, or category and we'll research profitable opportunities for you.
          </CardDescription>
        </CardHeader>
        <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {/* Main Query */}
            <div>
              <Label htmlFor="research-query">
                Product Idea or Category <span style={{ color: 'var(--destructive)' }}>*</span>
              </Label>
              <Textarea
                id="research-query"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                placeholder="e.g., wireless earbuds, eco-friendly water bottles, pet accessories, fitness equipment..."
                rows={3}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>

            {/* Optional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="niche">Niche (Optional)</Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., fitness, gaming, home"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>

              <div>
                <Label htmlFor="budget">Budget per Unit ($) (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g., 50"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>

              <div>
                <Label htmlFor="target-market">Target Market (Optional)</Label>
                <Input
                  id="target-market"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g., USA, Europe, Global"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
            </div>

            {/* Research Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleResearch}
                disabled={isResearching || !researchQuery.trim()}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  gap: 'var(--spacing-2)',
                  padding: 'var(--spacing-3) var(--spacing-5)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {isResearching ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Research Products
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Tabs defaultValue="overview" style={{ width: '100%' }}>
          <TabsList style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            width: '100%',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2)',
            background: 'var(--muted)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="history">Research History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" style={{ marginTop: 'var(--spacing-4)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg"
                    style={{ 
                      borderRadius: 'var(--radius-xl)',
                      border: selectedResult?.id === result.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedResult?.id === result.id ? 'var(--primary-soft)' : 'var(--card)'
                    }}
                    onClick={() => setSelectedResult(result)}
                  >
                    <CardHeader style={{ padding: 'var(--spacing-4)' }}>
                      <div className="flex items-start justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
                        <Package className="size-8" style={{ color: 'var(--primary)' }} />
                        <div
                          className="size-12 rounded-full flex items-center justify-center"
                          style={{ background: getScoreColor(result.researchScore) + '20' }}
                        >
                          <span style={{ 
                            fontWeight: 'var(--font-weight-bold)', 
                            color: getScoreColor(result.researchScore) 
                          }}>
                            {result.researchScore}
                          </span>
                        </div>
                      </div>
                      <CardTitle style={{ fontSize: '1.125rem' }}>{result.productName}</CardTitle>
                      <CardDescription>{result.category}</CardDescription>
                    </CardHeader>
                    <CardContent style={{ padding: '0 var(--spacing-4) var(--spacing-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        {/* Key Metrics */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            Market Demand
                          </span>
                          <Badge style={{ 
                            background: getDemandColor(result.marketDemand) + '20',
                            color: getDemandColor(result.marketDemand),
                            border: 'none'
                          }}>
                            {result.marketDemand}
                          </Badge>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            Competition
                          </span>
                          <Badge style={{ 
                            background: getCompetitionColor(result.competitionLevel) + '20',
                            color: getCompetitionColor(result.competitionLevel),
                            border: 'none'
                          }}>
                            {result.competitionLevel}
                          </Badge>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            Profit Margin
                          </span>
                          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--success)' }}>
                            {result.profitMargin}%
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            Price Range
                          </span>
                          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                            ${result.priceRange.min} - ${result.priceRange.max}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" style={{ marginTop: 'var(--spacing-4)' }}>
            {selectedResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {/* Product Header */}
                <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                  <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                    <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-4)' }}>
                      <div style={{ flex: 1 }}>
                        <CardTitle style={{ marginBottom: 'var(--spacing-2)' }}>
                          {selectedResult.productName}
                        </CardTitle>
                        <CardDescription style={{ fontSize: '1rem' }}>
                          {selectedResult.category} • Target: {selectedResult.targetAudience}
                        </CardDescription>
                      </div>
                      <div
                        className="size-16 rounded-full flex items-center justify-center"
                        style={{ background: getScoreColor(selectedResult.researchScore) + '20' }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: '1.5rem',
                            fontWeight: 'var(--font-weight-bold)', 
                            color: getScoreColor(selectedResult.researchScore) 
                          }}>
                            {selectedResult.researchScore}
                          </div>
                          <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>
                            Score
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                    <Alert style={{ 
                      borderColor: getScoreColor(selectedResult.researchScore),
                      background: getScoreColor(selectedResult.researchScore) + '10'
                    }}>
                      <Target className="size-4" />
                      <AlertDescription>
                        <strong>Recommendation:</strong> {selectedResult.recommendation}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Market Demand */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardContent style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                      <TrendingUp className="size-8 mx-auto" style={{ color: getDemandColor(selectedResult.marketDemand), marginBottom: 'var(--spacing-2)' }} />
                      <h4 style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                        Market Demand
                      </h4>
                      <Badge style={{ 
                        background: getDemandColor(selectedResult.marketDemand) + '20',
                        color: getDemandColor(selectedResult.marketDemand),
                        border: 'none',
                        fontSize: '0.875rem',
                        padding: 'var(--spacing-1) var(--spacing-3)'
                      }}>
                        {selectedResult.marketDemand}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Competition */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardContent style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                      <Target className="size-8 mx-auto" style={{ color: getCompetitionColor(selectedResult.competitionLevel), marginBottom: 'var(--spacing-2)' }} />
                      <h4 style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                        Competition
                      </h4>
                      <Badge style={{ 
                        background: getCompetitionColor(selectedResult.competitionLevel) + '20',
                        color: getCompetitionColor(selectedResult.competitionLevel),
                        border: 'none',
                        fontSize: '0.875rem',
                        padding: 'var(--spacing-1) var(--spacing-3)'
                      }}>
                        {selectedResult.competitionLevel}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Profit Margin */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardContent style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                      <DollarSign className="size-8 mx-auto" style={{ color: 'var(--success)', marginBottom: 'var(--spacing-2)' }} />
                      <h4 style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                        Profit Margin
                      </h4>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--success)' }}>
                        {selectedResult.profitMargin}%
                      </p>
                    </CardContent>
                  </Card>

                  {/* Estimated Sales */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardContent style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                      <BarChart3 className="size-8 mx-auto" style={{ color: 'var(--chart-2)', marginBottom: 'var(--spacing-2)' }} />
                      <h4 style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                        Est. Monthly Sales
                      </h4>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>
                        {selectedResult.estimatedMonthlySales}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights & Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pros */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                      <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', fontSize: '1rem' }}>
                        <Lightbulb className="size-5" style={{ color: 'var(--success)' }} />
                        Pros
                      </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        {selectedResult.pros.map((pro, index) => (
                          <li key={index} style={{ display: 'flex', gap: 'var(--spacing-2)', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Cons */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                      <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', fontSize: '1rem' }}>
                        <AlertCircle className="size-5" style={{ color: 'var(--destructive)' }} />
                        Cons
                      </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        {selectedResult.cons.map((con, index) => (
                          <li key={index} style={{ display: 'flex', gap: 'var(--spacing-2)', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--destructive)', flexShrink: 0 }}>!</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Insights */}
                <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                  <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                    <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                      <Lightbulb className="size-5" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      {selectedResult.keyInsights.map((insight, index) => (
                        <li key={index} style={{ display: 'flex', gap: 'var(--spacing-3)', fontSize: '0.875rem' }}>
                          <span style={{ color: 'var(--primary)', flexShrink: 0, fontWeight: 'var(--font-weight-bold)' }}>
                            {index + 1}.
                          </span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Trends & Suppliers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trends */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                      <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                        <BarChart3 className="size-5" />
                        Market Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                        {selectedResult.trends.map((trend, index) => (
                          <Badge 
                            key={index}
                            style={{ 
                              background: 'var(--primary-soft)',
                              color: 'var(--primary)',
                              border: 'none',
                              padding: 'var(--spacing-2) var(--spacing-3)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              maxWidth: '100%'
                            }}
                          >
                            {trend}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supplier Sources */}
                  <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                      <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                        <ShoppingCart className="size-5" />
                        Supplier Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: '0 var(--spacing-6) var(--spacing-6)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        {selectedResult.supplierSources.map((source, index) => (
                          <div 
                            key={index}
                            style={{
                              padding: 'var(--spacing-3)',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--muted)',
                              fontSize: '0.875rem',
                              wordBreak: 'break-word',
                              maxWidth: '100%'
                            }}
                          >
                            {source}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 'var(--spacing-8)', textAlign: 'center' }}>
                <Package className="size-12 mx-auto" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }} />
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Select a product from the overview to see detailed analysis
                </p>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" style={{ marginTop: 'var(--spacing-4)' }}>
            {researchHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {researchHistory.map((item) => (
                  <Card 
                    key={item.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}
                    onClick={() => {
                      setSelectedResult(item);
                    }}
                  >
                    <CardContent style={{ padding: 'var(--spacing-4)' }}>
                      <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-4)' }}>
                        <div className="flex items-center" style={{ gap: 'var(--spacing-3)', flex: 1 }}>
                          <Package className="size-8" style={{ color: 'var(--primary)' }} />
                          <div>
                            <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{item.productName}</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                              {item.category} • {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div
                          className="size-12 rounded-full flex items-center justify-center"
                          style={{ background: getScoreColor(item.researchScore) + '20' }}
                        >
                          <span style={{ 
                            fontWeight: 'var(--font-weight-bold)', 
                            color: getScoreColor(item.researchScore) 
                          }}>
                            {item.researchScore}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 'var(--spacing-8)', textAlign: 'center' }}>
                <BookOpen className="size-12 mx-auto" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }} />
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Your research history will appear here
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {results.length === 0 && !isResearching && (
        <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 'var(--spacing-12)', textAlign: 'center' }}>
          <Search className="size-16 mx-auto" style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }} />
          <h3 style={{ marginBottom: 'var(--spacing-2)' }}>
            Ready to Find Your Next Winning Product?
          </h3>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-6)', maxWidth: '600px', margin: '0 auto var(--spacing-6)' }}>
            Enter your product idea above and let Cofounder research market demand, competition, pricing, and supplier sources for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto" style={{ marginTop: 'var(--spacing-6)' }}>
            <div style={{ padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', background: 'var(--muted)' }}>
              <BarChart3 className="size-8 mx-auto" style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-2)' }} />
              <h4 style={{ marginBottom: 'var(--spacing-1)' }}>Market Analysis</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Get real-time market demand and competition data
              </p>
            </div>
            <div style={{ padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', background: 'var(--muted)' }}>
              <DollarSign className="size-8 mx-auto" style={{ color: 'var(--success)', marginBottom: 'var(--spacing-2)' }} />
              <h4 style={{ marginBottom: 'var(--spacing-1)' }}>Profit Insights</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Calculate profit margins and pricing strategies
              </p>
            </div>
            <div style={{ padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', background: 'var(--muted)' }}>
              <Globe className="size-8 mx-auto" style={{ color: 'var(--chart-2)', marginBottom: 'var(--spacing-2)' }} />
              <h4 style={{ marginBottom: 'var(--spacing-1)' }}>Supplier Sources</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Find reliable suppliers and sourcing options
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
