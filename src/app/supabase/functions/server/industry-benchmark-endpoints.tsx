/**
 * Industry Benchmark Endpoints
 * Compare business metrics against industry averages
 */

import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

/**
 * GET /industry-benchmarks/:businessId
 * Get industry benchmark comparisons
 */
export async function getIndustryBenchmarks(c: Context) {
  try {
    const businessId = c.req.param('businessId');
    
    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('📊 Fetching industry benchmarks for:', businessId);

    // Get the user from the access token
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    // Extract the token and get user
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    // Fetch business data from KV store using correct key format
    const businessKey = `business:${user.id}:${businessId}`;
    console.log('🔍 Looking for business with key:', businessKey);
    
    const businessData = await kv.get(businessKey);

    if (!businessData) {
      console.log('❌ Business not found with ID:', businessId, 'for user:', user.id);
      console.log('📝 Returning default benchmark data for new business');
      
      // Return default benchmark data for new businesses
      return c.json({
        industry: 'General Business',
        businessStage: 'startup',
        metrics: [
          {
            name: 'Revenue Growth Rate',
            yourValue: 0,
            industryAverage: 10,
            unit: '%',
            displayFormat: 'percentage',
            status: 'at-par',
            difference: 0,
            icon: '📈'
          },
          {
            name: 'Profit Margin',
            yourValue: 0,
            industryAverage: 5,
            unit: '%',
            displayFormat: 'percentage',
            status: 'at-par',
            difference: 0,
            icon: '💰'
          },
          {
            name: 'Revenue Per Employee',
            yourValue: 0,
            industryAverage: 100000,
            unit: '',
            displayFormat: 'currency',
            status: 'at-par',
            difference: 0,
            icon: '👤'
          },
          {
            name: 'Operating Expense Ratio',
            yourValue: 0,
            industryAverage: 95,
            unit: '%',
            displayFormat: 'percentage',
            status: 'at-par',
            difference: 0,
            icon: '💸'
          },
          {
            name: 'Cash Runway',
            yourValue: 0,
            industryAverage: 10,
            unit: ' mo',
            displayFormat: 'number',
            status: 'at-par',
            difference: 0,
            icon: '⏱️'
          }
        ],
        overallRanking: 'average',
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log('✅ Business data found:', { id: businessId, name: businessData?.name });

    // Gather business metrics from various sources
    const [
      financialData,
      transactionsData,
      teamData,
      productsData
    ] = await Promise.all([
      kv.get(`finance:${user.id}:${businessId}`),
      kv.getByPrefix(`transaction:${user.id}:${businessId}:`),
      kv.getByPrefix(`team_member:${user.id}:${businessId}:`),
      kv.getByPrefix(`product:${user.id}:${businessId}:`)
    ]);

    console.log('📊 Gathered business data for benchmarks:', {
      hasFinancial: !!financialData,
      transactionsCount: transactionsData?.length || 0,
      teamCount: teamData?.length || 0,
      productsCount: productsData?.length || 0
    });

    // Determine industry and business stage
    const industry = determineIndustry(businessData);
    const businessStage = determineBusinessStage(transactionsData, teamData);

    // Get industry benchmarks based on industry and stage
    const industryBenchmarks = getIndustryBenchmarkData(industry, businessStage);

    // Calculate actual business metrics
    const actualMetrics = calculateBusinessMetrics(
      businessData,
      transactionsData,
      teamData,
      productsData
    );

    // Compare and create benchmark metrics
    const metrics = createBenchmarkComparisons(actualMetrics, industryBenchmarks);

    // Determine overall ranking
    const overallRanking = determineOverallRanking(metrics);

    const benchmarkData = {
      industry,
      businessStage,
      metrics,
      overallRanking,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Industry benchmarks calculated:', benchmarkData);
    return c.json(benchmarkData);

  } catch (error: any) {
    console.error('❌ Error calculating industry benchmarks:', error);
    return c.json({ 
      error: 'Failed to calculate benchmarks',
      details: error.message 
    }, 500);
  }
}

// Helper function to determine industry
function determineIndustry(businessData: any): string {
  // Check if industry is set in business data
  if (businessData.industry) {
    return businessData.industry;
  }

  // Check business type or category
  if (businessData.type) {
    const type = businessData.type.toLowerCase();
    if (type.includes('tech') || type.includes('software') || type.includes('saas')) {
      return 'Technology';
    }
    if (type.includes('retail') || type.includes('ecommerce')) {
      return 'Retail';
    }
    if (type.includes('service')) {
      return 'Professional Services';
    }
    if (type.includes('restaurant') || type.includes('food')) {
      return 'Food & Beverage';
    }
    if (type.includes('health') || type.includes('medical')) {
      return 'Healthcare';
    }
  }

  // Default to general business
  return 'General Business';
}

// Helper function to determine business stage
function determineBusinessStage(transactionsData: any[], teamData: any[]): string {
  const monthlyRevenue = calculateMonthlyRevenue(transactionsData);
  const teamSize = teamData?.length || 0;

  // Startup: < $10k MRR, < 5 employees
  if (monthlyRevenue < 10000 && teamSize < 5) {
    return 'startup';
  }

  // Growth: $10k-$100k MRR or 5-25 employees
  if ((monthlyRevenue >= 10000 && monthlyRevenue < 100000) || (teamSize >= 5 && teamSize < 25)) {
    return 'growth';
  }

  // Established: $100k+ MRR or 25+ employees
  if (monthlyRevenue >= 100000 || teamSize >= 25) {
    return 'established';
  }

  return 'startup';
}

// Helper function to calculate monthly revenue
function calculateMonthlyRevenue(transactionsData: any[]): number {
  if (!transactionsData || transactionsData.length === 0) {
    return 0;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  const recentRevenue = transactionsData
    .filter(t => {
      const transDate = new Date(t.date || t.created_at);
      return transDate >= thirtyDaysAgo && (t.type === 'income' || t.category === 'revenue');
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  return recentRevenue;
}

// Get industry-specific benchmarks
function getIndustryBenchmarkData(industry: string, stage: string): any {
  // Base benchmarks that vary by industry and stage
  const benchmarks: any = {
    'Technology': {
      'startup': {
        revenueGrowthRate: 15, // % monthly
        profitMargin: -20, // % (negative for startups)
        revenuePerEmployee: 120000, // annual
        operatingExpenseRatio: 120, // % of revenue
        customerAcquisitionCost: 500,
        cashRunway: 12 // months
      },
      'growth': {
        revenueGrowthRate: 10,
        profitMargin: 5,
        revenuePerEmployee: 180000,
        operatingExpenseRatio: 95,
        customerAcquisitionCost: 800,
        cashRunway: 18
      },
      'established': {
        revenueGrowthRate: 5,
        profitMargin: 20,
        revenuePerEmployee: 250000,
        operatingExpenseRatio: 80,
        customerAcquisitionCost: 1000,
        cashRunway: 24
      }
    },
    'Retail': {
      'startup': {
        revenueGrowthRate: 12,
        profitMargin: 5,
        revenuePerEmployee: 85000,
        operatingExpenseRatio: 95,
        customerAcquisitionCost: 150,
        cashRunway: 9
      },
      'growth': {
        revenueGrowthRate: 8,
        profitMargin: 10,
        revenuePerEmployee: 120000,
        operatingExpenseRatio: 90,
        customerAcquisitionCost: 200,
        cashRunway: 12
      },
      'established': {
        revenueGrowthRate: 4,
        profitMargin: 15,
        revenuePerEmployee: 150000,
        operatingExpenseRatio: 85,
        customerAcquisitionCost: 250,
        cashRunway: 18
      }
    },
    'Professional Services': {
      'startup': {
        revenueGrowthRate: 10,
        profitMargin: 10,
        revenuePerEmployee: 100000,
        operatingExpenseRatio: 90,
        customerAcquisitionCost: 1000,
        cashRunway: 10
      },
      'growth': {
        revenueGrowthRate: 8,
        profitMargin: 15,
        revenuePerEmployee: 150000,
        operatingExpenseRatio: 85,
        customerAcquisitionCost: 1500,
        cashRunway: 15
      },
      'established': {
        revenueGrowthRate: 5,
        profitMargin: 25,
        revenuePerEmployee: 200000,
        operatingExpenseRatio: 75,
        customerAcquisitionCost: 2000,
        cashRunway: 20
      }
    },
    'General Business': {
      'startup': {
        revenueGrowthRate: 10,
        profitMargin: 5,
        revenuePerEmployee: 100000,
        operatingExpenseRatio: 95,
        customerAcquisitionCost: 500,
        cashRunway: 10
      },
      'growth': {
        revenueGrowthRate: 7,
        profitMargin: 12,
        revenuePerEmployee: 140000,
        operatingExpenseRatio: 88,
        customerAcquisitionCost: 700,
        cashRunway: 15
      },
      'established': {
        revenueGrowthRate: 4,
        profitMargin: 18,
        revenuePerEmployee: 180000,
        operatingExpenseRatio: 82,
        customerAcquisitionCost: 900,
        cashRunway: 20
      }
    }
  };

  // Get benchmarks for specific industry and stage, or fall back to General Business
  const industryBenchmarks = benchmarks[industry] || benchmarks['General Business'];
  return industryBenchmarks[stage] || industryBenchmarks['startup'];
}

// Calculate actual business metrics
function calculateBusinessMetrics(
  businessData: any,
  transactionsData: any[],
  teamData: any[],
  productsData: any[]
): any {
  const now = new Date();
  const teamSize = teamData?.length || 1; // Default to 1 (solo founder)

  // Calculate revenue growth rate (last 30 days vs previous 30 days)
  const last30DaysRevenue = calculateRevenueForPeriod(transactionsData, 0, 30);
  const previous30DaysRevenue = calculateRevenueForPeriod(transactionsData, 30, 60);
  
  let revenueGrowthRate = 0;
  if (previous30DaysRevenue > 0) {
    revenueGrowthRate = ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100;
  }

  // Calculate profit margin
  const totalRevenue = calculateRevenueForPeriod(transactionsData, 0, 365);
  const totalExpenses = calculateExpensesForPeriod(transactionsData, 0, 365);
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  // Calculate revenue per employee (annualized)
  const monthlyRevenue = last30DaysRevenue;
  const annualRevenue = monthlyRevenue * 12;
  const revenuePerEmployee = teamSize > 0 ? annualRevenue / teamSize : annualRevenue;

  // Calculate operating expense ratio
  const operatingExpenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 100;

  // Estimate customer acquisition cost (if we have customer/sale data)
  const marketingExpenses = calculateMarketingExpenses(transactionsData);
  const numberOfTransactions = transactionsData?.filter(t => t.type === 'income')?.length || 1;
  const customerAcquisitionCost = marketingExpenses / numberOfTransactions;

  // Calculate cash runway (months)
  const currentBalance = totalRevenue - totalExpenses;
  const monthlyBurnRate = totalExpenses / 12;
  const cashRunway = monthlyBurnRate > 0 ? currentBalance / monthlyBurnRate : 12;

  return {
    revenueGrowthRate,
    profitMargin,
    revenuePerEmployee,
    operatingExpenseRatio,
    customerAcquisitionCost,
    cashRunway: Math.max(0, cashRunway)
  };
}

// Helper to calculate revenue for a specific period
function calculateRevenueForPeriod(transactionsData: any[], daysAgo: number, daysBack: number): number {
  if (!transactionsData) return 0;

  const now = new Date();
  const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const endDate = new Date(now.getTime() - ((daysAgo + daysBack) * 24 * 60 * 60 * 1000));

  return transactionsData
    .filter(t => {
      const transDate = new Date(t.date || t.created_at);
      return transDate <= startDate && transDate >= endDate && (t.type === 'income' || t.category === 'revenue');
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
}

// Helper to calculate expenses for a specific period
function calculateExpensesForPeriod(transactionsData: any[], daysAgo: number, daysBack: number): number {
  if (!transactionsData) return 0;

  const now = new Date();
  const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const endDate = new Date(now.getTime() - ((daysAgo + daysBack) * 24 * 60 * 60 * 1000));

  return transactionsData
    .filter(t => {
      const transDate = new Date(t.date || t.created_at);
      return transDate <= startDate && transDate >= endDate && t.type === 'expense';
    })
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
}

// Helper to calculate marketing expenses
function calculateMarketingExpenses(transactionsData: any[]): number {
  if (!transactionsData) return 0;

  return transactionsData
    .filter(t => {
      const category = (t.category || '').toLowerCase();
      return t.type === 'expense' && (
        category.includes('marketing') ||
        category.includes('advertising') ||
        category.includes('ads') ||
        category.includes('promotion')
      );
    })
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
}

// Create benchmark comparisons
function createBenchmarkComparisons(actualMetrics: any, industryBenchmarks: any): any[] {
  const metrics = [];

  // Revenue Growth Rate
  const growthDiff = ((actualMetrics.revenueGrowthRate - industryBenchmarks.revenueGrowthRate) / industryBenchmarks.revenueGrowthRate) * 100;
  metrics.push({
    name: 'Revenue Growth Rate',
    yourValue: actualMetrics.revenueGrowthRate,
    industryAverage: industryBenchmarks.revenueGrowthRate,
    unit: '%',
    displayFormat: 'percentage',
    status: growthDiff > 10 ? 'above' : growthDiff < -10 ? 'below' : 'at-par',
    difference: growthDiff,
    icon: '📈'
  });

  // Profit Margin
  const profitDiff = ((actualMetrics.profitMargin - industryBenchmarks.profitMargin) / Math.abs(industryBenchmarks.profitMargin || 1)) * 100;
  metrics.push({
    name: 'Profit Margin',
    yourValue: actualMetrics.profitMargin,
    industryAverage: industryBenchmarks.profitMargin,
    unit: '%',
    displayFormat: 'percentage',
    status: profitDiff > 10 ? 'above' : profitDiff < -10 ? 'below' : 'at-par',
    difference: profitDiff,
    icon: '💰'
  });

  // Revenue Per Employee
  const revPerEmpDiff = ((actualMetrics.revenuePerEmployee - industryBenchmarks.revenuePerEmployee) / industryBenchmarks.revenuePerEmployee) * 100;
  metrics.push({
    name: 'Revenue Per Employee',
    yourValue: actualMetrics.revenuePerEmployee,
    industryAverage: industryBenchmarks.revenuePerEmployee,
    unit: '',
    displayFormat: 'currency',
    status: revPerEmpDiff > 10 ? 'above' : revPerEmpDiff < -10 ? 'below' : 'at-par',
    difference: revPerEmpDiff,
    icon: '👤'
  });

  // Operating Expense Ratio (lower is better)
  const opexDiff = ((actualMetrics.operatingExpenseRatio - industryBenchmarks.operatingExpenseRatio) / industryBenchmarks.operatingExpenseRatio) * 100;
  metrics.push({
    name: 'Operating Expense Ratio',
    yourValue: actualMetrics.operatingExpenseRatio,
    industryAverage: industryBenchmarks.operatingExpenseRatio,
    unit: '%',
    displayFormat: 'percentage',
    status: opexDiff < -10 ? 'above' : opexDiff > 10 ? 'below' : 'at-par', // Inverted - lower is better
    difference: -opexDiff, // Inverted
    icon: '💸'
  });

  // Cash Runway
  const runwayDiff = ((actualMetrics.cashRunway - industryBenchmarks.cashRunway) / industryBenchmarks.cashRunway) * 100;
  metrics.push({
    name: 'Cash Runway',
    yourValue: actualMetrics.cashRunway,
    industryAverage: industryBenchmarks.cashRunway,
    unit: ' mo',
    displayFormat: 'number',
    status: runwayDiff > 10 ? 'above' : runwayDiff < -10 ? 'below' : 'at-par',
    difference: runwayDiff,
    icon: '⏱️'
  });

  return metrics;
}

// Determine overall ranking
function determineOverallRanking(metrics: any[]): string {
  // Count how many metrics are above/below average
  const aboveCount = metrics.filter(m => m.status === 'above').length;
  const belowCount = metrics.filter(m => m.status === 'below').length;

  const percentAbove = (aboveCount / metrics.length) * 100;

  if (percentAbove >= 70) {
    return 'top-quartile';
  } else if (percentAbove >= 50) {
    return 'above-average';
  } else if (percentAbove >= 30) {
    return 'average';
  } else {
    return 'below-average';
  }
}