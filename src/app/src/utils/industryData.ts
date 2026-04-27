// Industry data extracted from roadmap system
// This ensures the industry selector shows all 107+ industries available in the platform

import { CONTENT_CREATION_ROADMAP } from '../components/roadmap/RoadmapData';
import { 
  DROPSHIPPING_ECOMMERCE_ROADMAP, 
  BEAUTY_WELLNESS_ROADMAP, 
  JEWELRY_LUXURY_ROADMAP, 
  SUBSCRIPTION_BOX_ROADMAP, 
  FOOD_TRUCK_ROADMAP, 
  REAL_ESTATE_ROADMAP, 
  AUTOMOTIVE_MOBILE_ROADMAP, 
  IT_MSP_ROADMAP, 
  PET_GROOMING_ROADMAP, 
  COURIER_LOGISTICS_ROADMAP, 
  SMMA_LITE_ROADMAP, 
  AIRBNB_COHOST_ROADMAP, 
  ONLINE_TUTORING_ROADMAP, 
  BOOKKEEPING_TAX_ROADMAP, 
  LEGAL_DOCUMENT_ROADMAP, 
  IMPORT_EXPORT_ROADMAP, 
  FASHION_WHOLESALE_ROADMAP, 
  SUBSCRIPTION_COMMERCE_ROADMAP, 
  MOBILE_APP_DEV_ROADMAP, 
  CONSTRUCTION_REMODELING_ROADMAP, 
  GOVERNMENT_B2G_ROADMAP, 
  EQUIPMENT_RENTAL_ROADMAP, 
  SECURITY_PATROL_ROADMAP, 
  SOLAR_SALES_ROADMAP, 
  FRACTIONAL_OPERATOR_ROADMAP, 
  INSURANCE_AGENCY_ROADMAP, 
  SAAS_VAR_ROADMAP, 
  ART_COLLECTIBLES_ROADMAP, 
  ENVIRONMENTAL_SUSTAINABILITY_ROADMAP, 
  SCIENTIFIC_EQUIPMENT_ROADMAP, 
  PET_PRODUCTS_WHOLESALE_ROADMAP, 
  HOME_IMPROVEMENT_WHOLESALE_ROADMAP, 
  SPORTING_GOODS_WHOLESALE_ROADMAP, 
  MICRO_TRAVEL_AGENCY_ROADMAP, 
  PACKAGING_MANUFACTURING_ROADMAP, 
  REAL_ESTATE_SOLO_AGENT_ROADMAP, 
  AUTOMOTIVE_PARTS_WHOLESALE_ROADMAP, 
  FOOD_BEVERAGE_MANUFACTURING_ROADMAP, 
  ONLINE_COURSE_CREATOR_ROADMAP, 
  MSP_SOLO_ROADMAP, 
  LEGAL_PARALEGAL_SERVICES_ROADMAP, 
  MOBILE_MECHANIC_ROADMAP, 
  BEAUTY_WELLNESS_SERVICES_ROADMAP, 
  HOME_SERVICES_HANDYMAN_ROADMAP, 
  SUBSCRIPTION_COMMERCE_RECURRING_ROADMAP, 
  COMMUNICATION_MEDIA_SERVICES_ROADMAP, 
  CREATIVE_DESIGN_SERVICES_ROADMAP, 
  ENTERTAINMENT_EVENT_SERVICES_ROADMAP, 
  JEWELRY_LUXURY_RETAIL_ROADMAP, 
  DROPSHIPPING_FULFILLMENT_ROADMAP, 
  VETERINARY_ANIMAL_CARE_ROADMAP, 
  HEALTH_BEAUTY_WHOLESALE_ROADMAP, 
  TRANSPORTATION_LOGISTICS_ROADMAP, 
  EDUCATIONAL_MATERIALS_DEALER_ROADMAP, 
  PROFESSIONAL_EQUIPMENT_DEALER_ROADMAP, 
  TECHNICAL_ENGINEERING_SERVICES_ROADMAP, 
  ELECTRONICS_MANUFACTURING_ROADMAP, 
  DIGITAL_CONTENT_WHOLESALE_ROADMAP, 
  RETAIL_CONSUMER_SALES_ROADMAP, 
  RAW_MATERIALS_WHOLESALE_ROADMAP, 
  MAINTENANCE_FACILITY_SERVICES_ROADMAP, 
  PERSONAL_LIFESTYLE_SERVICES_ROADMAP, 
  MEDICAL_DEVICE_MANUFACTURING_ROADMAP, 
  SMART_HOME_MANUFACTURING_ROADMAP, 
  PHARMACEUTICAL_HEALTHCARE_WHOLESALE_ROADMAP, 
  HEALTHCARE_MEDICAL_SERVICES_ROADMAP, 
  TEXTILES_APPAREL_MANUFACTURING_ROADMAP, 
  ROBOTICS_AUTOMATION_MANUFACTURING_ROADMAP, 
  ECOMMERCE_WHOLESALE_PLATFORMS_ROADMAP, 
  DRONE_UNMANNED_SYSTEMS_ROADMAP, 
  FURNITURE_FIXTURES_MANUFACTURING_ROADMAP, 
  SPORTS_RECREATION_MANUFACTURING_ROADMAP, 
  TOY_GAME_MANUFACTURING_ROADMAP, 
  MODULAR_PREFAB_HOUSING_ROADMAP, 
  RENEWABLE_ENERGY_MANUFACTURING_ROADMAP, 
  CHEMICAL_MATERIALS_MANUFACTURING_ROADMAP, 
  AEROSPACE_AVIATION_MANUFACTURING_ROADMAP, 
  AGRICULTURAL_EQUIPMENT_MANUFACTURING_ROADMAP, 
  AUTOMOTIVE_PARTS_SYSTEMS_MANUFACTURING_ROADMAP, 
  ENTERTAINMENT_GAMING_HARDWARE_ROADMAP, 
  CONSTRUCTION_EQUIPMENT_MANUFACTURING_ROADMAP, 
  BIOTECHNOLOGY_LIFE_SCIENCES_ROADMAP, 
  ENVIRONMENTAL_TECHNOLOGY_MANUFACTURING_ROADMAP, 
  MARINE_BOAT_MANUFACTURING_ROADMAP, 
  JEWELRY_LUXURY_GOODS_MANUFACTURING_ROADMAP, 
  FOOD_BEVERAGE_WHOLESALE_ROADMAP, 
  INDUSTRIAL_COMMERCIAL_WHOLESALE_ROADMAP, 
  TECHNOLOGY_HARDWARE_WHOLESALE_ROADMAP, 
  PUBLISHING_MEDIA_WHOLESALE_ROADMAP, 
  TOYS_GAMES_WHOLESALE_ROADMAP, 
  RETAIL_PRODUCT_WHOLESALE_ROADMAP, 
  AGRICULTURAL_PRODUCTS_WHOLESALE_ROADMAP, 
  ENERGY_PRODUCTS_WHOLESALE_ROADMAP, 
  JEWELRY_ACCESSORIES_WHOLESALE_ROADMAP, 
  MARINE_RV_WHOLESALE_ROADMAP, 
  MARINE_RV_DEALER_ROADMAP, 
  PET_STORE_ANIMAL_SERVICES_ROADMAP, 
  FINANCIAL_SERVICES_DEALER_ROADMAP, 
  ENTERTAINMENT_MEDIA_DEALER_ROADMAP, 
  PRINT_ON_DEMAND_MANUFACTURING_ROADMAP, 
  AUTOMOTIVE_DEALERSHIP_ROADMAP, 
  SPORTING_GOODS_FITNESS_RETAIL_ROADMAP, 
  HOME_IMPROVEMENT_HARDWARE_RETAIL_ROADMAP, 
  GAMING_ENTERTAINMENT_RETAIL_ROADMAP, 
  AGRICULTURAL_EQUIPMENT_DEALER_ROADMAP 
} from '../components/roadmap/NewRoadmaps';
import { VA_REMOTE_SUPPORT_ROADMAP } from '../components/roadmap/AdditionalRoadmaps';

// All available roadmaps
const ALL_ROADMAPS = [
  CONTENT_CREATION_ROADMAP,
  DROPSHIPPING_ECOMMERCE_ROADMAP,
  BEAUTY_WELLNESS_ROADMAP,
  JEWELRY_LUXURY_ROADMAP,
  SUBSCRIPTION_BOX_ROADMAP,
  FOOD_TRUCK_ROADMAP,
  REAL_ESTATE_ROADMAP,
  AUTOMOTIVE_MOBILE_ROADMAP,
  IT_MSP_ROADMAP,
  PET_GROOMING_ROADMAP,
  COURIER_LOGISTICS_ROADMAP,
  SMMA_LITE_ROADMAP,
  AIRBNB_COHOST_ROADMAP,
  ONLINE_TUTORING_ROADMAP,
  BOOKKEEPING_TAX_ROADMAP,
  LEGAL_DOCUMENT_ROADMAP,
  IMPORT_EXPORT_ROADMAP,
  FASHION_WHOLESALE_ROADMAP,
  SUBSCRIPTION_COMMERCE_ROADMAP,
  MOBILE_APP_DEV_ROADMAP,
  CONSTRUCTION_REMODELING_ROADMAP,
  GOVERNMENT_B2G_ROADMAP,
  EQUIPMENT_RENTAL_ROADMAP,
  SECURITY_PATROL_ROADMAP,
  SOLAR_SALES_ROADMAP,
  FRACTIONAL_OPERATOR_ROADMAP,
  INSURANCE_AGENCY_ROADMAP,
  SAAS_VAR_ROADMAP,
  ART_COLLECTIBLES_ROADMAP,
  ENVIRONMENTAL_SUSTAINABILITY_ROADMAP,
  SCIENTIFIC_EQUIPMENT_ROADMAP,
  PET_PRODUCTS_WHOLESALE_ROADMAP,
  HOME_IMPROVEMENT_WHOLESALE_ROADMAP,
  SPORTING_GOODS_WHOLESALE_ROADMAP,
  MICRO_TRAVEL_AGENCY_ROADMAP,
  PACKAGING_MANUFACTURING_ROADMAP,
  REAL_ESTATE_SOLO_AGENT_ROADMAP,
  AUTOMOTIVE_PARTS_WHOLESALE_ROADMAP,
  FOOD_BEVERAGE_MANUFACTURING_ROADMAP,
  ONLINE_COURSE_CREATOR_ROADMAP,
  MSP_SOLO_ROADMAP,
  LEGAL_PARALEGAL_SERVICES_ROADMAP,
  MOBILE_MECHANIC_ROADMAP,
  BEAUTY_WELLNESS_SERVICES_ROADMAP,
  HOME_SERVICES_HANDYMAN_ROADMAP,
  SUBSCRIPTION_COMMERCE_RECURRING_ROADMAP,
  COMMUNICATION_MEDIA_SERVICES_ROADMAP,
  CREATIVE_DESIGN_SERVICES_ROADMAP,
  ENTERTAINMENT_EVENT_SERVICES_ROADMAP,
  JEWELRY_LUXURY_RETAIL_ROADMAP,
  DROPSHIPPING_FULFILLMENT_ROADMAP,
  VETERINARY_ANIMAL_CARE_ROADMAP,
  HEALTH_BEAUTY_WHOLESALE_ROADMAP,
  TRANSPORTATION_LOGISTICS_ROADMAP,
  EDUCATIONAL_MATERIALS_DEALER_ROADMAP,
  PROFESSIONAL_EQUIPMENT_DEALER_ROADMAP,
  TECHNICAL_ENGINEERING_SERVICES_ROADMAP,
  ELECTRONICS_MANUFACTURING_ROADMAP,
  DIGITAL_CONTENT_WHOLESALE_ROADMAP,
  RETAIL_CONSUMER_SALES_ROADMAP,
  RAW_MATERIALS_WHOLESALE_ROADMAP,
  MAINTENANCE_FACILITY_SERVICES_ROADMAP,
  PERSONAL_LIFESTYLE_SERVICES_ROADMAP,
  MEDICAL_DEVICE_MANUFACTURING_ROADMAP,
  SMART_HOME_MANUFACTURING_ROADMAP,
  PHARMACEUTICAL_HEALTHCARE_WHOLESALE_ROADMAP,
  HEALTHCARE_MEDICAL_SERVICES_ROADMAP,
  TEXTILES_APPAREL_MANUFACTURING_ROADMAP,
  ROBOTICS_AUTOMATION_MANUFACTURING_ROADMAP,
  ECOMMERCE_WHOLESALE_PLATFORMS_ROADMAP,
  DRONE_UNMANNED_SYSTEMS_ROADMAP,
  FURNITURE_FIXTURES_MANUFACTURING_ROADMAP,
  SPORTS_RECREATION_MANUFACTURING_ROADMAP,
  TOY_GAME_MANUFACTURING_ROADMAP,
  MODULAR_PREFAB_HOUSING_ROADMAP,
  RENEWABLE_ENERGY_MANUFACTURING_ROADMAP,
  CHEMICAL_MATERIALS_MANUFACTURING_ROADMAP,
  AEROSPACE_AVIATION_MANUFACTURING_ROADMAP,
  AGRICULTURAL_EQUIPMENT_MANUFACTURING_ROADMAP,
  AUTOMOTIVE_PARTS_SYSTEMS_MANUFACTURING_ROADMAP,
  ENTERTAINMENT_GAMING_HARDWARE_ROADMAP,
  CONSTRUCTION_EQUIPMENT_MANUFACTURING_ROADMAP,
  BIOTECHNOLOGY_LIFE_SCIENCES_ROADMAP,
  ENVIRONMENTAL_TECHNOLOGY_MANUFACTURING_ROADMAP,
  MARINE_BOAT_MANUFACTURING_ROADMAP,
  JEWELRY_LUXURY_GOODS_MANUFACTURING_ROADMAP,
  FOOD_BEVERAGE_WHOLESALE_ROADMAP,
  INDUSTRIAL_COMMERCIAL_WHOLESALE_ROADMAP,
  TECHNOLOGY_HARDWARE_WHOLESALE_ROADMAP,
  PUBLISHING_MEDIA_WHOLESALE_ROADMAP,
  TOYS_GAMES_WHOLESALE_ROADMAP,
  RETAIL_PRODUCT_WHOLESALE_ROADMAP,
  AGRICULTURAL_PRODUCTS_WHOLESALE_ROADMAP,
  ENERGY_PRODUCTS_WHOLESALE_ROADMAP,
  JEWELRY_ACCESSORIES_WHOLESALE_ROADMAP,
  MARINE_RV_WHOLESALE_ROADMAP,
  MARINE_RV_DEALER_ROADMAP,
  PET_STORE_ANIMAL_SERVICES_ROADMAP,
  FINANCIAL_SERVICES_DEALER_ROADMAP,
  ENTERTAINMENT_MEDIA_DEALER_ROADMAP,
  PRINT_ON_DEMAND_MANUFACTURING_ROADMAP,
  AUTOMOTIVE_DEALERSHIP_ROADMAP,
  SPORTING_GOODS_FITNESS_RETAIL_ROADMAP,
  HOME_IMPROVEMENT_HARDWARE_RETAIL_ROADMAP,
  GAMING_ENTERTAINMENT_RETAIL_ROADMAP,
  AGRICULTURAL_EQUIPMENT_DEALER_ROADMAP,
  VA_REMOTE_SUPPORT_ROADMAP
];

// Enhanced reference data for better searchability and information
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
  seasonality: string;
  workStyle: string[];
  certifications: string[];
  regulations: string[];
}> = {
  'content-creation': {
    aliases: ['influencer', 'creator', 'social media', 'youtuber', 'blogger', 'podcaster', 'tiktoker', 'instagrammer'],
    relatedIndustries: ['digital-marketing', 'online-education', 'e-commerce', 'affiliate-marketing', 'brand-partnerships'],
    commonTools: ['Canva', 'Adobe Creative Suite', 'Final Cut Pro', 'OBS Studio', 'Buffer', 'Hootsuite', 'Analytics tools'],
    skillsRequired: ['Video editing', 'Photography', 'Writing', 'Social media strategy', 'SEO', 'Brand building', 'Analytics'],
    targetMarkets: ['Gen Z', 'Millennials', 'Small businesses', 'Personal brands', 'E-commerce brands'],
    revenueStreams: ['Sponsorships', 'Affiliate marketing', 'Digital products', 'Courses', 'Membership sites', 'Brand deals'],
    startupCosts: 'Low ($500 - $2,000)',
    marketSize: 'Large ($100B+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Consistent posting', 'Audience engagement', 'Niche expertise', 'Quality content', 'Community building'],
    popularNiches: ['Business', 'Lifestyle', 'Tech', 'Gaming', 'Fashion', 'Food', 'Travel', 'Education', 'Fitness'],
    seasonality: 'Year-round with Q4 peak',
    workStyle: ['Remote', 'Flexible hours', 'Creative work', 'Solo or small team'],
    certifications: ['Google Analytics', 'Facebook Blueprint', 'YouTube Creator Academy'],
    regulations: ['FTC disclosure requirements', 'COPPA compliance', 'Platform terms of service']
  },
  'dropshipping-ecommerce': {
    aliases: ['ecom', 'online store', 'retail', 'shopify', 'amazon fba', 'print on demand'],
    relatedIndustries: ['digital-marketing', 'logistics', 'customer-service', 'inventory-management', 'payment-processing'],
    commonTools: ['Shopify', 'WooCommerce', 'Oberlo', 'AliExpress', 'Facebook Ads', 'Google Ads', 'Klaviyo'],
    skillsRequired: ['Digital marketing', 'Product research', 'Customer service', 'Analytics', 'Supply chain', 'Conversion optimization'],
    targetMarkets: ['Online shoppers', 'Millennials', 'Gen Z', 'Impulse buyers', 'Niche communities'],
    revenueStreams: ['Product markup', 'Upsells', 'Cross-sells', 'Subscription boxes', 'Private labeling'],
    startupCosts: 'Low-Medium ($1,000 - $5,000)',
    marketSize: 'Massive ($5T+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Product selection', 'Marketing efficiency', 'Customer service', 'Supply chain reliability', 'Brand building'],
    popularNiches: ['Home & Garden', 'Health & Beauty', 'Tech gadgets', 'Pet supplies', 'Fashion accessories', 'Kitchen tools'],
    seasonality: 'Strong Q4, variable by niche',
    workStyle: ['Remote', 'Scalable', 'Data-driven', 'Fast-paced'],
    certifications: ['Google Ads', 'Facebook Blueprint', 'E-commerce platforms'],
    regulations: ['Consumer protection laws', 'Tax requirements', 'Product liability', 'Shipping regulations']
  },
  'government-b2g-starter': {
    aliases: ['gov contracts', 'federal contracting', 'municipal sales', 'public sector', 'procurement', 'b2g'],
    relatedIndustries: ['consulting', 'professional-services', 'construction', 'it-services', 'security-services'],
    commonTools: ['SAM.gov', 'FedBizOpps', 'State portals', 'Deltek', 'Proposal software', 'CPARs', 'GSA Schedules'],
    skillsRequired: ['Proposal writing', 'Compliance', 'Project management', 'Networking', 'Research', 'Documentation'],
    targetMarkets: ['Federal agencies', 'State government', 'Local government', 'Schools', 'Military', 'Non-profits'],
    revenueStreams: ['Contract services', 'Subcontracting', 'GSA Schedule sales', 'Set-aside contracts', 'IDIQ contracts'],
    startupCosts: 'Medium ($5,000 - $15,000)',
    marketSize: 'Large ($600B+ annually)',
    competitionLevel: 'High',
    successFactors: ['Proper registrations', 'Past performance', 'Relationships', 'Compliance', 'Competitive pricing'],
    popularNiches: ['IT services', 'Consulting', 'Construction', 'Professional services', 'Equipment supply'],
    seasonality: 'Fiscal year cycles (Oct-Sep)',
    workStyle: ['Relationship-based', 'Long sales cycles', 'Documentation heavy', 'Stable revenue'],
    certifications: ['Security clearances', 'Industry certifications', 'Small business certifications'],
    regulations: ['FAR compliance', 'DCAA standards', 'Security requirements', 'Procurement regulations']
  },
  'equipment-rental-local': {
    aliases: ['tool rental', 'equipment leasing', 'party rentals', 'construction equipment', 'event equipment'],
    relatedIndustries: ['construction', 'events', 'landscaping', 'home-improvement', 'entertainment'],
    commonTools: ['Rental software', 'Inventory management', 'GPS tracking', 'Maintenance logs', 'Booking systems'],
    skillsRequired: ['Equipment knowledge', 'Maintenance', 'Customer service', 'Logistics', 'Safety compliance'],
    targetMarkets: ['Contractors', 'DIY homeowners', 'Event planners', 'Small businesses', 'Landscapers'],
    revenueStreams: ['Daily rentals', 'Weekly rentals', 'Long-term leases', 'Delivery fees', 'Damage deposits'],
    startupCosts: 'High ($25,000 - $100,000)',
    marketSize: 'Medium ($50B+ globally)',
    competitionLevel: 'Medium',
    successFactors: ['Equipment quality', 'Location', 'Customer service', 'Maintenance', 'Insurance coverage'],
    popularNiches: ['Construction tools', 'Party equipment', 'Landscaping', 'Audio/visual', 'Cleaning equipment'],
    seasonality: 'Spring/summer peak, winter slow',
    workStyle: ['Local market', 'Physical inventory', 'Relationship-based', 'Service-oriented'],
    certifications: ['Equipment safety', 'Industry-specific training'],
    regulations: ['Safety standards', 'Insurance requirements', 'Equipment regulations', 'Local permits']
  },
  'mobile-app-development': {
    aliases: ['app dev', 'ios development', 'android development', 'mobile development', 'software development'],
    relatedIndustries: ['web-development', 'ui-ux-design', 'software-consulting', 'it-services', 'digital-agencies'],
    commonTools: ['Xcode', 'Android Studio', 'React Native', 'Flutter', 'Firebase', 'Figma', 'Git', 'TestFlight'],
    skillsRequired: ['Programming', 'UI/UX design', 'Database management', 'API integration', 'Testing', 'App store optimization'],
    targetMarkets: ['Startups', 'Small businesses', 'Enterprises', 'Entrepreneurs', 'Non-profits'],
    revenueStreams: ['Custom development', 'App maintenance', 'Consulting', 'Template sales', 'Revenue sharing'],
    startupCosts: 'Low-Medium ($2,000 - $10,000)',
    marketSize: 'Large ($200B+ globally)',
    competitionLevel: 'Very High',
    successFactors: ['Technical expertise', 'Portfolio quality', 'Client relationships', 'Market trends', 'User experience'],
    popularNiches: ['E-commerce apps', 'Social platforms', 'Business tools', 'Health & fitness', 'Education', 'Games'],
    seasonality: 'Consistent year-round',
    workStyle: ['Remote', 'Project-based', 'Technical', 'Collaborative'],
    certifications: ['iOS Developer', 'Android Developer', 'AWS Mobile', 'Google Mobile'],
    regulations: ['App store guidelines', 'Data privacy', 'Accessibility standards', 'Platform policies']
  },
  'subscription-commerce': {
    aliases: ['subscription box', 'recurring revenue', 'membership business', 'saas commerce', 'monthly box'],
    relatedIndustries: ['e-commerce', 'product-curation', 'logistics', 'customer-retention', 'inventory-management'],
    commonTools: ['Shopify Plus', 'ReCharge', 'Cratejoy', 'Stripe', 'Klaviyo', 'ChurnBuster', 'Analytics platforms'],
    skillsRequired: ['Product curation', 'Customer retention', 'Subscription analytics', 'Supply chain', 'Marketing automation'],
    targetMarkets: ['Millennials', 'Busy professionals', 'Enthusiasts', 'Gift buyers', 'Convenience seekers'],
    revenueStreams: ['Monthly subscriptions', 'Annual plans', 'Add-ons', 'Gift subscriptions', 'Limited editions'],
    startupCosts: 'Medium ($10,000 - $50,000)',
    marketSize: 'Large ($65B+ globally)',
    competitionLevel: 'High',
    successFactors: ['Product quality', 'Customer experience', 'Retention rates', 'Logistics efficiency', 'Brand loyalty'],
    popularNiches: ['Beauty', 'Food & snacks', 'Pet supplies', 'Books', 'Clothing', 'Hobby items', 'Health products'],
    seasonality: 'Q4 peak for gifting',
    workStyle: ['Inventory-based', 'Data-driven', 'Customer-focused', 'Scalable'],
    certifications: ['E-commerce platforms', 'Digital marketing'],
    regulations: ['Subscription billing laws', 'Auto-renewal regulations', 'Consumer protection', 'Tax compliance']
  },
  'online-course-creator': {
    aliases: ['e-learning', 'online education', 'course creation', 'digital teaching', 'knowledge commerce'],
    relatedIndustries: ['content-creation', 'coaching', 'consulting', 'educational-services', 'professional-training'],
    commonTools: ['Teachable', 'Thinkific', 'Kajabi', 'Zoom', 'Loom', 'Canva', 'LMS platforms', 'Video editing software'],
    skillsRequired: ['Subject expertise', 'Video production', 'Curriculum design', 'Marketing', 'Student engagement'],
    targetMarkets: ['Professionals', 'Students', 'Career changers', 'Entrepreneurs', 'Skill seekers'],
    revenueStreams: ['Course sales', 'Coaching programs', 'Membership sites', 'Affiliate commissions', 'Speaking fees'],
    startupCosts: 'Low ($500 - $3,000)',
    marketSize: 'Large ($350B+ globally)',
    competitionLevel: 'High',
    successFactors: ['Expertise credibility', 'Course quality', 'Marketing skills', 'Student success', 'Community building'],
    popularNiches: ['Business skills', 'Technology', 'Creative arts', 'Health & fitness', 'Personal development'],
    seasonality: 'New Year peak, consistent demand',
    workStyle: ['Remote', 'Flexible', 'Content-focused', 'Community-driven'],
    certifications: ['Subject matter expertise', 'Teaching credentials', 'Platform certifications'],
    regulations: ['Educational compliance', 'Consumer protection', 'Accessibility standards', 'Privacy laws']
  },
  'real-estate-solo-agent': {
    aliases: ['realtor', 'real estate agent', 'property sales', 'real estate broker', 'property consultant'],
    relatedIndustries: ['mortgage-brokerage', 'property-management', 'home-inspection', 'real-estate-photography', 'title-services'],
    commonTools: ['MLS systems', 'CRM software', 'DocuSign', 'Zillow Pro', 'Social media', 'Photography equipment'],
    skillsRequired: ['Sales', 'Negotiation', 'Market knowledge', 'Customer service', 'Marketing', 'Legal compliance'],
    targetMarkets: ['Home buyers', 'Home sellers', 'Investors', 'First-time buyers', 'Relocating families'],
    revenueStreams: ['Sales commissions', 'Buyer representation', 'Referral fees', 'Consultation fees'],
    startupCosts: 'Medium ($5,000 - $15,000)',
    marketSize: 'Large ($200B+ annually)',
    competitionLevel: 'Very High',
    successFactors: ['Local market knowledge', 'Network building', 'Marketing skills', 'Client service', 'Reputation'],
    popularNiches: ['Residential sales', 'Luxury homes', 'First-time buyers', 'Investment properties', 'Commercial'],
    seasonality: 'Spring/summer peak',
    workStyle: ['Relationship-based', 'Flexible schedule', 'Local market', 'People-focused'],
    certifications: ['Real estate license', 'Continuing education', 'Professional designations'],
    regulations: ['State licensing', 'Fair housing laws', 'Disclosure requirements', 'Ethics standards']
  },
  'beauty-wellness-services': {
    aliases: ['beauty salon', 'spa services', 'wellness center', 'skincare', 'massage therapy', 'aesthetics'],
    relatedIndustries: ['health-services', 'retail-beauty', 'fitness', 'mental-health', 'alternative-medicine'],
    commonTools: ['Booking software', 'POS systems', 'Inventory management', 'Client management', 'Social media'],
    skillsRequired: ['Beauty techniques', 'Customer service', 'Health protocols', 'Business management', 'Marketing'],
    targetMarkets: ['Women 25-65', 'Health-conscious consumers', 'Stress-relief seekers', 'Self-care enthusiasts'],
    revenueStreams: ['Service fees', 'Product sales', 'Packages', 'Memberships', 'Gift certificates'],
    startupCosts: 'Medium-High ($15,000 - $75,000)',
    marketSize: 'Large ($180B+ globally)',
    competitionLevel: 'High',
    successFactors: ['Service quality', 'Location', 'Customer experience', 'Cleanliness', 'Staff expertise'],
    popularNiches: ['Skincare', 'Massage', 'Hair services', 'Nail care', 'Wellness treatments', 'Anti-aging'],
    seasonality: 'Consistent with holiday peaks',
    workStyle: ['Client-facing', 'Appointment-based', 'Skill-dependent', 'Relationship-building'],
    certifications: ['Cosmetology license', 'Massage therapy', 'Aesthetics certification', 'Health permits'],
    regulations: ['Health department', 'State licensing', 'Safety protocols', 'Sanitation requirements']
  },
  'food-truck': {
    aliases: ['mobile food', 'street food', 'food cart', 'mobile restaurant', 'catering truck'],
    relatedIndustries: ['catering', 'restaurant', 'event-services', 'food-manufacturing', 'logistics'],
    commonTools: ['POS systems', 'Food truck', 'Kitchen equipment', 'Social media', 'Route planning', 'Permits'],
    skillsRequired: ['Cooking', 'Food safety', 'Business operations', 'Customer service', 'Marketing', 'Route planning'],
    targetMarkets: ['Office workers', 'Event attendees', 'Street food lovers', 'Festival goers', 'Late-night diners'],
    revenueStreams: ['Food sales', 'Catering events', 'Private parties', 'Festival fees', 'Corporate catering'],
    startupCosts: 'High ($50,000 - $200,000)',
    marketSize: 'Medium ($3B+ in US)',
    competitionLevel: 'Medium-High',
    successFactors: ['Food quality', 'Location strategy', 'Speed of service', 'Brand recognition', 'Social media presence'],
    popularNiches: ['Gourmet burgers', 'Tacos', 'Asian fusion', 'BBQ', 'Desserts', 'Health food', 'Ethnic cuisine'],
    seasonality: 'Weather dependent, summer peak',
    workStyle: ['Mobile', 'Early hours', 'Physical work', 'Event-based'],
    certifications: ['Food handler\'s permit', 'Business license', 'Health department approval'],
    regulations: ['Health codes', 'Mobile vendor permits', 'Fire safety', 'Zoning laws', 'Insurance requirements']
  }
};

// Generate enhanced search terms from roadmap metadata and reference data
const generateEnhancedSearchTerms = (roadmap: any): string[] => {
  const terms = new Set<string>();
  
  // Add original terms
  const titleWords = roadmap.title.toLowerCase().split(/\s+|&|\-/);
  titleWords.forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  if (roadmap.subtitle) {
    const subtitleWords = roadmap.subtitle.toLowerCase().split(/\s+|&|\-/);
    subtitleWords.forEach(word => {
      if (word.length > 2) terms.add(word);
    });
  }
  
  if (roadmap.description) {
    const descWords = roadmap.description.toLowerCase().split(/\s+|&|\-/);
    descWords.forEach(word => {
      if (word.length > 3) terms.add(word);
    });
  }
  
  if (roadmap.tags) {
    roadmap.tags.forEach((tag: string) => {
      terms.add(tag.toLowerCase());
      const tagWords = tag.toLowerCase().split(/\-|_/);
      tagWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
  }
  
  if (roadmap.targetAudience) {
    roadmap.targetAudience.forEach((audience: string) => {
      const audienceWords = audience.toLowerCase().split(/\s+/);
      audienceWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
  }
  
  // Add enhanced reference data
  const refData = INDUSTRY_REFERENCE_DATA[roadmap.id];
  if (refData) {
    // Add aliases
    refData.aliases.forEach(alias => {
      terms.add(alias.toLowerCase());
      const aliasWords = alias.toLowerCase().split(/\s+/);
      aliasWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add tools
    refData.commonTools.forEach(tool => {
      terms.add(tool.toLowerCase());
      const toolWords = tool.toLowerCase().split(/\s+/);
      toolWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add skills
    refData.skillsRequired.forEach(skill => {
      terms.add(skill.toLowerCase());
      const skillWords = skill.toLowerCase().split(/\s+/);
      skillWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add target markets
    refData.targetMarkets.forEach(market => {
      terms.add(market.toLowerCase());
      const marketWords = market.toLowerCase().split(/\s+/);
      marketWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add popular niches
    refData.popularNiches.forEach(niche => {
      terms.add(niche.toLowerCase());
      const nicheWords = niche.toLowerCase().split(/\s+/);
      nicheWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add revenue streams
    refData.revenueStreams.forEach(stream => {
      terms.add(stream.toLowerCase());
      const streamWords = stream.toLowerCase().split(/\s+/);
      streamWords.forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add work style terms
    refData.workStyle.forEach(style => {
      terms.add(style.toLowerCase());
    });
    
    // Add success factors
    refData.successFactors.forEach(factor => {
      const factorWords = factor.toLowerCase().split(/\s+/);
      factorWords.forEach(word => {
        if (word.length > 3) terms.add(word);
      });
    });
  }
  
  return Array.from(terms);
};

// Create category mapping based on tags, content, and reference data
const determineCategory = (roadmap: any): string => {
  const tags = roadmap.tags || [];
  const title = roadmap.title.toLowerCase();
  const subtitle = roadmap.subtitle?.toLowerCase() || '';
  
  // E-commerce & Retail
  if (tags.some((tag: string) => ['ecommerce', 'retail', 'dropshipping', 'subscription', 'online-store'].includes(tag)) ||
      title.includes('ecommerce') || title.includes('dropshipping') || title.includes('retail') || title.includes('subscription')) {
    return 'E-commerce & Retail';
  }
  
  // Content & Digital
  if (tags.some((tag: string) => ['content', 'digital', 'social-media', 'creative', 'media', 'design'].includes(tag)) ||
      title.includes('content') || title.includes('digital') || title.includes('media') || title.includes('creative') || title.includes('design')) {
    return 'Content & Digital';
  }
  
  // Technology & Software
  if (tags.some((tag: string) => ['technology', 'software', 'it', 'tech', 'app', 'saas'].includes(tag)) ||
      title.includes('it ') || title.includes('app') || title.includes('software') || title.includes('saas') || title.includes('tech')) {
    return 'Technology & Software';
  }
  
  // Professional Services
  if (tags.some((tag: string) => ['professional', 'consulting', 'legal', 'financial', 'accounting', 'insurance'].includes(tag)) ||
      title.includes('consulting') || title.includes('legal') || title.includes('financial') || title.includes('accounting') || title.includes('insurance') || title.includes('tax')) {
    return 'Professional Services';
  }
  
  // Service-Based
  if (tags.some((tag: string) => ['services', 'service', 'local', 'mobile'].includes(tag)) ||
      title.includes('services') || title.includes('service') || subtitle.includes('service')) {
    return 'Service-Based';
  }
  
  // Real Estate & Housing
  if (tags.some((tag: string) => ['real-estate', 'property', 'construction', 'housing'].includes(tag)) ||
      title.includes('real estate') || title.includes('property') || title.includes('construction') || title.includes('housing')) {
    return 'Real Estate & Housing';
  }
  
  // Manufacturing & Production
  if (tags.some((tag: string) => ['manufacturing', 'production', 'equipment'].includes(tag)) ||
      title.includes('manufacturing') || title.includes('equipment') || title.includes('production')) {
    return 'Manufacturing & Production';
  }
  
  // Food & Beverage
  if (tags.some((tag: string) => ['food', 'beverage', 'restaurant'].includes(tag)) ||
      title.includes('food') || title.includes('beverage')) {
    return 'Food & Beverage';
  }
  
  // Transportation & Automotive
  if (tags.some((tag: string) => ['transportation', 'automotive', 'logistics'].includes(tag)) ||
      title.includes('transportation') || title.includes('automotive') || title.includes('logistics')) {
    return 'Transportation & Automotive';
  }
  
  // Industrial & Equipment
  if (tags.some((tag: string) => ['industrial', 'equipment', 'security', 'solar'].includes(tag)) ||
      title.includes('equipment') || title.includes('security') || title.includes('solar')) {
    return 'Industrial & Equipment';
  }
  
  // Health & Wellness
  if (tags.some((tag: string) => ['health', 'wellness', 'beauty', 'medical', 'fitness'].includes(tag)) ||
      title.includes('health') || title.includes('wellness') || title.includes('beauty') || title.includes('medical')) {
    return 'Health & Wellness';
  }
  
  // Specialized & Niche
  if (tags.some((tag: string) => ['government', 'art', 'environmental', 'scientific', 'travel'].includes(tag)) ||
      title.includes('government') || title.includes('art') || title.includes('environmental') || title.includes('scientific') || title.includes('travel')) {
    return 'Specialized & Niche';
  }
  
  // Wholesale & Distribution
  if (tags.some((tag: string) => ['wholesale', 'distribution', 'dealer'].includes(tag)) ||
      title.includes('wholesale') || title.includes('dealer') || subtitle.includes('wholesale')) {
    return 'Wholesale & Distribution';
  }
  
  return 'Other';
};

// Convert roadmaps to enhanced industry format with rich reference data
export const ROADMAP_INDUSTRIES = ALL_ROADMAPS
  .filter(roadmap => roadmap && roadmap.id) // Filter out undefined or invalid roadmaps
  .map(roadmap => {
  const refData = INDUSTRY_REFERENCE_DATA[roadmap.id];
  return {
    id: roadmap.id,
    title: roadmap.title,
    category: determineCategory(roadmap),
    difficulty: roadmap.difficulty,
    timeToRevenue: roadmap.estimatedTimeToRevenue,
    searchTerms: generateEnhancedSearchTerms(roadmap),
    // Enhanced reference data
    aliases: refData?.aliases || [],
    relatedIndustries: refData?.relatedIndustries || [],
    commonTools: refData?.commonTools || [],
    skillsRequired: refData?.skillsRequired || [],
    targetMarkets: refData?.targetMarkets || [],
    revenueStreams: refData?.revenueStreams || [],
    startupCosts: refData?.startupCosts || 'Variable',
    marketSize: refData?.marketSize || 'Medium',
    competitionLevel: refData?.competitionLevel || 'Medium',
    successFactors: refData?.successFactors || [],
    popularNiches: refData?.popularNiches || [],
    seasonality: refData?.seasonality || 'Year-round',
    workStyle: refData?.workStyle || ['Standard'],
    certifications: refData?.certifications || [],
    regulations: refData?.regulations || []
  };
});

// Sort industries by category, then by title
export const SORTED_ROADMAP_INDUSTRIES = ROADMAP_INDUSTRIES.sort((a, b) => {
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.title.localeCompare(b.title);
});

// Get unique categories
export const INDUSTRY_CATEGORIES = [...new Set(ROADMAP_INDUSTRIES.map(industry => industry.category))].sort();

// Export count for verification
export const TOTAL_INDUSTRY_COUNT = ROADMAP_INDUSTRIES.length;

// Helper functions for accessing reference data
export const getIndustryByIds = (ids: string[]) => {
  return ROADMAP_INDUSTRIES.filter(industry => ids.includes(industry.id));
};

export const getRelatedIndustries = (industryId: string) => {
  const industry = ROADMAP_INDUSTRIES.find(i => i.id === industryId);
  if (!industry || !industry.relatedIndustries.length) return [];
  
  return ROADMAP_INDUSTRIES.filter(i => 
    industry.relatedIndustries.some(relatedId => 
      i.id.includes(relatedId) || i.title.toLowerCase().includes(relatedId.replace('-', ' '))
    )
  );
};

export const searchIndustriesByReference = (query: string, filterType?: 'tools' | 'skills' | 'markets' | 'niches') => {
  const queryLower = query.toLowerCase();
  
  return ROADMAP_INDUSTRIES.filter(industry => {
    switch (filterType) {
      case 'tools':
        return industry.commonTools.some(tool => tool.toLowerCase().includes(queryLower));
      case 'skills':
        return industry.skillsRequired.some(skill => skill.toLowerCase().includes(queryLower));
      case 'markets':
        return industry.targetMarkets.some(market => market.toLowerCase().includes(queryLower));
      case 'niches':
        return industry.popularNiches.some(niche => niche.toLowerCase().includes(queryLower));
      default:
        return industry.searchTerms.some(term => term.includes(queryLower));
    }
  });
};

export const getIndustriesByCharacteristics = (filters: {
  difficulty?: string;
  startupCosts?: string;
  competitionLevel?: string;
  workStyle?: string;
  seasonality?: string;
}) => {
  return ROADMAP_INDUSTRIES.filter(industry => {
    if (filters.difficulty && industry.difficulty !== filters.difficulty) return false;
    if (filters.startupCosts && !industry.startupCosts.toLowerCase().includes(filters.startupCosts.toLowerCase())) return false;
    if (filters.competitionLevel && industry.competitionLevel !== filters.competitionLevel) return false;
    if (filters.workStyle && !industry.workStyle.some(style => style.toLowerCase().includes(filters.workStyle!.toLowerCase()))) return false;
    if (filters.seasonality && !industry.seasonality.toLowerCase().includes(filters.seasonality.toLowerCase())) return false;
    return true;
  });
};

console.log(`📊 Enhanced Industry Data: ${TOTAL_INDUSTRY_COUNT} industries loaded across ${INDUSTRY_CATEGORIES.length} categories with rich reference data`);