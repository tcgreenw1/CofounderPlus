import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();
app.use('*', cors());

// Industry Match Quiz System
// This handles the sophisticated personality-industry matching system

// Quiz Questions Data - 16 questions covering BigFive, RIASEC, and constraints
const QUIZ_QUESTIONS = [
  // BigFive Questions
  {
    id: 'q1',
    prompt: 'I like pitching strangers and making cold calls',
    dimension: 'BigFive',
    subdimension: 'Extraversion',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q2', 
    prompt: 'I stay on task without supervision and meet deadlines consistently',
    dimension: 'BigFive',
    subdimension: 'Conscientiousness',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q3',
    prompt: 'Ambiguity and unclear situations stress me out',
    dimension: 'BigFive',
    subdimension: 'EmotionalStability',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: true // High score = low neuroticism = high emotional stability
  },
  {
    id: 'q4',
    prompt: 'I enjoy exploring new ideas and unconventional approaches',
    dimension: 'BigFive',
    subdimension: 'Openness',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  
  // RIASEC Questions
  {
    id: 'q5',
    prompt: 'I enjoy tinkering with tools or hardware',
    dimension: 'RIASEC',
    subdimension: 'Realistic',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q6',
    prompt: 'I enjoy long deep-work sessions at a computer',
    dimension: 'RIASEC',
    subdimension: 'Investigative',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q7',
    prompt: 'I would rather design than sell',
    dimension: 'RIASEC',
    subdimension: 'Artistic',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q8',
    prompt: 'I get energy from managing and developing people',
    dimension: 'RIASEC',
    subdimension: 'Social',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q9',
    prompt: 'I love improving processes and working with spreadsheets',
    dimension: 'RIASEC',
    subdimension: 'Conventional',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  {
    id: 'q10',
    prompt: 'I thrive on taking charge and driving business outcomes',
    dimension: 'RIASEC',
    subdimension: 'Enterprising',
    input_type: 'likert',
    min: 1,
    max: 5,
    reverse_scored: false
  },
  
  // Constraint Questions (single choice)
  {
    id: 'q11',
    prompt: 'How much cash can you realistically invest to start?',
    dimension: 'constraints',
    subdimension: 'capital',
    input_type: 'single_choice',
    options: ['<$200', '$200-$1k', '$1-5k', '$5-20k', '$20k+']
  },
  {
    id: 'q12',
    prompt: 'How many hours per week can you dedicate?',
    dimension: 'constraints',
    subdimension: 'hours',
    input_type: 'single_choice',
    options: ['5-10h', '10-20h', '20-40h', '40h+']
  },
  {
    id: 'q13',
    prompt: 'How comfortable are you with sales activities?',
    dimension: 'constraints',
    subdimension: 'sales_comfort',
    input_type: 'single_choice',
    options: ['hate it', 'tolerate', 'fine', 'love it']
  },
  {
    id: 'q14',
    prompt: 'What type of work environment do you prefer?',
    dimension: 'constraints',
    subdimension: 'hands_on',
    input_type: 'single_choice',
    options: ['desk only', 'light field', 'fine with field work']
  },
  {
    id: 'q15',
    prompt: 'What is your risk tolerance for business ventures?',
    dimension: 'constraints',
    subdimension: 'risk',
    input_type: 'single_choice',
    options: ['low', 'medium', 'high']
  },
  {
    id: 'q16',
    prompt: 'What is your realistic revenue goal in the first 90 days?',
    dimension: 'constraints',
    subdimension: 'revenue_goal',
    input_type: 'single_choice',
    options: ['$500', '$2k', '$5k', '$10k+']
  }
];

// Industry categories and default weights
const INDUSTRY_CATEGORIES = {
  'E-commerce & Retail': {
    w_bigfive: { C: 0.6, Ex: 0.6, O: 0.6, S: 0.6 },
    w_riasec: { R: 0.1, I: 0.4, A: 0.5, S: 0.4, E: 0.8, C: 0.6 }
  },
  'Service-Based Business': {
    w_bigfive: { C: 0.6, Ex: 0.5, O: 0.4, S: 0.7 },
    w_riasec: { R: 0.3, I: 0.3, A: 0.2, S: 0.6, E: 0.6, C: 0.5 }
  },
  'Technology & Software': {
    w_bigfive: { C: 0.7, Ex: 0.4, O: 0.7, S: 0.6 },
    w_riasec: { R: 0.2, I: 0.8, A: 0.3, S: 0.3, E: 0.5, C: 0.6 }
  },
  'Professional Services': {
    w_bigfive: { C: 0.7, Ex: 0.5, O: 0.5, S: 0.7 },
    w_riasec: { R: 0.2, I: 0.5, A: 0.4, S: 0.6, E: 0.6, C: 0.7 }
  },
  'Manufacturing': {
    w_bigfive: { C: 0.7, Ex: 0.4, O: 0.5, S: 0.7 },
    w_riasec: { R: 0.6, I: 0.5, A: 0.2, S: 0.3, E: 0.5, C: 0.6 }
  },
  'Wholesale & Distribution': {
    w_bigfive: { C: 0.7, Ex: 0.6, O: 0.4, S: 0.6 },
    w_riasec: { R: 0.3, I: 0.4, A: 0.3, S: 0.4, E: 0.7, C: 0.7 }
  },
  'Retail & Dealerships': {
    w_bigfive: { C: 0.6, Ex: 0.7, O: 0.4, S: 0.6 },
    w_riasec: { R: 0.2, I: 0.3, A: 0.3, S: 0.5, E: 0.8, C: 0.6 }
  }
};

// Comprehensive industry list - expanded for better matching
const INDUSTRY_SEED_DATA = [
  // E-commerce & Retail
  { slug: 'content-creation-social-media', name: 'Content Creation - Social media, influencer, creator economy', category: 'E-commerce & Retail' },
  { slug: 'dropshipping-ecommerce', name: 'Dropshipping E-commerce - Online store, retail, Shopify', category: 'E-commerce & Retail' },
  { slug: 'beauty-wellness', name: 'Beauty & Wellness - Skincare, cosmetics, wellness products', category: 'E-commerce & Retail' },
  { slug: 'jewelry-luxury', name: 'Jewelry & Luxury - High-end accessories, luxury goods', category: 'E-commerce & Retail' },
  { slug: 'subscription-box', name: 'Subscription Box - Monthly curated product delivery', category: 'E-commerce & Retail' },
  { slug: 'subscription-commerce', name: 'Subscription Commerce - Recurring revenue, membership business', category: 'E-commerce & Retail' },
  { slug: 'fashion-wholesale', name: 'Fashion Wholesale - Clothing, apparel distribution', category: 'E-commerce & Retail' },
  { slug: 'print-on-demand', name: 'Print on Demand - Custom printing business', category: 'E-commerce & Retail' },
  { slug: 'digital-products', name: 'Digital Products - Online courses, templates, software', category: 'E-commerce & Retail' },
  { slug: 'affiliate-marketing', name: 'Affiliate Marketing - Commission-based product promotion', category: 'E-commerce & Retail' },

  // Service-Based Business
  { slug: 'food-truck', name: 'Food Truck - Mobile food service', category: 'Service-Based Business' },
  { slug: 'real-estate', name: 'Real Estate - Property investment, development', category: 'Service-Based Business' },
  { slug: 'automotive-mobile', name: 'Automotive Mobile - Mobile car services', category: 'Service-Based Business' },
  { slug: 'pet-grooming', name: 'Pet Grooming - Animal care services', category: 'Service-Based Business' },
  { slug: 'courier-logistics', name: 'Courier & Logistics - Delivery, transportation', category: 'Service-Based Business' },
  { slug: 'airbnb-cohost', name: 'Airbnb Co-host - Short-term rental management', category: 'Service-Based Business' },
  { slug: 'online-tutoring', name: 'Online Tutoring - Educational services', category: 'Service-Based Business' },
  { slug: 'equipment-rental', name: 'Equipment Rental - Tool and equipment leasing', category: 'Service-Based Business' },
  { slug: 'security-patrol', name: 'Security Patrol - Security services', category: 'Service-Based Business' },
  { slug: 'solar-sales', name: 'Solar Sales - Renewable energy sales', category: 'Service-Based Business' },
  { slug: 'insurance-agency', name: 'Insurance Agency - Insurance brokerage', category: 'Service-Based Business' },
  { slug: 'va-remote-support', name: 'VA Remote Support - Virtual assistant services', category: 'Service-Based Business' },
  { slug: 'cleaning-services', name: 'Cleaning Services - Residential and commercial cleaning', category: 'Service-Based Business' },
  { slug: 'landscaping', name: 'Landscaping - Yard care and maintenance', category: 'Service-Based Business' },
  { slug: 'personal-training', name: 'Personal Training - Fitness coaching', category: 'Service-Based Business' },
  { slug: 'event-planning', name: 'Event Planning - Wedding and corporate events', category: 'Service-Based Business' },
  { slug: 'photography', name: 'Photography - Wedding, portrait, commercial', category: 'Service-Based Business' },
  { slug: 'catering', name: 'Catering - Event food service', category: 'Service-Based Business' },
  { slug: 'home-renovation', name: 'Home Renovation - Construction and remodeling', category: 'Service-Based Business' },
  { slug: 'consulting-general', name: 'General Consulting - Business advisory services', category: 'Service-Based Business' },

  // Technology & Software
  { slug: 'it-msp', name: 'IT MSP - Managed service provider', category: 'Technology & Software' },
  { slug: 'mobile-app-development', name: 'Mobile App Development - iOS, Android development', category: 'Technology & Software' },
  { slug: 'saas-var', name: 'SAAS VAR - Software reseller, value-added reseller', category: 'Technology & Software' },
  { slug: 'web-development', name: 'Web Development - Website and web app creation', category: 'Technology & Software' },
  { slug: 'software-consulting', name: 'Software Consulting - Technical advisory services', category: 'Technology & Software' },
  { slug: 'cybersecurity', name: 'Cybersecurity - Information security services', category: 'Technology & Software' },
  { slug: 'data-analytics', name: 'Data Analytics - Business intelligence services', category: 'Technology & Software' },
  { slug: 'ai-automation', name: 'AI Automation - Process automation solutions', category: 'Technology & Software' },

  // Professional Services
  { slug: 'smma-lite', name: 'SMMA Lite - Social media marketing agency', category: 'Professional Services' },
  { slug: 'bookkeeping-tax', name: 'Bookkeeping & Tax - Accounting services', category: 'Professional Services' },
  { slug: 'legal-document', name: 'Legal Document - Legal services, documentation', category: 'Professional Services' },
  { slug: 'government-b2g', name: 'Government B2G - Government contracting', category: 'Professional Services' },
  { slug: 'fractional-operator', name: 'Fractional Operator - Part-time executive services', category: 'Professional Services' },
  { slug: 'online-course-creator', name: 'Online Course Creator - E-learning, digital education', category: 'Professional Services' },
  { slug: 'marketing-agency', name: 'Marketing Agency - Digital marketing services', category: 'Professional Services' },
  { slug: 'copywriting', name: 'Copywriting - Content and marketing writing', category: 'Professional Services' },
  { slug: 'graphic-design', name: 'Graphic Design - Visual design services', category: 'Professional Services' },
  { slug: 'financial-planning', name: 'Financial Planning - Investment and financial advisory', category: 'Professional Services' },
  { slug: 'hr-consulting', name: 'HR Consulting - Human resources advisory', category: 'Professional Services' },
  { slug: 'translation-services', name: 'Translation Services - Language translation', category: 'Professional Services' },

  // Manufacturing (basic options)
  { slug: 'handmade-crafts', name: 'Handmade Crafts - Artisan products', category: 'Manufacturing' },
  { slug: 'food-production', name: 'Food Production - Small batch food manufacturing', category: 'Manufacturing' },
  { slug: '3d-printing', name: '3D Printing - Custom manufacturing services', category: 'Manufacturing' },

  // Wholesale & Distribution  
  { slug: 'import-export', name: 'Import Export - International trade', category: 'Wholesale & Distribution' },
  { slug: 'wholesale-products', name: 'Wholesale Products - Bulk product distribution', category: 'Wholesale & Distribution' },

  // Retail & Dealerships
  { slug: 'retail-store', name: 'Retail Store - Physical retail location', category: 'Retail & Dealerships' },
  { slug: 'franchise', name: 'Franchise - Licensed business model', category: 'Retail & Dealerships' }
];

// Helper functions to get default industry values by category
const getDefaultMinCapital = (category: string): number => {
  const capitalDefaults: { [key: string]: number } = {
    'E-commerce & Retail': 1000,
    'Service-Based Business': 500,
    'Technology & Software': 2000,
    'Professional Services': 1500,
    'Manufacturing': 5000,
    'Wholesale & Distribution': 3000,
    'Retail & Dealerships': 2000
  };
  return capitalDefaults[category] || 1000;
};

const getDefaultMinHours = (category: string): number => {
  const hoursDefaults: { [key: string]: number } = {
    'E-commerce & Retail': 15,
    'Service-Based Business': 20,
    'Technology & Software': 30,
    'Professional Services': 25,
    'Manufacturing': 35,
    'Wholesale & Distribution': 30,
    'Retail & Dealerships': 25
  };
  return hoursDefaults[category] || 20;
};

const getDefaultSalesLevel = (category: string): string => {
  const salesDefaults: { [key: string]: string } = {
    'E-commerce & Retail': 'med',
    'Service-Based Business': 'high',
    'Technology & Software': 'med',
    'Professional Services': 'high',
    'Manufacturing': 'low',
    'Wholesale & Distribution': 'high',
    'Retail & Dealerships': 'high'
  };
  return salesDefaults[category] || 'med';
};

const getDefaultHandsOn = (category: string): string => {
  const handsOnDefaults: { [key: string]: string } = {
    'E-commerce & Retail': 'desk',
    'Service-Based Business': 'light_field',
    'Technology & Software': 'desk',
    'Professional Services': 'desk',
    'Manufacturing': 'field',
    'Wholesale & Distribution': 'light_field',
    'Retail & Dealerships': 'light_field'
  };
  return handsOnDefaults[category] || 'desk';
};

// Calculate constraints fit score with better error handling
const calculateConstraintsFit = (industry: any, userConstraints: any): number => {
  try {
    const scores: number[] = [];
    
    // Capital fit with fallback
    const capitalMap: { [key: string]: number } = { '<$200': 200, '$200-$1k': 1000, '$1-5k': 5000, '$5-20k': 20000, '$20k+': 50000 };
    const userCapital = capitalMap[userConstraints.capital] || 1000; // Default to $1k if missing
    const industryCapital = industry.min_capital || 500; // Default min capital
    const capitalOk = userCapital >= industryCapital ? 1 : 0;
    
    if (capitalOk === 0) {
      console.log(`💰 Capital constraint failed: user=${userCapital}, industry=${industryCapital} for ${industry.name}`);
      return 0; // Hard gate
    }
    scores.push(1);
    
    // Hours fit with fallback
    const hoursMap: { [key: string]: number } = { '5-10h': 7.5, '10-20h': 15, '20-40h': 30, '40h+': 50 };
    const userHours = hoursMap[userConstraints.hours] || 20; // Default to 20h if missing
    const industryHours = industry.hours_min_per_week || 15; // Default min hours
    const hoursOk = userHours >= industryHours ? 1 : 0;
    
    if (hoursOk === 0) {
      console.log(`⏰ Hours constraint failed: user=${userHours}, industry=${industryHours} for ${industry.name}`);
      return 0; // Hard gate
    }
    scores.push(1);
    
    // Sales fit - softer constraint
    const salesComfortMap: { [key: string]: number } = { 'hate it': 0, 'tolerate': 0.33, 'fine': 0.66, 'love it': 1 };
    const salesLevelMap: { [key: string]: number } = { 'low': 0.2, 'med': 0.5, 'high': 0.8 };
    const userSales = salesComfortMap[userConstraints.sales_comfort] || 0.5; // Default to neutral
    const requiredSales = salesLevelMap[industry.sales_level] || 0.5; // Default to medium
    const salesFit = Math.max(0.1, 1 - Math.max(0, requiredSales - userSales)); // Minimum 0.1 fit
    scores.push(salesFit);
    
    // Hands-on fit - softer constraint
    const handsOnMap: { [key: string]: number } = { 'desk only': 0, 'light field': 1, 'fine with field work': 2 };
    const industryHandsOnMap: { [key: string]: number } = { 'desk': 0, 'light_field': 1, 'field': 2 };
    const userHandsOn = handsOnMap[userConstraints.hands_on] || 1; // Default to light field
    const industryHandsOn = industryHandsOnMap[industry.hands_on] || 0; // Default to desk
    const handsonDiff = Math.abs(userHandsOn - industryHandsOn);
    const handsOnFit = handsonDiff === 0 ? 1 : handsonDiff === 1 ? 0.7 : 0.4; // More lenient
    scores.push(handsOnFit);
    
    // Geography fit (assume all remote-friendly for v1)
    scores.push(1);
    
    const result = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.max(0, Math.min(1, result)); // Ensure 0-1 range
  } catch (error: any) {
    console.error('❌ Error in calculateConstraintsFit:', error);
    return 0.5; // Return neutral fit on error
  }
};

// Calculate trait vectors from quiz responses with error handling
const calculateTraitVectors = (responses: any[]): { bigfive: any, riasec: any } => {
  try {
    const bigfive = { C: 0, Ex: 0, O: 0, S: 0 };
    const riasec = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    
    const counts = { 
      bigfive: { C: 0, Ex: 0, O: 0, S: 0 },
      riasec: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
    };
    
    responses.forEach(response => {
      try {
        const question = QUIZ_QUESTIONS.find(q => q.id === response.question_id);
        if (!question) {
          console.warn('⚠️ Question not found for response:', response.question_id);
          return;
        }
        
        if (question.dimension === 'BigFive') {
          const subdim = question.subdimension as keyof typeof bigfive;
          let score = Number(response.value);
          
          if (isNaN(score) || score < 1 || score > 5) {
            console.warn('⚠️ Invalid BigFive score:', score, 'for question:', question.id);
            return;
          }
          
          if (question.reverse_scored) score = 6 - score; // Reverse 1-5 scale
          
          bigfive[subdim] += (score - 1) / 4; // Normalize to 0-1
          counts.bigfive[subdim]++;
        } else if (question.dimension === 'RIASEC') {
          const subdim = question.subdimension as keyof typeof riasec;
          const score = Number(response.value);
          
          if (isNaN(score) || score < 1 || score > 5) {
            console.warn('⚠️ Invalid RIASEC score:', score, 'for question:', question.id);
            return;
          }
          
          riasec[subdim] += (score - 1) / 4; // Normalize to 0-1
          counts.riasec[subdim]++;
        }
      } catch (responseError: any) {
        console.error('❌ Error processing response:', response, responseError);
      }
    });
    
    // Average by count with fallbacks
    Object.keys(bigfive).forEach(key => {
      const k = key as keyof typeof bigfive;
      if (counts.bigfive[k] > 0) {
        bigfive[k] /= counts.bigfive[k];
      } else {
        bigfive[k] = 0.5; // Default to neutral if no responses
      }
    });
    
    Object.keys(riasec).forEach(key => {
      const k = key as keyof typeof riasec;
      if (counts.riasec[k] > 0) {
        riasec[k] /= counts.riasec[k];
      } else {
        riasec[k] = 0.5; // Default to neutral if no responses
      }
    });
    
    console.log('📊 Trait calculation summary:', {
      bigfive_counts: counts.bigfive,
      riasec_counts: counts.riasec,
      bigfive_scores: bigfive,
      riasec_scores: riasec
    });
    
    return { bigfive, riasec };
  } catch (error: any) {
    console.error('❌ Error in calculateTraitVectors:', error);
    // Return neutral scores on error
    return { 
      bigfive: { C: 0.5, Ex: 0.5, O: 0.5, S: 0.5 },
      riasec: { R: 0.5, I: 0.5, A: 0.5, S: 0.5, E: 0.5, C: 0.5 }
    };
  }
};

// Calculate dot product of two vectors
const dotProduct = (a: any, b: any): number => {
  let sum = 0;
  let count = 0;
  
  Object.keys(a).forEach(key => {
    if (b[key] !== undefined) {
      sum += a[key] * b[key];
      count++;
    }
  });
  
  return count > 0 ? sum / count : 0;
};

// Calculate industry score using the specified formula
const calculateIndustryScore = (userTraits: any, industry: any, constraintsFit: number): number => {
  const weights = industry.weights;
  if (!weights) return 0;
  
  const bigfiveScore = dotProduct(userTraits.bigfive, weights.w_bigfive);
  const riasecScore = dotProduct(userTraits.riasec, weights.w_riasec);
  const marketScore = industry.market_simple || 0.5;
  
  return (0.35 * bigfiveScore) + (0.35 * riasecScore) + (0.20 * constraintsFit) + (0.10 * marketScore);
};

// Generate reasons for why an industry fits
const generateReasons = (userTraits: any, industry: any, responses: any[]): string[] => {
  const reasons: string[] = [];
  const weights = industry.weights;
  
  if (!weights) return reasons;
  
  // Check strongest BigFive matches
  Object.entries(weights.w_bigfive).forEach(([trait, weight]: [string, any]) => {
    const userScore = userTraits.bigfive[trait] || 0;
    const strength = userScore * weight;
    
    if (strength > 0.4) {
      const traitNames: { [key: string]: string } = {
        'C': 'conscientiousness',
        'Ex': 'extraversion', 
        'O': 'openness',
        'S': 'emotional stability'
      };
      reasons.push(`Your ${traitNames[trait]} aligns well with this industry's demands`);
    }
  });
  
  // Check strongest RIASEC matches
  Object.entries(weights.w_riasec).forEach(([trait, weight]: [string, any]) => {
    const userScore = userTraits.riasec[trait] || 0;
    const strength = userScore * weight;
    
    if (strength > 0.4) {
      const traitNames: { [key: string]: string } = {
        'R': 'realistic/hands-on interests',
        'I': 'investigative/analytical interests',
        'A': 'artistic/creative interests',
        'S': 'social/people-focused interests', 
        'E': 'enterprising/business interests',
        'C': 'conventional/systematic interests'
      };
      reasons.push(`Your ${traitNames[trait]} match this field perfectly`);
    }
  });
  
  // Add constraint-based reasons
  const constraintResponses = responses.filter(r => {
    const q = QUIZ_QUESTIONS.find(question => question.id === r.question_id);
    return q && q.dimension === 'constraints';
  });
  
  constraintResponses.forEach(response => {
    const question = QUIZ_QUESTIONS.find(q => q.id === response.question_id);
    if (!question) return;
    
    if (question.subdimension === 'capital' && response.value !== '<$200') {
      reasons.push('Your available capital fits this business model');
    }
    if (question.subdimension === 'hours' && response.value !== '5-10h') {
      reasons.push('Your time commitment matches what this industry requires');
    }
    if (question.subdimension === 'sales_comfort' && ['fine', 'love it'].includes(response.value) && industry.sales_level === 'high') {
      reasons.push('Your comfort with sales activities suits this sales-focused industry');
    }
  });
  
  return reasons.slice(0, 6); // Limit to 6 reasons
};

// Routes

// Get quiz questions
app.get('/make-server-ac1075a9/quiz/questions', async (c) => {
  try {
    console.log('📝 Getting quiz questions...');
    return c.json({ questions: QUIZ_QUESTIONS });
  } catch (error: any) {
    console.error('❌ Error getting quiz questions:', error);
    return c.json({ error: 'Failed to get quiz questions', details: error.message }, 500);
  }
});

// Save quiz response
app.post('/make-server-ac1075a9/quiz/response', async (c) => {
  try {
    const { user_id, business_id, question_id, value } = await c.req.json();
    
    console.log('💾 Saving quiz response:', { user_id, business_id, question_id, value });
    
    // Store response with business context
    const key = `quiz_response_${user_id}_${business_id}_${question_id}`;
    const responseData = {
      user_id,
      business_id,
      question_id,
      value,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(key, JSON.stringify(responseData));
    
    // Also store in session for easy retrieval
    const sessionKey = `quiz_session_${user_id}_${business_id}`;
    const existingSession = await kv.get(sessionKey);
    let responses = [];
    
    if (existingSession) {
      responses = JSON.parse(existingSession);
    }
    
    // Update or add response
    const existingIndex = responses.findIndex((r: any) => r.question_id === question_id);
    if (existingIndex >= 0) {
      responses[existingIndex] = responseData;
    } else {
      responses.push(responseData);
    }
    
    await kv.set(sessionKey, JSON.stringify(responses));
    
    return c.json({ success: true, response: responseData });
  } catch (error: any) {
    console.error('❌ Error saving quiz response:', error);
    return c.json({ error: 'Failed to save response', details: error.message }, 500);
  }
});

// Calculate industry scores and recommendations - FIXED VERSION
app.post('/make-server-ac1075a9/quiz/calculate', async (c) => {
  try {
    console.log('🧮 Starting quiz calculation...');
    
    const requestBody = await c.req.json();
    const { user_id, business_id } = requestBody;
    
    console.log('🧮 Calculating industry scores for user:', user_id, 'business:', business_id);
    
    if (!user_id || !business_id) {
      console.error('❌ Missing required parameters:', { user_id, business_id });
      return c.json({ error: 'Missing user_id or business_id' }, 400);
    }
    
    // Get user responses
    const sessionKey = `quiz_session_${user_id}_${business_id}`;
    console.log('🔍 Looking for responses with key:', sessionKey);
    
    const responsesData = await kv.get(sessionKey);
    
    if (!responsesData) {
      console.error('❌ No quiz responses found for key:', sessionKey);
      
      // Check if individual responses exist (debugging)
      console.log('🔍 Checking for individual response keys...');
      let foundIndividualResponses = 0;
      for (const question of QUIZ_QUESTIONS) {
        const responseKey = `quiz_response_${user_id}_${business_id}_${question.id}`;
        const individualResponse = await kv.get(responseKey);
        if (individualResponse) {
          foundIndividualResponses++;
          console.log(`✓ Found individual response for ${question.id}`);
        }
      }
      
      console.log(`📊 Found ${foundIndividualResponses} individual responses but no session data`);
      
      if (foundIndividualResponses > 0) {
        // Try to rebuild session from individual responses
        console.log('🔧 Attempting to rebuild session from individual responses...');
        const rebuiltResponses = [];
        for (const question of QUIZ_QUESTIONS) {
          const responseKey = `quiz_response_${user_id}_${business_id}_${question.id}`;
          const individualResponseData = await kv.get(responseKey);
          if (individualResponseData) {
            try {
              const parsedResponse = JSON.parse(individualResponseData);
              rebuiltResponses.push(parsedResponse);
            } catch (parseError) {
              console.warn(`Failed to parse individual response for ${question.id}:`, parseError);
            }
          }
        }
        
        if (rebuiltResponses.length > 0) {
          console.log(`✅ Rebuilt ${rebuiltResponses.length} responses, continuing with calculation...`);
          // Store the rebuilt session for future use
          await kv.set(sessionKey, JSON.stringify(rebuiltResponses));
          // Continue with calculation using rebuilt responses
          responses = rebuiltResponses;
        } else {
          return c.json({ 
            error: 'No quiz responses found', 
            debug: { 
              sessionKey, 
              individualResponsesFound: foundIndividualResponses,
              message: 'Session data missing and could not rebuild from individual responses' 
            } 
          }, 404);
        }
      } else {
        return c.json({ 
          error: 'No quiz responses found', 
          debug: { 
            sessionKey, 
            individualResponsesFound: 0,
            message: 'No session data or individual responses found' 
          } 
        }, 404);
      }
    } else {
      // Parse existing session data
      try {
        responses = JSON.parse(responsesData);
      } catch (parseError: any) {
        console.error('❌ Error parsing responses data:', parseError);
        return c.json({ error: 'Invalid response data format' }, 400);
      }
    }
    
    console.log('📊 Found', responses.length, 'responses');
    
    if (responses.length === 0) {
      console.error('❌ Empty responses array');
      return c.json({ error: 'No responses to analyze' }, 400);
    }
    
    // Calculate trait vectors
    console.log('🧠 Calculating trait vectors...');
    const userTraits = calculateTraitVectors(responses);
    console.log('🧠 User traits calculated:', userTraits);
    
    // Get constraint responses
    console.log('🔧 Extracting constraint responses...');
    const constraintResponses: { [key: string]: string } = {};
    responses.forEach((r: any) => {
      const question = QUIZ_QUESTIONS.find(q => q.id === r.question_id);
      if (question && question.dimension === 'constraints') {
        constraintResponses[question.subdimension] = r.value;
      }
    });
    
    console.log('🔧 Constraint responses:', constraintResponses);
    
    // Score all industries
    console.log('🏭 Scoring', INDUSTRY_SEED_DATA.length, 'industries...');
    const industryScores: any[] = [];
    const skippedIndustries: any[] = [];
    
    for (const industryData of INDUSTRY_SEED_DATA) {
      try {
        // Create industry object with default values
        const industry = {
          ...industryData,
          min_capital: getDefaultMinCapital(industryData.category),
          hours_min_per_week: getDefaultMinHours(industryData.category),
          sales_level: getDefaultSalesLevel(industryData.category),
          hands_on: getDefaultHandsOn(industryData.category),
          remote_friendly: true,
          market_simple: 0.5,
          weights: INDUSTRY_CATEGORIES[industryData.category] || INDUSTRY_CATEGORIES['Service-Based Business'],
          active: true,
          ramp_weeks: 4
        };
        
        // Calculate constraints fit
        const constraintsFit = calculateConstraintsFit(industry, constraintResponses);
        
        // Skip if hard constraints failed (score = 0)
        if (constraintsFit === 0) {
          skippedIndustries.push({
            industry: industry.name,
            reason: 'Failed hard constraints (capital or time)'
          });
          continue;
        }
        
        // Calculate industry score
        const score = calculateIndustryScore(userTraits, industry, constraintsFit);
        
        // Generate reasons
        const reasons = generateReasons(userTraits, industry, responses);
        
        industryScores.push({
          industry_slug: industry.slug,
          industry_name: industry.name,
          category: industry.category,
          score: score,
          constraints_fit: constraintsFit,
          bigfive_score: dotProduct(userTraits.bigfive, industry.weights.w_bigfive),
          riasec_score: dotProduct(userTraits.riasec, industry.weights.w_riasec),
          market_score: industry.market_simple,
          reasons: reasons,
          min_capital: industry.min_capital,
          hours_min_per_week: industry.hours_min_per_week,
          sales_level: industry.sales_level,
          hands_on: industry.hands_on
        });
        
      } catch (industryError: any) {
        console.error(`❌ Error scoring industry ${industryData.name}:`, industryError);
        skippedIndustries.push({
          industry: industryData.name,
          reason: `Error: ${industryError.message}`
        });
      }
    }
    
    console.log('📈 Scored', industryScores.length, 'industries, skipped', skippedIndustries.length);
    
    if (industryScores.length === 0) {
      console.error('❌ No industries passed constraints!');
      return c.json({ 
        error: 'No industries match your constraints',
        skipped: skippedIndustries,
        suggestions: ['Consider increasing your capital budget', 'Consider increasing your time commitment', 'Check your constraint responses']
      }, 400);
    }
    
    // Sort by score and get top 3
    industryScores.sort((a, b) => b.score - a.score);
    const top3 = industryScores.slice(0, 3);
    
    console.log('🥇 Top 3 industries:', top3.map(i => ({ name: i.industry_name, score: i.score })));
    
    // Store results
    const resultsKey = `quiz_results_${user_id}_${business_id}`;
    const results = {
      user_id,
      business_id,
      top3,
      traits: userTraits,
      total_scored: industryScores.length,
      total_skipped: skippedIndustries.length,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(resultsKey, JSON.stringify(results));
    console.log('💾 Results saved to:', resultsKey);
    
    return c.json(results);
    
  } catch (error: any) {
    console.error('❌ Critical error in quiz calculation:', error);
    console.error('Stack trace:', error.stack);
    return c.json({ 
      error: 'Failed to calculate results', 
      details: error.message,
      stack: error.stack 
    }, 500);
  }
});

// Get existing quiz responses
app.get('/make-server-ac1075a9/quiz/responses/:user_id/:business_id', async (c) => {
  try {
    const { user_id, business_id } = c.req.param();
    
    console.log('📖 Getting responses for:', user_id, business_id);
    
    const sessionKey = `quiz_session_${user_id}_${business_id}`;
    const responsesData = await kv.get(sessionKey);
    
    if (!responsesData) {
      return c.json({ responses: [] });
    }
    
    const responses = JSON.parse(responsesData);
    return c.json({ responses });
    
  } catch (error: any) {
    console.error('❌ Error getting responses:', error);
    return c.json({ error: 'Failed to get responses', details: error.message }, 500);
  }
});

// Get quiz recommendations
app.get('/make-server-ac1075a9/quiz/recommendations/:user_id/:business_id', async (c) => {
  try {
    const { user_id, business_id } = c.req.param();
    
    console.log('📊 Getting recommendations for:', user_id, business_id);
    
    const resultsKey = `quiz_results_${user_id}_${business_id}`;
    const resultsData = await kv.get(resultsKey);
    
    if (!resultsData) {
      return c.json({ error: 'No results found' }, 404);
    }
    
    const results = JSON.parse(resultsData);
    return c.json(results);
    
  } catch (error: any) {
    console.error('❌ Error getting recommendations:', error);
    return c.json({ error: 'Failed to get recommendations', details: error.message }, 500);
  }
});

// Clear quiz session (for retakes)
app.delete('/make-server-ac1075a9/quiz/session/:user_id/:business_id', async (c) => {
  try {
    const { user_id, business_id } = c.req.param();
    
    console.log('🗑️ Clearing quiz session for:', user_id, business_id);
    
    const sessionKey = `quiz_session_${user_id}_${business_id}`;
    const resultsKey = `quiz_results_${user_id}_${business_id}`;
    
    // Clear both session and results
    await kv.del(sessionKey);
    await kv.del(resultsKey);
    
    // Also clear individual response keys
    for (const question of QUIZ_QUESTIONS) {
      const responseKey = `quiz_response_${user_id}_${business_id}_${question.id}`;
      await kv.del(responseKey);
    }
    
    return c.json({ success: true, message: 'Quiz session cleared' });
    
  } catch (error: any) {
    console.error('❌ Error clearing quiz session:', error);
    return c.json({ error: 'Failed to clear session', details: error.message }, 500);
  }
});

// Email quiz results (placeholder - would need email service integration)
app.post('/make-server-ac1075a9/quiz/email-results', async (c) => {
  try {
    const { user_id, business_id, email, top3 } = await c.req.json();
    
    console.log('📧 Email results request for:', user_id, 'to:', email);
    
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, just log and return success
    console.log('📧 Would email results for industries:', top3?.map((i: any) => i.industry_name));
    
    return c.json({ success: true, message: 'Results would be emailed' });
    
  } catch (error: any) {
    console.error('❌ Error emailing results:', error);
    return c.json({ error: 'Failed to email results', details: error.message }, 500);
  }
});

export default app;