import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, ArrowRight, Sparkles, TrendingUp, Clock, Users, CheckCircle2, X, Info, Tag, Briefcase, Target, DollarSign, Star } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Separator } from './ui/separator';
import { useIsMobile } from './ui/use-mobile';
import { ROADMAP_INDUSTRIES, INDUSTRY_CATEGORIES, TOTAL_INDUSTRY_COUNT } from '../utils/industryData';

interface IndustrySelectorProps {
  onSelect: (industryId: string, industryTitle: string) => void;
  selectedIndustry?: string;
  disabled?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
  maxHeight?: string;
}

interface IndustryItem {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  timeToRevenue: string;
  searchTerms: string[];
  aliases?: string[];
  relatedIndustries?: string[];
  commonTools?: string[];
  skillsRequired?: string[];
  targetMarkets?: string[];
  revenueStreams?: string[];
  startupCosts?: string;
  marketSize?: string;
  competitionLevel?: string;
  successFactors?: string[];
  popularNiches?: string[];
  workStyle?: string[];
}

interface SearchResult {
  industry: IndustryItem;
  score: number;
  matches: string[];
}

// Enhanced industry reference data for comprehensive search
const INDUSTRY_REFERENCE_DATA: Record<string, {
  aliases: string[];
  relatedIndustries: string[];
  commonTools: string[];
  skillsRequired: string[];
  targetMarkets: string[];
  revenueStreams: string[];
  startupCosts: string;
  marketSize: string;
  competitionLevel: string;
  successFactors: string[];
  popularNiches: string[];
  workStyle: string[];
}> = {
  'content-creation': {
    aliases: ['influencer', 'creator', 'social media', 'youtuber', 'blogger', 'podcaster', 'tiktoker', 'instagrammer'],
    relatedIndustries: ['digital marketing', 'online education', 'e-commerce', 'affiliate marketing', 'brand partnerships'],
    commonTools: ['Canva', 'Adobe Creative Suite', 'Final Cut Pro', 'OBS Studio', 'Buffer', 'Hootsuite'],
    skillsRequired: ['Video editing', 'Photography', 'Writing', 'Social media strategy', 'SEO', 'Brand building'],
    targetMarkets: ['Gen Z', 'Millennials', 'Small businesses', 'Personal brands', 'E-commerce brands'],
    revenueStreams: ['Sponsorships', 'Affiliate marketing', 'Digital products', 'Courses', 'Membership sites'],
    startupCosts: 'Low ($500 - $2,000)',
    marketSize: 'Large ($100B+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Consistent posting', 'Audience engagement', 'Niche expertise', 'Quality content'],
    popularNiches: ['Business', 'Lifestyle', 'Tech', 'Gaming', 'Fashion', 'Food', 'Travel', 'Education'],
    workStyle: ['Remote', 'Flexible hours', 'Creative work', 'Solo or small team']
  },
  'dropshipping-ecommerce': {
    aliases: ['ecom', 'online store', 'retail', 'shopify', 'amazon fba', 'print on demand'],
    relatedIndustries: ['digital marketing', 'logistics', 'customer service', 'inventory management'],
    commonTools: ['Shopify', 'WooCommerce', 'Oberlo', 'AliExpress', 'Facebook Ads', 'Google Ads'],
    skillsRequired: ['Digital marketing', 'Product research', 'Customer service', 'Analytics', 'Supply chain'],
    targetMarkets: ['Online shoppers', 'Millennials', 'Gen Z', 'Impulse buyers', 'Niche communities'],
    revenueStreams: ['Product markup', 'Upsells', 'Cross-sells', 'Subscription boxes', 'Private labeling'],
    startupCosts: 'Low-Medium ($1,000 - $5,000)',
    marketSize: 'Massive ($5T+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Product selection', 'Marketing efficiency', 'Customer service', 'Supply chain reliability'],
    popularNiches: ['Home & Garden', 'Health & Beauty', 'Tech gadgets', 'Pet supplies', 'Fashion accessories'],
    workStyle: ['Remote', 'Scalable', 'Data-driven', 'Fast-paced']
  },
  'smma-lite': {
    aliases: ['social media marketing', 'digital marketing agency', 'facebook ads', 'social media management'],
    relatedIndustries: ['content creation', 'advertising', 'digital services', 'consulting'],
    commonTools: ['Facebook Ads Manager', 'Social media schedulers', 'Analytics tools', 'Creative tools'],
    skillsRequired: ['Digital marketing', 'Social media', 'Client management', 'Analytics'],
    targetMarkets: ['Small businesses', 'Local businesses', 'E-commerce stores', 'Service providers'],
    revenueStreams: ['Monthly retainers', 'Ad spend percentage', 'Setup fees', 'Performance bonuses'],
    startupCosts: 'Low ($500 - $2,000)',
    marketSize: 'Large ($50B+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Results delivery', 'Client communication', 'Platform expertise', 'Case studies'],
    popularNiches: ['Local services', 'E-commerce', 'Professional services', 'Fitness'],
    workStyle: ['Client-focused', 'Results-driven', 'Creative', 'Fast-paced']
  }
};

// Use the comprehensive industry data from industryData.ts (108 industries)
// This ensures the Edit Business modal shows all available roadmap industries
const SORTED_ROADMAP_INDUSTRIES: IndustryItem[] = ROADMAP_INDUSTRIES as unknown as IndustryItem[];

// Legacy hardcoded list - NO LONGER USED, keeping for reference only
const OLD_HARDCODED_INDUSTRIES_DEPRECATED = [
  // Technology & Software
  { 
    id: 'mobile-app-development-DEPRECATED', 
    title: 'Mobile App Development', 
    category: 'Technology & Software', 
    difficulty: 'intermediate', 
    timeToRevenue: '2-6 months', 
    searchTerms: ['app', 'mobile', 'ios', 'android', 'development', 'software'],
    aliases: ['app dev', 'ios development', 'android development', 'mobile development', 'software development'],
    commonTools: ['Xcode', 'Android Studio', 'React Native', 'Flutter', 'Firebase', 'Figma'],
    skillsRequired: ['Programming', 'UI/UX design', 'Database management', 'API integration', 'Testing'],
    targetMarkets: ['Startups', 'Small businesses', 'Enterprises', 'Entrepreneurs', 'Non-profits'],
    revenueStreams: ['Custom development', 'App maintenance', 'Consulting', 'Template sales'],
    startupCosts: 'Low-Medium ($2,000 - $10,000)',
    marketSize: 'Large ($200B+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Technical expertise', 'Portfolio quality', 'Client relationships', 'Market trends'],
    popularNiches: ['E-commerce apps', 'Social platforms', 'Business tools', 'Health & fitness', 'Education'],
    workStyle: ['Remote', 'Project-based', 'Technical', 'Collaborative']
  },
  { 
    id: 'it-msp', 
    title: 'IT MSP', 
    category: 'Technology & Software', 
    difficulty: 'advanced', 
    timeToRevenue: '3-6 months', 
    searchTerms: ['it', 'managed', 'service', 'provider', 'technology', 'support'],
    aliases: ['managed service provider', 'it services', 'tech support', 'msp'],
    commonTools: ['RMM tools', 'PSA software', 'Monitoring systems', 'Ticketing systems'],
    skillsRequired: ['Technical expertise', 'Customer service', 'Project management', 'Network administration'],
    targetMarkets: ['Small businesses', 'Medium enterprises', 'Professional offices', 'Healthcare practices'],
    revenueStreams: ['Monthly contracts', 'Project fees', 'Hardware sales', 'Emergency support'],
    startupCosts: 'Medium-High ($10,000 - $50,000)',
    marketSize: 'Large ($300B+ globally)',
    competitionLevel: 'High',
    successFactors: ['Technical expertise', 'Response time', 'Relationship building', 'Service quality'],
    popularNiches: ['Small business IT', 'Healthcare IT', 'Legal IT', 'Financial services'],
    workStyle: ['B2B focused', 'Technical', 'Relationship-based', 'Problem-solving']
  },

  // Content & Digital
  { 
    id: 'content-creation', 
    title: 'Content Creation & Digital Media', 
    category: 'Content & Digital', 
    difficulty: 'beginner', 
    timeToRevenue: '2-4 weeks', 
    searchTerms: ['content', 'creator', 'social', 'media', 'influencer', 'digital'],
    ...INDUSTRY_REFERENCE_DATA['content-creation']
  },
  { 
    id: 'online-course-creator', 
    title: 'Online Course Creator', 
    category: 'Content & Digital', 
    difficulty: 'beginner', 
    timeToRevenue: '4-8 weeks', 
    searchTerms: ['course', 'education', 'teaching', 'learning', 'online', 'training'],
    aliases: ['e-learning', 'online education', 'course creation', 'digital teaching', 'knowledge commerce'],
    commonTools: ['Teachable', 'Thinkific', 'Kajabi', 'Zoom', 'Loom', 'Canva', 'LMS platforms'],
    skillsRequired: ['Subject expertise', 'Video production', 'Curriculum design', 'Marketing', 'Student engagement'],
    targetMarkets: ['Professionals', 'Students', 'Career changers', 'Entrepreneurs', 'Skill seekers'],
    revenueStreams: ['Course sales', 'Coaching programs', 'Membership sites', 'Affiliate commissions'],
    startupCosts: 'Low ($500 - $3,000)',
    marketSize: 'Large ($350B+ globally)',
    competitionLevel: 'High',
    successFactors: ['Expertise credibility', 'Course quality', 'Marketing skills', 'Student success'],
    popularNiches: ['Business skills', 'Technology', 'Creative arts', 'Health & fitness', 'Personal development'],
    workStyle: ['Remote', 'Flexible', 'Content-focused', 'Community-driven']
  },

  // E-commerce & Retail
  { 
    id: 'dropshipping-ecommerce', 
    title: 'Dropshipping E-commerce', 
    category: 'E-commerce & Retail', 
    difficulty: 'beginner', 
    timeToRevenue: '2-6 weeks', 
    searchTerms: ['dropshipping', 'ecommerce', 'online', 'store', 'retail', 'shopify'],
    ...INDUSTRY_REFERENCE_DATA['dropshipping-ecommerce']
  },

  // Professional Services
  { 
    id: 'smma-lite', 
    title: 'SMMA Lite', 
    category: 'Professional Services', 
    difficulty: 'beginner', 
    timeToRevenue: '4-8 weeks', 
    searchTerms: ['smma', 'social', 'media', 'marketing', 'agency', 'advertising'],
    ...INDUSTRY_REFERENCE_DATA['smma-lite']
  },
  { 
    id: 'bookkeeping-tax', 
    title: 'Bookkeeping Tax', 
    category: 'Professional Services', 
    difficulty: 'intermediate', 
    timeToRevenue: '2-4 months', 
    searchTerms: ['bookkeeping', 'tax', 'accounting', 'financial', 'services'],
    aliases: ['accounting services', 'bookkeeper', 'tax preparation', 'financial services'],
    commonTools: ['QuickBooks', 'Xero', 'Tax software', 'Banking tools', 'Receipt tracking'],
    skillsRequired: ['Accounting knowledge', 'Tax regulations', 'Attention to detail', 'Client service'],
    targetMarkets: ['Small businesses', 'Freelancers', 'Contractors', 'Service providers'],
    revenueStreams: ['Monthly bookkeeping', 'Tax preparation', 'Consulting', 'Setup fees'],
    startupCosts: 'Low ($500 - $3,000)',
    marketSize: 'Large ($50B+ in US)',
    competitionLevel: 'Medium',
    successFactors: ['Accuracy', 'Compliance knowledge', 'Client relationships', 'Reliability'],
    popularNiches: ['Small business', 'Real estate', 'Contractors', 'E-commerce'],
    workStyle: ['Detail-oriented', 'Deadline-driven', 'Client relationships', 'Compliance-focused']
  },

  // Service-Based
  { 
    id: 'beauty-wellness', 
    title: 'Beauty Wellness', 
    category: 'Service-Based', 
    difficulty: 'intermediate', 
    timeToRevenue: '4-8 weeks', 
    searchTerms: ['beauty', 'wellness', 'spa', 'salon', 'skincare'],
    aliases: ['beauty salon', 'spa services', 'wellness center', 'skincare', 'massage therapy', 'aesthetics'],
    commonTools: ['Booking software', 'POS systems', 'Inventory management', 'Client management', 'Social media'],
    skillsRequired: ['Beauty techniques', 'Customer service', 'Health protocols', 'Business management'],
    targetMarkets: ['Women 25-65', 'Health-conscious consumers', 'Stress-relief seekers', 'Self-care enthusiasts'],
    revenueStreams: ['Service fees', 'Product sales', 'Packages', 'Memberships', 'Gift certificates'],
    startupCosts: 'Medium-High ($15,000 - $75,000)',
    marketSize: 'Large ($180B+ globally)',
    competitionLevel: 'High',
    successFactors: ['Service quality', 'Location', 'Customer experience', 'Cleanliness', 'Staff expertise'],
    popularNiches: ['Skincare', 'Massage', 'Hair services', 'Nail care', 'Wellness treatments'],
    workStyle: ['Client-facing', 'Appointment-based', 'Skill-dependent', 'Relationship-building']
  },
  { 
    id: 'food-truck', 
    title: 'Food Truck', 
    category: 'Service-Based', 
    difficulty: 'intermediate', 
    timeToRevenue: '8-16 weeks', 
    searchTerms: ['food', 'truck', 'mobile', 'restaurant', 'catering', 'street'],
    aliases: ['mobile food', 'street food', 'food cart', 'mobile restaurant', 'catering truck'],
    commonTools: ['POS systems', 'Food truck', 'Kitchen equipment', 'Social media', 'Route planning'],
    skillsRequired: ['Cooking', 'Food safety', 'Business operations', 'Customer service', 'Marketing'],
    targetMarkets: ['Office workers', 'Event attendees', 'Street food lovers', 'Festival goers'],
    revenueStreams: ['Food sales', 'Catering events', 'Private parties', 'Festival fees', 'Corporate catering'],
    startupCosts: 'High ($50,000 - $200,000)',
    marketSize: 'Medium ($3B+ in US)',
    competitionLevel: 'Medium-High',
    successFactors: ['Food quality', 'Location strategy', 'Speed of service', 'Brand recognition'],
    popularNiches: ['Gourmet burgers', 'Tacos', 'Asian fusion', 'BBQ', 'Desserts', 'Health food'],
    workStyle: ['Mobile', 'Early hours', 'Physical work', 'Event-based']
  },

  // Real Estate & Housing  
  { 
    id: 'real-estate-solo-agent', 
    title: 'Real Estate Solo Agent', 
    category: 'Real Estate & Housing', 
    difficulty: 'intermediate', 
    timeToRevenue: '2-4 months', 
    searchTerms: ['realtor', 'agent', 'real', 'estate', 'broker', 'property'],
    aliases: ['realtor', 'real estate agent', 'property sales', 'real estate broker', 'property consultant'],
    commonTools: ['MLS systems', 'CRM software', 'DocuSign', 'Zillow Pro', 'Social media', 'Photography equipment'],
    skillsRequired: ['Sales', 'Negotiation', 'Market knowledge', 'Customer service', 'Marketing', 'Legal compliance'],
    targetMarkets: ['Home buyers', 'Home sellers', 'Investors', 'First-time buyers', 'Relocating families'],
    revenueStreams: ['Sales commissions', 'Buyer representation', 'Referral fees', 'Consultation fees'],
    startupCosts: 'Medium ($5,000 - $15,000)',
    marketSize: 'Large ($200B+ annually)',
    competitionLevel: 'Very High',
    successFactors: ['Local market knowledge', 'Network building', 'Marketing skills', 'Client service'],
    popularNiches: ['Residential sales', 'Luxury homes', 'First-time buyers', 'Investment properties'],
    workStyle: ['Relationship-based', 'Flexible schedule', 'Local market', 'People-focused']
  },
  
  // General fallback
  { 
    id: 'other', 
    title: 'Other', 
    category: 'General', 
    difficulty: 'beginner', 
    timeToRevenue: 'Variable', 
    searchTerms: ['other', 'general', 'custom'],
    aliases: ['custom business', 'unique business', 'specialized business'],
    commonTools: ['Various depending on business'],
    skillsRequired: ['Business fundamentals', 'Industry-specific skills'],
    targetMarkets: ['Varies by business type'],
    revenueStreams: ['Varies by business type'],
    startupCosts: 'Varies',
    marketSize: 'N/A',
    competitionLevel: 'Varies',
    successFactors: ['Industry expertise', 'Market understanding', 'Customer focus'],
    popularNiches: ['Custom solutions'],
    workStyle: ['Varies by business type']
  }
]; // END OF DEPRECATED HARDCODED LIST - DO NOT USE - All 108 industries are now loaded from industryData.ts

const INDUSTRY_CATEGORIES = [
  'Technology & Software',
  'Content & Digital', 
  'E-commerce & Retail',
  'Professional Services',
  'Service-Based',
  'Real Estate & Housing',
  'Manufacturing',
  'General'
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'advanced': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  }
};

const searchIndustries = (query: string): SearchResult[] => {
  if (!query.trim()) return [];

  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  const results: SearchResult[] = [];

  SORTED_ROADMAP_INDUSTRIES.forEach(industry => {
    let score = 0;
    const matches: string[] = [];

    // Search through all searchable fields
    const searchableFields = [
      { field: industry.title, weight: 10, label: 'title' },
      { field: industry.searchTerms?.join(' ') || '', weight: 8, label: 'keywords' },
      { field: industry.aliases?.join(' ') || '', weight: 7, label: 'aliases' },
      { field: industry.commonTools?.join(' ') || '', weight: 6, label: 'tools' },
      { field: industry.skillsRequired?.join(' ') || '', weight: 5, label: 'skills' },
      { field: industry.targetMarkets?.join(' ') || '', weight: 4, label: 'markets' },
      { field: industry.revenueStreams?.join(' ') || '', weight: 3, label: 'revenue' },
      { field: industry.popularNiches?.join(' ') || '', weight: 3, label: 'niches' },
      { field: industry.category, weight: 2, label: 'category' },
    ];

    searchTerms.forEach(term => {
      searchableFields.forEach(({ field, weight, label }) => {
        if (field.toLowerCase().includes(term)) {
          score += weight;
          if (!matches.includes(label)) {
            matches.push(label);
          }
        }
      });
    });

    if (score > 0) {
      results.push({ industry, score, matches });
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
};

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  onSelect,
  selectedIndustry,
  disabled = false,
  showSearch = true,
  showCategories = true,
  maxHeight = '400px'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Initialize with all categories expanded for better UX
  useEffect(() => {
    if (showCategories) {
      setExpandedCategories(new Set(INDUSTRY_CATEGORIES));
    }
  }, [showCategories]);

  // Search results - memoized for performance
  const searchResults = useMemo(() => {
    return searchIndustries(searchQuery);
  }, [searchQuery]);

  // Group industries by category
  const industriesByCategory = useMemo(() => {
    const grouped: Record<string, IndustryItem[]> = {};
    INDUSTRY_CATEGORIES.forEach(category => {
      grouped[category] = SORTED_ROADMAP_INDUSTRIES.filter(industry => industry.category === category);
    });
    return grouped;
  }, []);

  const toggleIndustryExpansion = (industryId: string) => {
    setExpandedIndustries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(industryId)) {
        newSet.delete(industryId);
      } else {
        newSet.add(industryId);
      }
      return newSet;
    });
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleIndustrySelect = (industryId: string, industryTitle: string) => {
    if (!disabled) {
      onSelect(industryId, industryTitle);
    }
  };

  // Render compact industry item for grid view
  const renderCompactIndustryItem = (industry: IndustryItem, showMatches?: string[]) => {
    const isSelected = selectedIndustry === industry.title || selectedIndustry === industry.id;
    const isExpanded = expandedIndustries.has(industry.id);

    return (
      <div
        key={industry.id}
        className={`group cursor-pointer transition-all duration-200 border rounded-lg p-3 ${
          isSelected
            ? 'border-[#4B00FF] bg-[#4B00FF]/5 ring-2 ring-[#4B00FF]/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-[#4B00FF] hover:bg-gray-50 dark:hover:bg-gray-800/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && handleIndustrySelect(industry.id, industry.title)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 leading-tight">
            {industry.title}
          </h3>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-[#4B00FF] flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-1.5 mb-2">
          <Badge
            variant="outline"
            className={`text-xs ${getDifficultyColor(industry.difficulty)}`}
          >
            {industry.difficulty}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {industry.timeToRevenue}
          </Badge>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {industry.category}
        </div>

        {/* Show more info button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleIndustryExpansion(industry.id);
          }}
          className="w-full h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Info className="w-3 h-3 mr-1" />
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {industry.commonTools && industry.commonTools.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Briefcase className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tools</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {industry.commonTools.slice(0, 3).join(', ')}
                  {industry.commonTools.length > 3 && ` +${industry.commonTools.length - 3} more`}
                </div>
              </div>
            )}

            {industry.startupCosts && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Startup Costs</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{industry.startupCosts}</div>
              </div>
            )}

            {industry.marketSize && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Market Size</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{industry.marketSize}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderIndustryCard = (industry: IndustryItem, showMatches?: string[]) => {
    const isSelected = selectedIndustry === industry.title || selectedIndustry === industry.id;
    const isExpanded = expandedIndustries.has(industry.id);

    return (
      <Card
        key={industry.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && handleIndustrySelect(industry.id, industry.title)}
      >
        <div className="p-2.5 sm:p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                  {industry.title}
                </h3>
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] sm:text-xs ${getDifficultyColor(industry.difficulty)}`}
                >
                  {industry.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  {industry.timeToRevenue}
                </Badge>
              </div>

              {showMatches && showMatches.length > 0 && (
                <div className="flex items-center gap-1 mb-1 sm:mb-2">
                  <span className="text-[10px] sm:text-xs text-gray-500">Matches:</span>
                  {showMatches.slice(0, 3).map(match => (
                    <Badge key={match} variant="outline" className="text-[9px] sm:text-xs">
                      {match}
                    </Badge>
                  ))}
                  {showMatches.length > 3 && (
                    <Badge variant="outline" className="text-[9px] sm:text-xs">
                      +{showMatches.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">
                  {industry.category}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleIndustryExpansion(industry.id);
                  }}
                  className="p-0.5 sm:p-1 h-5 w-5 sm:h-6 sm:w-6"
                >
                  <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </Button>
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {industry.commonTools && industry.commonTools.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Briefcase className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Common Tools</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {industry.commonTools.slice(0, 4).map((tool, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {industry.commonTools.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{industry.commonTools.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {industry.skillsRequired && industry.skillsRequired.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Target className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Key Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {industry.skillsRequired.slice(0, 4).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {industry.skillsRequired.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{industry.skillsRequired.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {industry.startupCosts && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Startup Costs</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{industry.startupCosts}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full">
      {showSearch && (
        <div className="mb-2 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <Input
              placeholder="Search industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
              disabled={disabled}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-0.5 sm:p-1 h-5 w-5 sm:h-6 sm:w-6"
              >
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div 
        className="space-y-2 sm:space-y-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {searchQuery ? (
          // Search Results
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Search Results ({searchResults.length})
              </span>
            </div>
            
            {searchResults.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No industries found matching "{searchQuery}"
                  </p>
                  <p className="text-sm text-gray-500">
                    Try searching for tools, skills, or broader terms
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map(({ industry, matches }) => 
                  renderCompactIndustryItem(industry, matches)
                )}
              </div>
            )}
          </div>
        ) : (
          // Category-based browsing
          <div>
            {showCategories ? (
              INDUSTRY_CATEGORIES.map(category => {
                const categoryIndustries = industriesByCategory[category] || [];
                const isCategoryExpanded = expandedCategories.has(category);

                if (categoryIndustries.length === 0) return null;

                return (
                  <Collapsible
                    key={category}
                    open={isCategoryExpanded}
                    onOpenChange={() => toggleCategoryExpansion(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-3 h-auto"
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{category}</span>
                          <Badge variant="outline" className="ml-2">
                            {categoryIndustries.length}
                          </Badge>
                        </div>
                        <ArrowRight className={`w-4 h-4 transition-transform ${
                          isCategoryExpanded ? 'rotate-90' : ''
                        }`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                      {categoryIndustries.map(industry => renderCompactIndustryItem(industry))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            ) : (
              // Multi-column grid for desktop, single column for mobile
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SORTED_ROADMAP_INDUSTRIES.map(industry => renderCompactIndustryItem(industry))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IndustrySelector;