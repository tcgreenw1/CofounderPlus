import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from './ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';

interface IRSCategoryDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface IRSCategory {
  code: string;
  name: string;
  description: string;
  group: string;
}

const IRS_CATEGORIES: IRSCategory[] = [
  // Operating Expenses
  {
    code: 'ADV',
    name: 'Advertising',
    description: 'Business advertising and marketing expenses',
    group: 'Operating Expenses'
  },
  {
    code: 'CAR',
    name: 'Car and Truck Expenses',
    description: 'Vehicle expenses for business use',
    group: 'Vehicle & Travel'
  },
  {
    code: 'COM',
    name: 'Commissions and Fees',
    description: 'Sales commissions and professional fees',
    group: 'Operating Expenses'
  },
  {
    code: 'CON',
    name: 'Contract Labor',
    description: 'Payments to independent contractors',
    group: 'Personnel'
  },
  {
    code: 'DEP',
    name: 'Depreciation',
    description: 'Depreciation of business assets',
    group: 'Assets & Depreciation'
  },
  {
    code: 'EMP',
    name: 'Employee Benefit Programs',
    description: 'Health insurance, retirement plans, etc.',
    group: 'Personnel'
  },
  {
    code: 'INS',
    name: 'Insurance (Other than Health)',
    description: 'Business liability, property insurance',
    group: 'Operating Expenses'
  },
  {
    code: 'INT',
    name: 'Interest (Mortgage)',
    description: 'Mortgage interest on business property',
    group: 'Property & Rent'
  },
  {
    code: 'INT-O',
    name: 'Interest (Other)',
    description: 'Interest on business loans and credit cards',
    group: 'Operating Expenses'
  },
  {
    code: 'LEG',
    name: 'Legal and Professional Services',
    description: 'Attorney, accountant, consultant fees',
    group: 'Operating Expenses'
  },
  {
    code: 'OFF',
    name: 'Office Expense',
    description: 'Office supplies, postage, printing',
    group: 'Operating Expenses'
  },
  {
    code: 'PEN',
    name: 'Pension and Profit-Sharing Plans',
    description: 'Employer contributions to retirement plans',
    group: 'Personnel'
  },
  {
    code: 'REN',
    name: 'Rent or Lease (Vehicles, Machinery, Equipment)',
    description: 'Equipment and vehicle leases',
    group: 'Property & Rent'
  },
  {
    code: 'REN-O',
    name: 'Rent or Lease (Other Business Property)',
    description: 'Office space, warehouse rental',
    group: 'Property & Rent'
  },
  {
    code: 'REP',
    name: 'Repairs and Maintenance',
    description: 'Repairs to business property and equipment',
    group: 'Operating Expenses'
  },
  {
    code: 'SUP',
    name: 'Supplies',
    description: 'Business supplies not elsewhere classified',
    group: 'Operating Expenses'
  },
  {
    code: 'TAX',
    name: 'Taxes and Licenses',
    description: 'Business taxes, licenses, regulatory fees',
    group: 'Operating Expenses'
  },
  {
    code: 'TRV',
    name: 'Travel',
    description: 'Airfare, hotels, meals while traveling',
    group: 'Vehicle & Travel'
  },
  {
    code: 'UTI',
    name: 'Utilities',
    description: 'Electricity, gas, water, phone, internet',
    group: 'Operating Expenses'
  },
  {
    code: 'WAG',
    name: 'Wages',
    description: 'Employee salaries and wages',
    group: 'Personnel'
  },
  {
    code: 'MEL',
    name: 'Meals and Entertainment',
    description: 'Business meals (50% deductible)',
    group: 'Vehicle & Travel'
  },
  {
    code: 'HOM',
    name: 'Home Office',
    description: 'Deduction for business use of home',
    group: 'Property & Rent'
  },
  {
    code: 'OTH',
    name: 'Other Expenses',
    description: 'Miscellaneous business expenses',
    group: 'Operating Expenses'
  }
];

// Group categories by their group field
const groupedCategories = IRS_CATEGORIES.reduce((acc, category) => {
  if (!acc[category.group]) {
    acc[category.group] = [];
  }
  acc[category.group].push(category);
  return acc;
}, {} as Record<string, IRSCategory[]>);

export function IRSCategoryDropdown({ 
  value, 
  onChange, 
  placeholder = 'Select IRS category...',
  disabled = false
}: IRSCategoryDropdownProps) {
  const [open, setOpen] = useState(false);

  const selectedCategory = IRS_CATEGORIES.find(cat => cat.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedCategory.code}</span>
              <span className="text-gray-600">-</span>
              <span>{selectedCategory.name}</span>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search IRS categories..." />
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>No category found.</CommandEmpty>
            {Object.entries(groupedCategories).map(([groupName, categories]) => (
              <CommandGroup key={groupName} heading={groupName}>
                {categories.map((category) => (
                  <CommandItem
                    key={category.code}
                    value={`${category.code} ${category.name} ${category.description}`}
                    onSelect={() => {
                      onChange(category.code);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 py-3 cursor-pointer"
                  >
                    <Check
                      className={`mt-0.5 h-4 w-4 ${
                        value === category.code ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {category.code}
                        </span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {category.description}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Export the categories for use in other components
export { IRS_CATEGORIES, type IRSCategory };
