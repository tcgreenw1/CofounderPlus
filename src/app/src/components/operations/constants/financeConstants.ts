import { 
  TrendingUp, ShoppingCart, Users, Laptop, Building, Truck, 
  BarChart3, Briefcase, Zap, Target, DollarSign, Award 
} from 'lucide-react';

export interface BudgetCategory {
  value: string;
  label: string;
  icon: any;
  description: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  color: string;
}

// Predefined budget categories with icons and descriptions
export const BUDGET_CATEGORIES: BudgetCategory[] = [
  { 
    value: 'Marketing', 
    label: 'Marketing & Advertising', 
    icon: TrendingUp, 
    description: 'Digital ads, content creation, campaigns, SEO, social media' 
  },
  { 
    value: 'Product Development', 
    label: 'Product Development', 
    icon: Zap, 
    description: 'R&D, prototyping, design, testing, manufacturing' 
  },
  { 
    value: 'Operations', 
    label: 'Operations & Infrastructure', 
    icon: Building, 
    description: 'Office rent, utilities, insurance, legal, accounting' 
  },
  { 
    value: 'Technology', 
    label: 'Technology & Software', 
    icon: Laptop, 
    description: 'Software licenses, hosting, development tools, IT equipment' 
  },
  { 
    value: 'Sales', 
    label: 'Sales & Business Development', 
    icon: BarChart3, 
    description: 'Sales tools, CRM, lead generation, commissions, travel' 
  },
  { 
    value: 'Human Resources', 
    label: 'Human Resources', 
    icon: Users, 
    description: 'Recruiting, training, benefits, payroll, team events' 
  },
  { 
    value: 'Inventory', 
    label: 'Inventory & Supplies', 
    icon: ShoppingCart, 
    description: 'Raw materials, finished goods, office supplies, equipment' 
  },
  { 
    value: 'Logistics', 
    label: 'Logistics & Shipping', 
    icon: Truck, 
    description: 'Shipping costs, fulfillment, warehousing, delivery services' 
  },
  { 
    value: 'Professional Services', 
    label: 'Professional Services', 
    icon: Briefcase, 
    description: 'Consultants, contractors, freelancers, professional advisors' 
  },
  { 
    value: 'General', 
    label: 'General Business', 
    icon: Target, 
    description: 'Miscellaneous business expenses and other costs' 
  }
];

// Transaction categories for both income and expense types
export const TRANSACTION_CATEGORIES = {
  income: [
    { id: 'Consulting', name: 'Consulting Services', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'Product Sales', name: 'Product Sales', color: 'bg-blue-100 text-blue-700' },
    { id: 'Subscriptions', name: 'Subscriptions & Recurring', color: 'bg-purple-100 text-purple-700' },
    { id: 'Freelance', name: 'Freelance Work', color: 'bg-orange-100 text-orange-700' },
    { id: 'Investment', name: 'Investment Returns', color: 'bg-green-100 text-green-700' },
    { id: 'Other Income', name: 'Other Income', color: 'bg-gray-100 text-gray-700' }
  ] as TransactionCategory[],
  expense: [
    { id: 'Marketing', name: 'Marketing & Advertising', color: 'bg-orange-100 text-orange-700' },
    { id: 'Product Development', name: 'Product Development', color: 'bg-purple-100 text-purple-700' },
    { id: 'Operations', name: 'Operations & Infrastructure', color: 'bg-blue-100 text-blue-700' },
    { id: 'Technology', name: 'Technology & Software', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'Sales', name: 'Sales & Business Development', color: 'bg-green-100 text-green-700' },
    { id: 'Human Resources', name: 'Human Resources', color: 'bg-pink-100 text-pink-700' },
    { id: 'Inventory', name: 'Inventory & Supplies', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'Logistics', name: 'Logistics & Shipping', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'Professional Services', name: 'Professional Services', color: 'bg-gray-100 text-gray-700' },
    { id: 'General', name: 'General Business', color: 'bg-slate-100 text-slate-700' }
  ] as TransactionCategory[]
};

// Default categories
export const DEFAULT_EXPENSE_CATEGORY = 'General';
export const DEFAULT_INCOME_CATEGORY = 'Other Income';
export const DEFAULT_BUDGET_CATEGORY = 'Marketing';