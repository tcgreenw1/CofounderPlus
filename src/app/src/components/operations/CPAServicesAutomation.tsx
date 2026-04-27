import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CPAServicesSavings } from './CPAServicesSavings';
import { CPAServicesUsageTracker } from './CPAServicesUsageTracker';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  Search,
  FileText,
  Calculator,
  TrendingUp,
  DollarSign,
  FileCheck,
  Target,
  PieChart,
  BarChart3,
  Wallet,
  Receipt,
  CreditCard,
  Building,
  Users,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Briefcase,
  FileSpreadsheet,
  ArrowUpDown,
  Scale,
  Sparkles,
  Lock,
  Unlock,
  Globe,
  Package,
  Layers,
  TrendingDown,
  RefreshCw,
  GitBranch,
  Home,
  Truck,
  ShoppingCart,
  Repeat,
  Calendar,
  Award,
  Clock4,
  Boxes,
  Factory
} from 'lucide-react';

interface CPAService {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'automated' | 'in-progress' | 'planned';
  icon: React.ElementType;
  automationDetails?: string;
  whatsNeeded?: {
    title: string;
    description: string;
    requirements: string[];
  };
}

const cpaServices: CPAService[] = [
  // Bookkeeping & Transaction Management
  {
    id: 'bookkeeping',
    name: 'Daily Bookkeeping',
    description: 'Record and categorize all financial transactions in real-time',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: BookOpen,
    automationDetails: 'Auto-categorization with AI, bank sync, receipt scanning'
  },
  {
    id: 'bank-reconciliation',
    name: 'Bank Reconciliation',
    description: 'Match and reconcile bank statements with recorded transactions',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: Building,
    automationDetails: 'Automated bank sync with Plaid, real-time balance updates'
  },
  {
    id: 'expense-tracking',
    name: 'Expense Tracking & Categorization',
    description: 'Track and categorize all business expenses by type and purpose',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: Receipt,
    automationDetails: 'AI-powered categorization, receipt OCR, IRS category mapping'
  },
  {
    id: 'revenue-recognition',
    name: 'Revenue Recognition',
    description: 'Record revenue according to accounting standards',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: DollarSign,
    automationDetails: 'Automated transaction recording, accrual accounting support'
  },
  {
    id: 'ap-management',
    name: 'Accounts Payable Management',
    description: 'Track bills, vendor payments, and outstanding payables',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: CreditCard,
    automationDetails: 'Bill tracking with transaction system + CPA chat provides AP management guidance'
  },
  {
    id: 'ar-management',
    name: 'Accounts Receivable Management',
    description: 'Track customer invoices, payments, and outstanding receivables',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: Wallet,
    automationDetails: 'Invoice tracking with transaction system + CPA chat provides AR management guidance'
  },
  {
    id: 'journal-entries',
    name: 'Journal Entries & Adjustments',
    description: 'Create adjusting entries for accruals, deferrals, and corrections',
    category: 'Bookkeeping & Transaction Management',
    status: 'automated',
    icon: FileText,
    automationDetails: 'CPA chat provides categorization review and correction suggestions'
  },

  // Financial Statement Preparation
  {
    id: 'balance-sheet',
    name: 'Balance Sheet Preparation',
    description: 'Generate balance sheet showing assets, liabilities, and equity',
    category: 'Financial Statement Preparation',
    status: 'automated',
    icon: Scale,
    automationDetails: 'CPA chat generates and explains balance sheets from transaction data'
  },
  {
    id: 'income-statement',
    name: 'Income Statement (P&L)',
    description: 'Create profit and loss statements showing revenue and expenses',
    category: 'Financial Statement Preparation',
    status: 'automated',
    icon: TrendingUp,
    automationDetails: 'Auto-generated from transaction history, real-time updates'
  },
  {
    id: 'cash-flow-statement',
    name: 'Cash Flow Statement',
    description: 'Track cash inflows and outflows across operating, investing, and financing activities',
    category: 'Financial Statement Preparation',
    status: 'automated',
    icon: ArrowUpDown,
    automationDetails: 'CPA chat generates cash flow statements and provides analysis'
  },
  {
    id: 'monthly-close',
    name: 'Month-End Close Procedures',
    description: 'Complete all month-end closing activities and reconciliations',
    category: 'Financial Statement Preparation',
    status: 'automated',
    icon: FileCheck,
    automationDetails: 'CPA chat walks through month-end close checklist and requirements'
  },
  {
    id: 'year-end-close',
    name: 'Year-End Close Procedures',
    description: 'Execute annual closing procedures and prepare for tax season',
    category: 'Financial Statement Preparation',
    status: 'automated',
    icon: FileSpreadsheet,
    automationDetails: 'CPA chat provides year-end close checklist and tax season preparation guidance'
  },

  // Tax Preparation & Filing
  {
    id: 'income-tax-prep',
    name: 'Business Income Tax Preparation',
    description: 'Prepare federal and state income tax returns',
    category: 'Tax Preparation & Filing',
    status: 'automated',
    icon: FileText,
    automationDetails: 'CPA chat provides tax preparation guidance and deduction optimization'
  },
  {
    id: 'quarterly-taxes',
    name: 'Quarterly Estimated Tax Calculations',
    description: 'Calculate and track quarterly estimated tax payments',
    category: 'Tax Preparation & Filing',
    status: 'automated',
    icon: Calculator,
    automationDetails: 'CPA chat calculates quarterly estimates based on current financials'
  },
  {
    id: 'sales-tax',
    name: 'Sales Tax Filing',
    description: 'Calculate, file, and remit sales tax to appropriate jurisdictions',
    category: 'Tax Preparation & Filing',
    status: 'automated',
    icon: Receipt,
    automationDetails: 'CPA chat provides sales tax guidance and compliance help'
  },
  {
    id: '1099-prep',
    name: '1099 Preparation & Filing',
    description: 'Prepare and file 1099 forms for contractors and vendors',
    category: 'Tax Preparation & Filing',
    status: 'automated',
    icon: FileSpreadsheet,
    automationDetails: 'CPA chat provides 1099 contractor guidance and requirements'
  },
  {
    id: 'tax-planning',
    name: 'Tax Planning & Strategy',
    description: 'Develop strategies to minimize tax liability throughout the year',
    category: 'Tax Preparation & Filing',
    status: 'automated',
    icon: Target,
    automationDetails: 'CPA chat provides tax planning strategies, quarterly estimates, deduction finder'
  },

  // Financial Analysis & Planning
  {
    id: 'budget-creation',
    name: 'Budget Creation & Management',
    description: 'Create budgets and track actual vs. budgeted performance',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: PieChart,
    automationDetails: 'Category-based budgeting, real-time tracking, variance analysis'
  },
  {
    id: 'financial-forecasting',
    name: 'Financial Forecasting',
    description: 'Project future revenue, expenses, and cash flow',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: TrendingUp,
    automationDetails: 'Revenue projections, expense forecasts, scenario modeling'
  },
  {
    id: 'cash-flow-analysis',
    name: 'Cash Flow Analysis',
    description: 'Analyze cash flow patterns and predict future cash needs',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: BarChart3,
    automationDetails: 'Burn rate calculator, runway projections, cash flow tracking'
  },
  {
    id: 'ratio-analysis',
    name: 'Financial Ratio Analysis',
    description: 'Calculate and interpret key financial ratios (liquidity, profitability, etc.)',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: Calculator,
    automationDetails: 'Business Health Score + CPA chat provides profitability and ratio analysis'
  },
  {
    id: 'variance-analysis',
    name: 'Budget Variance Analysis',
    description: 'Analyze differences between budgeted and actual performance',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: BarChart3,
    automationDetails: 'Real-time budget vs actual tracking'
  },
  {
    id: 'breakeven-analysis',
    name: 'Break-Even Analysis',
    description: 'Calculate break-even points and contribution margins',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: Target,
    automationDetails: 'CPA chat provides break-even analysis and pricing strategy recommendations'
  },
  {
    id: 'profit-margin',
    name: 'Profit Margin Analysis',
    description: 'Analyze gross and net profit margins by product/service',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: TrendingUp,
    automationDetails: 'CPA chat provides profitability analysis and margin recommendations'
  },
  {
    id: 'cost-accounting',
    name: 'Cost Accounting',
    description: 'Track and allocate costs to products, services, or departments',
    category: 'Financial Analysis & Planning',
    status: 'automated',
    icon: Calculator,
    automationDetails: 'CPA chat provides expense optimization and cost analysis'
  },

  // Payroll & HR Financial Management
  {
    id: 'payroll-processing',
    name: 'Payroll Processing',
    description: 'Calculate wages, withholdings, and process employee payments',
    category: 'Payroll & HR Financial Management',
    status: 'automated',
    icon: Users,
    automationDetails: 'CPA chat provides payroll setup guidance and requirements'
  },
  {
    id: 'payroll-taxes',
    name: 'Payroll Tax Filing',
    description: 'Calculate and remit payroll taxes to federal and state agencies',
    category: 'Payroll & HR Financial Management',
    status: 'planned',
    icon: FileCheck,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To automate payroll tax filing, I need integration with government tax agencies and payroll processors.',
      requirements: [
        '🔐 **IRS EFTPS Account Credentials** - Your Electronic Federal Tax Payment System login for federal payroll tax deposits',
        '🏛️ **State Tax Agency Credentials** - Login credentials for each state where you have employees (e.g., EDD for California, TWC for Texas)',
        '📋 **Payroll Schedule** - Whether you pay employees weekly, bi-weekly, semi-monthly, or monthly',
        '💳 **Bank Account for Tax Payments** - Dedicated bank account details for automatic tax withdrawals',
        '📝 **Business Tax IDs** - Federal EIN and state employer identification numbers',
        '🔗 **Payroll Software API Access** (Optional) - If you use Gusto, ADP, or similar, provide API credentials for seamless integration'
      ]
    }
  },
  {
    id: 'w2-prep',
    name: 'W-2 Preparation',
    description: 'Prepare and file W-2 forms for employees',
    category: 'Payroll & HR Financial Management',
    status: 'planned',
    icon: FileSpreadsheet,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To automate W-2 preparation and filing, I need complete employee payroll records and government filing credentials.',
      requirements: [
        '👥 **Employee Data** - Full name, SSN, address, and tax withholding elections (W-4 forms) for all employees',
        '💰 **Full-Year Payroll Records** - Wages paid, federal/state/local taxes withheld, Social Security, Medicare for each employee',
        '🏢 **Employer Information** - Complete business name, EIN, address, state employer ID',
        '🔐 **SSA Business Services Online Account** - Credentials for filing W-2s with the Social Security Administration',
        '🏛️ **State Tax Filing Credentials** - Login for state-level W-2 filing portals (varies by state)',
        '📧 **Employee Email Addresses** - For electronic W-2 delivery (optional but recommended)',
        '🔗 **Payroll Integration** - API access to your payroll system (Gusto, QuickBooks Payroll, etc.) or CSV export of annual payroll data'
      ]
    }
  },
  {
    id: 'benefits-accounting',
    name: 'Employee Benefits Accounting',
    description: 'Track and account for employee benefits costs',
    category: 'Payroll & HR Financial Management',
    status: 'planned',
    icon: ShieldCheck,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To automate benefits accounting, I need details about your benefits plans and insurance providers.',
      requirements: [
        '🏥 **Health Insurance Plan Details** - Provider name, group policy number, premium amounts (employer vs. employee share)',
        '🦷 **Dental/Vision Plans** - Coverage details and contribution breakdown',
        '🏦 **401(k) Plan Information** - Provider, employer match percentage, contribution limits, vesting schedule',
        '🏖️ **PTO/Vacation Accrual Policy** - How vacation and sick time accrues and is valued financially',
        '💼 **Other Benefits** - Life insurance, disability insurance, HSA/FSA contributions, commuter benefits, etc.',
        '📊 **Benefits Provider Portals** - Login credentials or API access to benefits administration platforms (e.g., Zenefits, Justworks, Rippling)',
        '💳 **Monthly Invoice Records** - Benefits provider invoices showing employer costs per employee',
        '👥 **Employee Enrollment Data** - Who is enrolled in which plans and at what coverage levels'
      ]
    }
  },

  // Asset & Inventory Management
  {
    id: 'fixed-assets',
    name: 'Fixed Asset Tracking',
    description: 'Track fixed assets and calculate depreciation',
    category: 'Asset & Inventory Management',
    status: 'planned',
    icon: Building,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To automate fixed asset tracking, I need a complete inventory of your business assets and their details.',
      requirements: [
        '📝 **Asset List** - Every significant asset you own: equipment, vehicles, computers, furniture, buildings, etc.',
        '💵 **Purchase Information** - Original purchase price, date acquired, vendor/seller for each asset',
        '🏷️ **Asset Classification** - What type of asset it is (5-year property, 7-year property, real estate, etc.)',
        '📍 **Location & Condition** - Where each asset is located and its current condition',
        '🔖 **Serial Numbers/IDs** - Unique identifiers for tracking purposes',
        '📄 **Purchase Receipts** - Original invoices or receipts showing cost basis',
        '🛠️ **Depreciation Method Preference** - Straight-line, MACRS, Section 179 election, bonus depreciation preferences',
        '📸 **Photos of High-Value Assets** (Optional) - For insurance and verification purposes',
        '🔗 **ERP/Asset Management System** (Optional) - API access if you already track assets in software'
      ]
    }
  },
  {
    id: 'depreciation',
    name: 'Depreciation Calculations',
    description: 'Calculate and record depreciation using various methods',
    category: 'Asset & Inventory Management',
    status: 'planned',
    icon: Calculator,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To automate depreciation calculations, I need your fixed asset register and tax preferences.',
      requirements: [
        '📋 **Fixed Asset Register** - Complete list from "Fixed Asset Tracking" above (this depends on that service)',
        '🗓️ **Placed-in-Service Dates** - Exact date each asset started being used in your business',
        '⚖️ **Depreciation Method Elections** - Whether you want to use Section 179 immediate expensing, bonus depreciation, or MACRS',
        '🧮 **Useful Life Assumptions** - How many years each asset class should be depreciated over',
        '💰 **Salvage Value Estimates** - Expected residual value at end of useful life (often $0 for tax purposes)',
        '📊 **Tax vs. Book Preference** - Whether you want tax depreciation, book depreciation, or both tracked separately',
        '🔄 **Prior Depreciation Records** - If assets were purchased in previous years, I need accumulated depreciation already taken',
        '💡 **Tax Strategy Consultation** - Are you maximizing immediate deductions or smoothing income? This affects depreciation strategy'
      ]
    }
  },
  {
    id: 'inventory-accounting',
    name: 'Inventory Accounting',
    description: 'Track inventory levels, costs, and calculate COGS',
    category: 'Asset & Inventory Management',
    status: 'planned',
    icon: Briefcase,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To automate inventory accounting, I need access to your inventory system and costing methodology.',
      requirements: [
        '📦 **Inventory Management System Access** - API credentials or CSV exports from your inventory platform (Shopify, Square, ShipStation, etc.)',
        '🏷️ **Product SKU List** - All product identifiers with descriptions',
        '💵 **Cost Information** - What you paid for each unit of inventory (landed cost including shipping)',
        '📊 **Costing Method** - FIFO (First In First Out), LIFO (Last In First Out), or Weighted Average',
        '📍 **Storage Locations** - Warehouse addresses, fulfillment centers, retail locations holding inventory',
        '🔢 **Current Inventory Count** - Physical inventory count with quantities per SKU',
        '📥 **Purchase Orders** - Records of inventory purchases from suppliers',
        '📤 **Sales Orders** - Records of inventory sold to customers',
        '🔗 **E-commerce Integration** - Shopify, WooCommerce, Amazon, etc. - provide API access for automated syncing',
        '🚚 **Supplier Information** - Vendor names and payment terms for COGS calculation',
        '📝 **Returns & Adjustments** - How you handle damaged goods, returns, shrinkage'
      ]
    }
  },

  // Compliance & Audit Support
  {
    id: 'audit-prep',
    name: 'Audit Preparation',
    description: 'Prepare documentation and schedules for financial audits',
    category: 'Compliance & Audit Support',
    status: 'automated',
    icon: FileCheck,
    automationDetails: 'CPA chat provides audit preparation guidance and documentation checklists'
  },
  {
    id: 'compliance-monitoring',
    name: 'Regulatory Compliance Monitoring',
    description: 'Ensure compliance with accounting standards and regulations',
    category: 'Compliance & Audit Support',
    status: 'automated',
    icon: ShieldCheck,
    automationDetails: 'CPA chat provides compliance reviews and regulatory guidance'
  },
  {
    id: 'internal-controls',
    name: 'Internal Controls Implementation',
    description: 'Design and implement internal controls to prevent fraud',
    category: 'Compliance & Audit Support',
    status: 'planned',
    icon: ShieldCheck,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To implement internal controls, I need to understand your business processes and access permissions.',
      requirements: [
        '👥 **Org Chart & Roles** - Who does what in your company? Who approves purchases, processes payroll, has bank access?',
        '🏦 **Bank Account Structure** - How many accounts, who has signing authority, what are approval limits?',
        '💳 **Credit Card Policy** - Who has corporate cards, what are spending limits, how are expenses reviewed?',
        '✅ **Current Approval Workflows** - How do you currently approve invoices, POs, expense reports, journal entries?',
        '🔐 **System Access List** - Who has access to your accounting software, banking, payroll systems?',
        '📋 **Delegation of Authority Matrix** - What dollar amounts can each person approve without escalation?',
        '📝 **Past Issues** - Have you experienced any fraud, errors, or control failures in the past?',
        '🎯 **Risk Tolerance** - How strict do you want controls vs. operational efficiency?',
        '📊 **Industry Requirements** - Any industry-specific compliance requirements (SOC 2, PCI-DSS, etc.)?',
        '🔗 **Integration Access** - Permissions to set up approval workflows in your accounting/banking platforms'
      ]
    }
  },
  {
    id: 'fraud-prevention',
    name: 'Fraud Prevention & Detection',
    description: 'Monitor for unusual transactions and potential fraud',
    category: 'Compliance & Audit Support',
    status: 'planned',
    icon: AlertCircle,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To set up fraud monitoring, I need access to your financial systems and baseline behavior patterns.',
      requirements: [
        '🏦 **Real-Time Bank Feed Access** - Plaid or direct bank API to monitor transactions as they happen',
        '📊 **Historical Transaction Data** - At least 6-12 months of past transactions to establish "normal" patterns',
        '👥 **Employee/Vendor Lists** - Authorized personnel and vendors to whitelist expected activity',
        '💰 **Transaction Thresholds** - What dollar amounts should trigger alerts? (e.g., $5,000+, $10,000+)',
        '🚨 **Notification Preferences** - Email, SMS, or in-app alerts? Who should be notified?',
        '🕐 **After-Hours Policy** - Are transactions expected outside business hours? Weekends?',
        '🌍 **Geographic Boundaries** - Where do you normally do business? International transactions expected?',
        '💳 **Credit Card Data** - Access to corporate card transactions for duplicate/unusual purchase monitoring',
        '👤 **Key Personnel Schedules** - When are CFO/CEO on vacation? (heightened fraud risk periods)',
        '📝 **Known Risk Factors** - Any employees with financial access concerns? Vendors with past issues?',
        '🔗 **Accounting Software Admin Access** - To review user activity logs and detect unauthorized changes',
        '⚙️ **Alert Customization** - What types of anomalies concern you most? (duplicate invoices, off-cycle payroll, new vendors, etc.)'
      ]
    }
  },

  // Advisory & Strategic Services
  {
    id: 'financial-advisory',
    name: 'Financial Advisory Services',
    description: 'Provide strategic financial guidance and recommendations',
    category: 'Advisory & Strategic Services',
    status: 'automated',
    icon: Sparkles,
    automationDetails: 'CPA chat provides business health checks, growth strategy, pricing analysis, and KPI setup'
  },
  {
    id: 'business-valuation',
    name: 'Business Valuation',
    description: 'Estimate business value for sale, investment, or planning purposes',
    category: 'Advisory & Strategic Services',
    status: 'automated',
    icon: TrendingUp,
    automationDetails: 'CPA chat provides business valuation methods and growth strategy analysis'
  },
  {
    id: 'kpi-tracking',
    name: 'KPI Tracking & Dashboards',
    description: 'Track key performance indicators and create executive dashboards',
    category: 'Advisory & Strategic Services',
    status: 'automated',
    icon: BarChart3,
    automationDetails: 'Real-time financial dashboards + CPA chat helps setup custom KPIs'
  },
  {
    id: 'investor-reporting',
    name: 'Investor/Board Reporting',
    description: 'Prepare financial reports and presentations for investors and board',
    category: 'Advisory & Strategic Services',
    status: 'automated',
    icon: Briefcase,
    automationDetails: 'CPA chat helps create investor reports and financial presentations'
  },
  {
    id: 'loan-support',
    name: 'Loan Application Support',
    description: 'Prepare financial documents for loan applications',
    category: 'Advisory & Strategic Services',
    status: 'planned',
    icon: Building,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To prepare loan application materials, I need your full financial picture and business plan details.',
      requirements: [
        '🏦 **Loan Purpose & Amount** - What are you borrowing for? How much do you need?',
        '📊 **3 Years of Financial Statements** - Historical P&L, balance sheets, cash flow statements (I can generate from your transaction data if you\'ve been using Cofounder+)',
        '📈 **Financial Projections** - 3-5 year revenue and expense forecasts with assumptions',
        '💼 **Business Plan** - Executive summary, market analysis, competitive positioning',
        '🏢 **Business Entity Documents** - Articles of incorporation, operating agreement, ownership structure',
        '👥 **Personal Financial Statements** - For owners with 20%+ ownership (often required by lenders)',
        '💳 **Personal & Business Credit Scores** - I can help you pull these or you can provide',
        '🏠 **Collateral Information** - What assets can secure the loan? (real estate, equipment, inventory)',
        '📋 **Existing Debt Schedule** - List of current loans, balances, payment terms, lenders',
        '💰 **Use of Funds Breakdown** - Exactly how you\'ll spend the loan proceeds',
        '📝 **Tax Returns** - 2-3 years of business tax returns (I can help organize/review)',
        '🎯 **Lender Preference** - SBA loan, traditional bank, online lender? Different requirements for each'
      ]
    }
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence Support',
    description: 'Support M&A transactions with financial due diligence',
    category: 'Advisory & Strategic Services',
    status: 'planned',
    icon: FileCheck,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To conduct financial due diligence, I need comprehensive access to your financial records and legal documents.',
      requirements: [
        '📊 **Complete Financial History** - 3-5 years of detailed financial statements, tax returns, and supporting documentation',
        '🏦 **Bank Statements** - Full bank and credit card statements for all accounts for the past 24-36 months',
        '📋 **Customer & Revenue Analysis** - Customer concentration, recurring revenue, contract terms, churn rate',
        '👥 **Employee Information** - Headcount, compensation details, key employee contracts, equity grants',
        '⚖️ **Legal Documents** - Contracts with customers, vendors, leases, IP assignments, litigation history',
        '💼 **Capital Structure** - Cap table, outstanding equity/debt, convertible notes, warrants, options',
        '📈 **Growth Metrics** - MRR/ARR, CAC, LTV, gross/net retention, unit economics by product/segment',
        '🔍 **Contingent Liabilities** - Pending lawsuits, warranty claims, environmental issues, tax audits',
        '🏢 **Asset Registry** - All owned assets, leased equipment, software licenses, real estate',
        '💡 **IP Portfolio** - Patents, trademarks, copyrights, trade secrets, domain names',
        '🔗 **System Access** - Read-only access to accounting, CRM, HRIS, and other business systems for data extraction',
        '📝 **Quality of Earnings Report** - I can prepare this showing normalized EBITDA and one-time adjustments',
        '🎯 **Transaction Context** - Are you buying or selling? What are the buyer\'s main concerns?',
        '🗂️ **Data Room Setup** - Virtual data room credentials or I can help organize one'
      ]
    }
  },

  // Quarterly & Annual Reviews
  {
    id: 'quarterly-reviews',
    name: 'Quarterly Financial Reviews',
    description: 'Conduct comprehensive quarterly financial performance reviews',
    category: 'Quarterly & Annual Reviews',
    status: 'planned',
    icon: FileCheck,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To conduct meaningful quarterly reviews, I need your financial data, goals, and stakeholder requirements.',
      requirements: [
        '📊 **Quarterly Financial Close** - Complete and accurate financials for the quarter (I can help prepare these)',
        '🎯 **Budget vs. Actual** - Original budget/plan to compare against actual performance',
        '📈 **KPI Dashboard** - Key metrics you track: revenue growth, margins, cash burn, customer metrics, etc.',
        '👥 **Review Attendees** - Who participates? CEO, CFO, board members, investors? What do they care about?',
        '📋 **Prior Quarter Action Items** - What did you commit to improving last quarter?',
        '🔮 **Updated Forecast** - Revised projections for the rest of the year based on Q1/Q2/Q3 actuals',
        '💰 **Cash Flow Analysis** - Current runway, upcoming large expenses, seasonal patterns',
        '🏆 **Strategic Goals** - What are you trying to achieve this year? How is the quarter tracking?',
        '⚠️ **Known Issues** - Any problem areas that need addressing? (late customers, cost overruns, etc.)',
        '📝 **Management Discussion** - Qualitative context: market conditions, wins, losses, team changes',
        '📅 **Review Schedule** - When do you want these? (within 15 days of quarter end is best practice)',
        '📊 **Report Format** - Slide deck? Written memo? Executive summary? What has worked for you before?',
        '🔗 **Stakeholder Communication** - Do these feed into board decks, investor updates, or internal only?'
      ]
    }
  },
  {
    id: 'annual-planning',
    name: 'Annual Budget Planning',
    description: 'Facilitate annual budgeting and strategic planning process',
    category: 'Quarterly & Annual Reviews',
    status: 'planned',
    icon: Target,
    whatsNeeded: {
      title: 'What I Need to Automate This',
      description: 'To create a comprehensive annual budget, I need your strategic vision and detailed operational plans.',
      requirements: [
        '🎯 **Strategic Objectives** - What are the top 3-5 goals for next year? (revenue targets, new products, expansion, profitability)',
        '📊 **Historical Performance** - 2-3 years of past financial results to establish baselines and trends',
        '👥 **Headcount Plan** - How many employees in each department? Any planned hires? Raises?',
        '💰 **Compensation Philosophy** - Salary bands, bonus structure, equity plan, benefits costs per employee',
        '📈 **Revenue Model** - How do you make money? Pricing changes planned? New revenue streams?',
        '🎲 **Growth Assumptions** - Customer acquisition targets, conversion rates, churn, average deal size',
        '💳 **Known Expenses** - Existing contracts, rent, software subscriptions, insurance that will continue',
        '🚀 **New Initiatives Budget** - Marketing campaigns, R&D projects, capital expenditures planned',
        '📅 **Seasonality Factors** - Are there months with higher/lower revenue or expenses?',
        '🏦 **Cash Flow Constraints** - Any debt payments, investor expectations, minimum cash reserves needed?',
        '⚖️ **Department Input** - Have you asked each team lead what they need? (sales, marketing, engineering, ops)',
        '🔮 **Scenario Planning** - Best case, base case, worst case assumptions for key drivers',
        '📋 **Board/Investor Expectations** - Do they require certain metrics? (break-even timeline, growth rate, burn rate)',
        '🗓️ **Planning Timeline** - When do you need the budget finalized? (best practice: by mid-December for next year)',
        '🔄 **Review Cadence** - Monthly variance reviews? Quarterly re-forecasting? How will you track progress?'
      ]
    }
  },

  // Industry-Specific Accounting
  {
    id: 'saas-revenue-recognition',
    name: 'SaaS Revenue Recognition (ASC 606)',
    description: 'Track deferred revenue, recognize subscription revenue over time according to GAAP',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: Repeat,
    automationDetails: 'CPA chat provides ASC 606 guidance, calculates deferred revenue schedules, tracks performance obligations. Upload subscription contracts and revenue data for analysis.'
  },
  {
    id: 'ecommerce-accounting',
    name: 'E-commerce Accounting',
    description: 'Track online sales, marketplace fees, refunds, chargebacks, and sales tax by jurisdiction',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: ShoppingCart,
    automationDetails: 'Transaction categorization automatically handles sales revenue, marketplace fees, refunds. CPA chat analyzes sales patterns, calculates margins, advises on sales tax nexus. Upload payment processor statements for complete analysis.'
  },
  {
    id: 'construction-accounting',
    name: 'Construction Job Costing',
    description: 'Track costs by project, calculate percentage of completion, manage retainage',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: Building,
    automationDetails: 'Use transaction tags to track costs by project. CPA chat calculates percentage of completion, job profitability, retainage schedules, and WIP reports. Provides construction-specific financial analysis and billing guidance.'
  },
  {
    id: 'restaurant-accounting',
    name: 'Restaurant & Food Service Accounting',
    description: 'Track food costs, labor costs, recipe costing, daily sales reconciliation',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: Briefcase,
    automationDetails: 'Expense categorization tracks food costs vs labor. CPA chat calculates prime cost percentage, analyzes vendor spending, reconciles daily sales. Provides restaurant-specific KPIs and margin analysis.'
  },
  {
    id: 'manufacturing-accounting',
    name: 'Manufacturing Cost Accounting',
    description: 'Track raw materials, work-in-process, finished goods, calculate cost of goods manufactured',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: Factory,
    automationDetails: 'Transaction system tracks inventory purchases and COGS. CPA chat guides through manufacturing cost accounting, calculates standard costs, variance analysis, and inventory valuation. Helps set up proper inventory tracking and costing methods.'
  },
  {
    id: 'nonprofit-accounting',
    name: 'Nonprofit Fund Accounting',
    description: 'Track restricted vs unrestricted funds, grant accounting, program expense allocation',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: Award,
    automationDetails: 'Use transaction tags to separate funds and programs. CPA chat provides nonprofit accounting guidance, functional expense allocation, grant compliance tracking, and Form 990 preparation assistance. Tracks restricted vs unrestricted funds.'
  },
  {
    id: 'real-estate-accounting',
    name: 'Real Estate & Property Management',
    description: 'Track rental income, vacancy, maintenance, depreciation, 1031 exchanges',
    category: 'Industry-Specific Accounting',
    status: 'automated',
    icon: Home,
    automationDetails: 'Transaction tags track income and expenses by property. CPA chat calculates depreciation schedules, NOI, cap rates, and advises on 1031 exchanges. Provides property-specific P&Ls and performance analysis.'
  },

  // Advanced Bookkeeping Services
  {
    id: 'multi-entity-accounting',
    name: 'Multi-Entity Consolidation',
    description: 'Manage multiple legal entities, consolidate financials, eliminate intercompany transactions',
    category: 'Advanced Bookkeeping',
    status: 'automated',
    icon: Layers,
    automationDetails: 'Multi-business support allows separate books per entity. CPA chat guides consolidation process, calculates intercompany eliminations, provides consolidated financial statements. Supports multiple legal entities under one account.'
  },
  {
    id: 'foreign-currency',
    name: 'Foreign Currency Accounting',
    description: 'Handle multi-currency transactions, exchange rate fluctuations, translation adjustments',
    category: 'Advanced Bookkeeping',
    status: 'automated',
    icon: Globe,
    automationDetails: 'CPA chat provides foreign currency accounting guidance, calculates exchange rate gains/losses, advises on translation methods. Helps track multi-currency transactions and provides proper GAAP treatment for foreign operations.'
  },
  {
    id: 'accrual-conversion',
    name: 'Cash to Accrual Conversion',
    description: 'Convert cash-basis books to accrual basis, track prepaid expenses and deferred revenue',
    category: 'Advanced Bookkeeping',
    status: 'automated',
    icon: RefreshCw,
    automationDetails: 'CPA chat provides accrual accounting guidance, helps identify accruals and deferrals needed'
  },
  {
    id: 'recurring-transactions',
    name: 'Recurring Transaction Automation',
    description: 'Automate recurring bills, subscriptions, payroll, rent, and other predictable expenses',
    category: 'Advanced Bookkeeping',
    status: 'automated',
    icon: Repeat,
    automationDetails: 'AI identifies recurring transaction patterns and auto-categorizes them. CPA chat analyzes subscription spending, identifies opportunities to cancel unused services, tracks price increases, and provides renewal reminders.'
  },
  {
    id: 'credit-card-reconciliation',
    name: 'Credit Card Reconciliation',
    description: 'Match credit card transactions, track employee cards, handle disputes and chargebacks',
    category: 'Advanced Bookkeeping',
    status: 'automated',
    icon: CreditCard,
    automationDetails: 'Automated credit card sync, transaction matching, dispute tracking with CPA chat guidance'
  },
  {
    id: 'loan-amortization',
    name: 'Loan & Debt Amortization',
    description: 'Track loan balances, principal vs interest, create amortization schedules',
    category: 'Advanced Bookkeeping',
    status: 'automated',
    icon: TrendingDown,
    automationDetails: 'CPA chat creates amortization schedules, calculates principal vs interest splits, tracks loan balances, and monitors debt covenants. Provides debt service coverage analysis and refinancing recommendations.'
  },

  // Management & Performance Reporting
  {
    id: 'kpi-dashboards',
    name: 'Real-Time KPI Dashboards',
    description: 'Custom dashboards tracking your most important business metrics in real-time',
    category: 'Management Reporting',
    status: 'automated',
    icon: BarChart3,
    automationDetails: 'Real-time dashboards with customizable KPIs, visual charts, trend analysis'
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary Reports',
    description: 'One-page executive summary of financial performance for busy leaders',
    category: 'Management Reporting',
    status: 'automated',
    icon: FileText,
    automationDetails: 'CPA chat generates executive summaries with key metrics, variance analysis, insights'
  },
  {
    id: 'departmental-reporting',
    name: 'Department P&L Statements',
    description: 'Profit & loss by department or business unit for accountability',
    category: 'Management Reporting',
    status: 'automated',
    icon: GitBranch,
    automationDetails: 'Use transaction tags for department tracking. CPA chat creates P&Ls by department, allocates shared costs, calculates contribution margins, and provides departmental performance analysis with budget vs actual comparisons.'
  },
  {
    id: 'rolling-forecast',
    name: 'Rolling 12-Month Forecast',
    description: 'Continuously updated forecast rolling forward 12 months based on actuals',
    category: 'Management Reporting',
    status: 'automated',
    icon: Calendar,
    automationDetails: 'CPA chat analyzes historical trends and creates rolling 12-month forecasts. Incorporates seasonality, growth assumptions, and known future events. Provides scenario modeling and continuously updates based on actual results.'
  },
  {
    id: 'unit-economics',
    name: 'Unit Economics Analysis',
    description: 'Calculate customer lifetime value, customer acquisition cost, payback period',
    category: 'Management Reporting',
    status: 'automated',
    icon: Target,
    automationDetails: 'CPA chat analyzes unit economics, calculates LTV:CAC ratio, identifies improvement opportunities'
  },
  {
    id: 'cohort-analysis',
    name: 'Cohort Revenue Analysis',
    description: 'Track revenue retention and growth by customer cohort over time',
    category: 'Management Reporting',
    status: 'automated',
    icon: Users,
    automationDetails: 'CPA chat analyzes transaction data to perform cohort analysis. Tracks customer retention, expansion revenue, and churn by cohort. Calculates cohort-based LTV and identifies which customer segments are most valuable.'
  },

  // Specialized Financial Services
  {
    id: 'equity-compensation',
    name: 'Stock Options & Equity Tracking',
    description: 'Track stock option grants, vesting schedules, 409A valuations, cap table management',
    category: 'Specialized Financial Services',
    status: 'automated',
    icon: TrendingUp,
    automationDetails: 'CPA chat tracks option grants, calculates vesting schedules, models dilution scenarios, and provides 409A valuation guidance. Helps maintain cap table records and calculate equity compensation expense for financial statements.'
  },
  {
    id: 'grant-management',
    name: 'Grant Fund Management',
    description: 'Track government grants, foundation grants, compliance requirements, grant reporting',
    category: 'Specialized Financial Services',
    status: 'automated',
    icon: Award,
    automationDetails: 'Transaction tags separate grant funds. CPA chat tracks allowable costs, matching requirements, drawdown schedules, and reporting deadlines. Provides grant compliance guidance and helps prepare required financial reports.'
  },
  {
    id: 'royalty-accounting',
    name: 'Royalty & Licensing Revenue',
    description: 'Track royalty payments, licensing agreements, usage-based revenue',
    category: 'Specialized Financial Services',
    status: 'automated',
    icon: Sparkles,
    automationDetails: 'CPA chat tracks royalty agreements, calculates royalty payments, monitors minimum guarantees, and reconciles licensee reports. Provides royalty income analysis and identifies discrepancies in payments.'
  },
  {
    id: 'project-accounting',
    name: 'Project-Based Accounting',
    description: 'Track profitability by project, allocate costs, calculate project margins',
    category: 'Specialized Financial Services',
    status: 'automated',
    icon: Briefcase,
    automationDetails: 'Use transaction tags to track revenue and costs by project. CPA chat calculates project profitability, tracks budget vs actual, analyzes margins, and provides project performance insights. Supports time & materials, fixed fee, and milestone billing.'
  },

  // Compliance & Regulatory
  {
    id: 'sales-tax-automation',
    name: 'Automated Sales Tax Compliance',
    description: 'Calculate sales tax by jurisdiction, file returns, handle nexus determinations',
    category: 'Compliance & Regulatory',
    status: 'automated',
    icon: Receipt,
    automationDetails: 'CPA chat analyzes sales by state, determines nexus obligations, calculates sales tax liabilities, and provides filing guidance. Tracks registrations, filing deadlines, and helps prepare sales tax returns for each jurisdiction.'
  },
  {
    id: 'unclaimed-property',
    name: 'Unclaimed Property Compliance',
    description: 'Track unclaimed checks, report and remit to states per escheatment laws',
    category: 'Compliance & Regulatory',
    status: 'automated',
    icon: AlertCircle,
    automationDetails: 'CPA chat tracks aging checks and credits, identifies unclaimed property, calculates dormancy periods by state, and provides escheatment reporting guidance. Monitors compliance deadlines and helps prepare required filings.'
  },
  {
    id: 'nonprofit-990',
    name: 'Nonprofit Form 990 Preparation',
    description: 'Prepare and file IRS Form 990 for nonprofit organizations',
    category: 'Compliance & Regulatory',
    status: 'automated',
    icon: FileCheck,
    automationDetails: 'CPA chat guides through Form 990 preparation, organizes financial data by functional classification, tracks program accomplishments, and ensures compliance with IRS requirements. Helps complete all schedules and provides filing guidance.'
  },
];

export function CPAServicesAutomation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(cpaServices.map(s => s.category)));

  // Filter services
  const filteredServices = cpaServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    const matchesStatus = !selectedStatus || service.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group by category
  const servicesByCategory = categories.map(category => ({
    category,
    services: filteredServices.filter(s => s.category === category)
  })).filter(group => group.services.length > 0);

  // Count by status
  const automatedCount = cpaServices.filter(s => s.status === 'automated').length;
  const inProgressCount = cpaServices.filter(s => s.status === 'in-progress').length;
  const plannedCount = cpaServices.filter(s => s.status === 'planned').length;
  const totalCount = cpaServices.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'automated':
        return (
          <Badge 
            style={{ 
              backgroundColor: 'var(--success-soft)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-1) var(--spacing-2)',
            }}
          >
            <CheckCircle2 className="w-3 h-3" style={{ marginRight: 'var(--spacing-1)' }} />
            Automated
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge 
            style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-1) var(--spacing-2)',
            }}
          >
            <Clock className="w-3 h-3" style={{ marginRight: 'var(--spacing-1)' }} />
            In Progress
          </Badge>
        );
      case 'planned':
        return (
          <Badge 
            style={{ 
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-1) var(--spacing-2)',
            }}
          >
            <Circle className="w-3 h-3" style={{ marginRight: 'var(--spacing-1)' }} />
            Planned
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="w-full h-full overflow-y-auto"
      style={{ 
        padding: 'var(--spacing-6)',
        backgroundColor: 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <h1 style={{ marginBottom: 'var(--spacing-2)' }}>CPA Services Automation</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Comprehensive list of all services a CPA provides for businesses. Cofounder Finance is automating every single one.
          </p>
        </div>

        {/* New CPA Chat Feature Callout */}
        <Card 
          style={{ 
            marginBottom: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--primary)',
            background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--success-soft) 100%)',
          }}
        >
          <CardContent style={{ padding: 'var(--spacing-6)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
              <div
                style={{
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles className="w-8 h-8" style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: 'var(--spacing-2)' }}>🎉 NEW: CPA Chat Now Available!</h3>
                <p style={{ marginBottom: 'var(--spacing-3)', color: 'var(--muted-foreground)' }}>
                  Access instant CPA-level expertise in the <strong>Cofounder Finance</strong> tab. Get help with tax planning, 
                  financial analysis, bookkeeping, compliance, and more—powered by ChatGPT with your real financial data.
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                  <Badge style={{ backgroundColor: 'var(--success)', color: 'white', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
                    21 Quick Actions
                  </Badge>
                  <Badge style={{ backgroundColor: 'var(--primary)', color: 'white', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
                    Real-time Analysis
                  </Badge>
                  <Badge style={{ backgroundColor: '#9333ea', color: 'white', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
                    Personalized Advice
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          style={{ marginBottom: 'var(--spacing-6)' }}
        >
          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                    Automated
                  </p>
                  <h2>{automatedCount}</h2>
                </div>
                <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--success)' }} />
              </div>
              <div 
                className="w-full mt-2"
                style={{ 
                  height: '4px', 
                  backgroundColor: 'var(--success-soft)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{ 
                    width: `${(automatedCount / totalCount) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--success)',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                    In Progress
                  </p>
                  <h2>{inProgressCount}</h2>
                </div>
                <Clock className="w-8 h-8" style={{ color: '#3b82f6' }} />
              </div>
              <div 
                className="w-full mt-2"
                style={{ 
                  height: '4px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{ 
                    width: `${(inProgressCount / totalCount) * 100}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                    Planned
                  </p>
                  <h2>{plannedCount}</h2>
                </div>
                <Circle className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <div 
                className="w-full mt-2"
                style={{ 
                  height: '4px', 
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{ 
                    width: `${(plannedCount / totalCount) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--muted-foreground)',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                    Total Services
                  </p>
                  <h2>{totalCount}</h2>
                </div>
                <Sparkles className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              </div>
              <p style={{ marginTop: 'var(--spacing-2)', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                {Math.round((automatedCount / totalCount) * 100)}% Complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cost Savings Dashboard */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <CPAServicesSavings 
            automatedServicesCount={automatedCount}
            totalServicesCount={totalCount}
          />
        </div>

        {/* Usage Tracker */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <CPAServicesUsageTracker />
        </div>

        {/* Filters */}
        <Card 
          style={{ 
            marginBottom: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)'
          }}
        >
          <CardContent style={{ padding: 'var(--spacing-4)' }}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 'var(--spacing-8)' }}
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === null ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(null)}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  All
                </Button>
                <Button
                  variant={selectedStatus === 'automated' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(selectedStatus === 'automated' ? null : 'automated')}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  <CheckCircle2 className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                  Automated
                </Button>
                <Button
                  variant={selectedStatus === 'in-progress' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(selectedStatus === 'in-progress' ? null : 'in-progress')}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  <Clock className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                  In Progress
                </Button>
                <Button
                  variant={selectedStatus === 'planned' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus(selectedStatus === 'planned' ? null : 'planned')}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  <Circle className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                  Planned
                </Button>
              </div>
            </div>

            {/* Category Filter Pills */}
            {selectedCategory && (
              <div style={{ marginTop: 'var(--spacing-3)' }} className="flex flex-wrap gap-2">
                <Badge
                  style={{
                    backgroundColor: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-1) var(--spacing-3)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedCategory(null)}
                >
                  {selectedCategory} ✕
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services by Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {servicesByCategory.map(({ category, services }) => (
            <div key={category}>
              <div 
                style={{ 
                  marginBottom: 'var(--spacing-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <h2>{category}</h2>
                <Badge style={{ 
                  backgroundColor: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                }}>
                  {services.length} {services.length === 1 ? 'service' : 'services'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => {
                  const Icon = service.icon;
                  return (
                    <Card 
                      key={service.id}
                      style={{
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      className="hover:shadow-lg"
                    >
                      <CardHeader style={{ padding: 'var(--spacing-4)', paddingBottom: 'var(--spacing-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                          <div 
                            style={{ 
                              padding: 'var(--spacing-2)',
                              borderRadius: 'var(--radius-lg)',
                              backgroundColor: 'var(--primary-soft)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <CardTitle style={{ marginBottom: 'var(--spacing-2)' }}>
                              {service.name}
                            </CardTitle>
                            {getStatusBadge(service.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent style={{ padding: 'var(--spacing-4)', paddingTop: 0 }}>
                        <p style={{ 
                          color: 'var(--muted-foreground)',
                          marginBottom: service.automationDetails || service.whatsNeeded ? 'var(--spacing-3)' : 0
                        }}>
                          {service.description}
                        </p>
                        
                        {/* Automated Details */}
                        {service.automationDetails && (
                          <div 
                            style={{ 
                              padding: 'var(--spacing-3)',
                              backgroundColor: 'var(--success-soft)',
                              borderRadius: 'var(--radius-lg)',
                              borderLeft: '3px solid var(--success)'
                            }}
                          >
                            <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                              <strong>How it's automated:</strong> {service.automationDetails}
                            </p>
                          </div>
                        )}

                        {/* What's Needed for Planned Services */}
                        {service.whatsNeeded && (
                          <div 
                            style={{ 
                              padding: 'var(--spacing-4)',
                              backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              borderRadius: 'var(--radius-lg)',
                              borderLeft: '3px solid #3b82f6'
                            }}
                          >
                            <h4 style={{ 
                              marginBottom: 'var(--spacing-2)', 
                              color: '#3b82f6',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-2)'
                            }}>
                              <AlertCircle className="w-4 h-4" />
                              {service.whatsNeeded.title}
                            </h4>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              marginBottom: 'var(--spacing-3)',
                              color: 'var(--muted-foreground)' 
                            }}>
                              {service.whatsNeeded.description}
                            </p>
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 'var(--spacing-2)' 
                            }}>
                              {service.whatsNeeded.requirements.map((req, idx) => (
                                <div 
                                  key={idx}
                                  style={{ 
                                    fontSize: '0.8125rem',
                                    color: 'var(--foreground)',
                                    lineHeight: '1.5'
                                  }}
                                >
                                  {req}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
              <AlertCircle 
                className="w-12 h-12 mx-auto"
                style={{ color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-4)' }}
              />
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>No services found</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
