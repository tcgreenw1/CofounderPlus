/**
 * IRS Schedule C Expense Categories Reference
 * 
 * This file provides a complete reference of all 23 IRS Schedule C expense categories
 * available in the IRSCategoryDropdown component.
 * 
 * Use this as a quick reference when integrating the dropdown across the app.
 */

export const IRS_SCHEDULE_C_CATEGORIES = {
  // ========================================
  // OPERATING EXPENSES
  // ========================================
  ADVERTISING: {
    code: 'ADV',
    name: 'Advertising',
    description: 'Business advertising and marketing expenses',
    group: 'Operating Expenses',
    examples: ['Online ads', 'Print ads', 'Social media marketing', 'Promotional materials']
  },

  COMMISSIONS_AND_FEES: {
    code: 'COM',
    name: 'Commissions and Fees',
    description: 'Sales commissions and professional fees',
    group: 'Operating Expenses',
    examples: ['Sales commissions', 'Broker fees', 'Referral fees']
  },

  INSURANCE_OTHER: {
    code: 'INS',
    name: 'Insurance (Other than Health)',
    description: 'Business liability, property insurance',
    group: 'Operating Expenses',
    examples: ['General liability insurance', 'Property insurance', 'Professional liability']
  },

  INTEREST_OTHER: {
    code: 'INT-O',
    name: 'Interest (Other)',
    description: 'Interest on business loans and credit cards',
    group: 'Operating Expenses',
    examples: ['Business loan interest', 'Credit card interest', 'Line of credit interest']
  },

  LEGAL_PROFESSIONAL: {
    code: 'LEG',
    name: 'Legal and Professional Services',
    description: 'Attorney, accountant, consultant fees',
    group: 'Operating Expenses',
    examples: ['Accounting fees', 'Legal fees', 'Consulting services', 'Tax preparation']
  },

  OFFICE_EXPENSE: {
    code: 'OFF',
    name: 'Office Expense',
    description: 'Office supplies, postage, printing',
    group: 'Operating Expenses',
    examples: ['Office supplies', 'Postage', 'Printing', 'Stationery']
  },

  REPAIRS_MAINTENANCE: {
    code: 'REP',
    name: 'Repairs and Maintenance',
    description: 'Repairs to business property and equipment',
    group: 'Operating Expenses',
    examples: ['Equipment repairs', 'Building maintenance', 'Computer repairs']
  },

  SUPPLIES: {
    code: 'SUP',
    name: 'Supplies',
    description: 'Business supplies not elsewhere classified',
    group: 'Operating Expenses',
    examples: ['Manufacturing supplies', 'Cleaning supplies', 'Production materials']
  },

  TAXES_LICENSES: {
    code: 'TAX',
    name: 'Taxes and Licenses',
    description: 'Business taxes, licenses, regulatory fees',
    group: 'Operating Expenses',
    examples: ['Business license fees', 'Property taxes', 'Sales tax', 'Permit fees']
  },

  UTILITIES: {
    code: 'UTI',
    name: 'Utilities',
    description: 'Electricity, gas, water, phone, internet',
    group: 'Operating Expenses',
    examples: ['Electricity', 'Gas', 'Water', 'Internet', 'Phone service']
  },

  OTHER_EXPENSES: {
    code: 'OTH',
    name: 'Other Expenses',
    description: 'Miscellaneous business expenses',
    group: 'Operating Expenses',
    examples: ['Bank fees', 'Credit card processing fees', 'Subscriptions']
  },

  // ========================================
  // VEHICLE & TRAVEL
  // ========================================
  CAR_TRUCK: {
    code: 'CAR',
    name: 'Car and Truck Expenses',
    description: 'Vehicle expenses for business use',
    group: 'Vehicle & Travel',
    examples: ['Gas', 'Oil changes', 'Car repairs', 'Vehicle insurance', 'Car washes']
  },

  TRAVEL: {
    code: 'TRV',
    name: 'Travel',
    description: 'Airfare, hotels, meals while traveling',
    group: 'Vehicle & Travel',
    examples: ['Airfare', 'Hotels', 'Rental cars', 'Travel meals', 'Conference fees']
  },

  MEALS_ENTERTAINMENT: {
    code: 'MEL',
    name: 'Meals and Entertainment',
    description: 'Business meals (50% deductible)',
    group: 'Vehicle & Travel',
    examples: ['Client meals', 'Business lunches', 'Team dinners']
  },

  // ========================================
  // PERSONNEL
  // ========================================
  CONTRACT_LABOR: {
    code: 'CON',
    name: 'Contract Labor',
    description: 'Payments to independent contractors',
    group: 'Personnel',
    examples: ['Freelancer payments', '1099 contractors', 'Subcontractor fees']
  },

  EMPLOYEE_BENEFITS: {
    code: 'EMP',
    name: 'Employee Benefit Programs',
    description: 'Health insurance, retirement plans, etc.',
    group: 'Personnel',
    examples: ['Health insurance premiums', 'Dental insurance', 'Vision insurance']
  },

  PENSION_PROFIT_SHARING: {
    code: 'PEN',
    name: 'Pension and Profit-Sharing Plans',
    description: 'Employer contributions to retirement plans',
    group: 'Personnel',
    examples: ['401(k) contributions', 'SEP IRA contributions', 'Simple IRA']
  },

  WAGES: {
    code: 'WAG',
    name: 'Wages',
    description: 'Employee salaries and wages',
    group: 'Personnel',
    examples: ['Employee salaries', 'Hourly wages', 'Bonuses', 'W-2 wages']
  },

  // ========================================
  // PROPERTY & RENT
  // ========================================
  INTEREST_MORTGAGE: {
    code: 'INT',
    name: 'Interest (Mortgage)',
    description: 'Mortgage interest on business property',
    group: 'Property & Rent',
    examples: ['Office building mortgage interest', 'Warehouse mortgage interest']
  },

  RENT_VEHICLES_EQUIPMENT: {
    code: 'REN',
    name: 'Rent or Lease (Vehicles, Machinery, Equipment)',
    description: 'Equipment and vehicle leases',
    group: 'Property & Rent',
    examples: ['Equipment leases', 'Vehicle leases', 'Machinery rentals']
  },

  RENT_OTHER_PROPERTY: {
    code: 'REN-O',
    name: 'Rent or Lease (Other Business Property)',
    description: 'Office space, warehouse rental',
    group: 'Property & Rent',
    examples: ['Office rent', 'Warehouse rent', 'Storage unit rental']
  },

  HOME_OFFICE: {
    code: 'HOM',
    name: 'Home Office',
    description: 'Deduction for business use of home',
    group: 'Property & Rent',
    examples: ['Portion of mortgage interest', 'Property taxes', 'Utilities', 'Repairs']
  },

  // ========================================
  // ASSETS & DEPRECIATION
  // ========================================
  DEPRECIATION: {
    code: 'DEP',
    name: 'Depreciation',
    description: 'Depreciation of business assets',
    group: 'Assets & Depreciation',
    examples: ['Equipment depreciation', 'Vehicle depreciation', 'Building depreciation']
  }
} as const;

/**
 * Quick Usage Example:
 * 
 * import { IRSCategoryDropdown } from './components/IRSCategoryDropdown';
 * import { IRS_SCHEDULE_C_CATEGORIES } from './components/IRS_CATEGORIES_REFERENCE';
 * 
 * function MyComponent() {
 *   const [category, setCategory] = useState('');
 *   
 *   // Use the dropdown
 *   <IRSCategoryDropdown value={category} onChange={setCategory} />
 *   
 *   // Access category info
 *   const categoryInfo = Object.values(IRS_SCHEDULE_C_CATEGORIES).find(
 *     cat => cat.code === category
 *   );
 * }
 */

// Export grouped categories for easy access
export const IRS_CATEGORIES_BY_GROUP = {
  'Operating Expenses': [
    IRS_SCHEDULE_C_CATEGORIES.ADVERTISING,
    IRS_SCHEDULE_C_CATEGORIES.COMMISSIONS_AND_FEES,
    IRS_SCHEDULE_C_CATEGORIES.INSURANCE_OTHER,
    IRS_SCHEDULE_C_CATEGORIES.INTEREST_OTHER,
    IRS_SCHEDULE_C_CATEGORIES.LEGAL_PROFESSIONAL,
    IRS_SCHEDULE_C_CATEGORIES.OFFICE_EXPENSE,
    IRS_SCHEDULE_C_CATEGORIES.REPAIRS_MAINTENANCE,
    IRS_SCHEDULE_C_CATEGORIES.SUPPLIES,
    IRS_SCHEDULE_C_CATEGORIES.TAXES_LICENSES,
    IRS_SCHEDULE_C_CATEGORIES.UTILITIES,
    IRS_SCHEDULE_C_CATEGORIES.OTHER_EXPENSES,
  ],
  'Vehicle & Travel': [
    IRS_SCHEDULE_C_CATEGORIES.CAR_TRUCK,
    IRS_SCHEDULE_C_CATEGORIES.TRAVEL,
    IRS_SCHEDULE_C_CATEGORIES.MEALS_ENTERTAINMENT,
  ],
  'Personnel': [
    IRS_SCHEDULE_C_CATEGORIES.CONTRACT_LABOR,
    IRS_SCHEDULE_C_CATEGORIES.EMPLOYEE_BENEFITS,
    IRS_SCHEDULE_C_CATEGORIES.PENSION_PROFIT_SHARING,
    IRS_SCHEDULE_C_CATEGORIES.WAGES,
  ],
  'Property & Rent': [
    IRS_SCHEDULE_C_CATEGORIES.INTEREST_MORTGAGE,
    IRS_SCHEDULE_C_CATEGORIES.RENT_VEHICLES_EQUIPMENT,
    IRS_SCHEDULE_C_CATEGORIES.RENT_OTHER_PROPERTY,
    IRS_SCHEDULE_C_CATEGORIES.HOME_OFFICE,
  ],
  'Assets & Depreciation': [
    IRS_SCHEDULE_C_CATEGORIES.DEPRECIATION,
  ],
} as const;

// Export category codes for validation
export const VALID_IRS_CATEGORY_CODES = Object.values(IRS_SCHEDULE_C_CATEGORIES).map(
  cat => cat.code
);
