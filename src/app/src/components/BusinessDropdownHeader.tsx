/**
 * BusinessDropdownHeader - Reusable header component with business switcher
 * Shows current business and allows quick switching
 * Uses design system CSS variables for styling
 */
import React from 'react';
import { Building2 } from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';

interface BusinessDropdownHeaderProps {
  title: string;
  description: string;
  additionalInfo?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: string; // Tailwind color class for the accent
  rightContent?: React.ReactNode; // Optional content to display alongside business dropdown
}

export function BusinessDropdownHeader({ 
  title, 
  description, 
  additionalInfo,
  icon,
  accentColor = 'blue', // default to blue
  rightContent
}: BusinessDropdownHeaderProps) {
  try {
    let businessContext;
    try {
      businessContext = useBusiness();
    } catch (contextError) {
      console.error('BusinessDropdownHeader: Failed to get BusinessContext:', contextError);
      // Return minimal UI if context not available
      return (
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                {icon}
              </div>
            )}
            <h2 className="text-2xl" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
              {title}
            </h2>
          </div>
          <p style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </p>
        </div>
      );
    }
    
    // Safety check for context
    if (!businessContext) {
      console.error('BusinessDropdownHeader: BusinessContext is not available');
      return null;
    }
    
    const { userBusinesses, selectedBusiness, setSelectedBusiness } = businessContext;

    // Safely handle businesses array - ensure it's always an array
    const businessList = Array.isArray(userBusinesses) ? userBusinesses : [];

    // Color mappings for consistency
    const colorStyles = {
      purple: {
        text: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-500/10',
        iconBg: 'bg-purple-500',
        border: 'border-purple-200 dark:border-purple-800'
      },
      green: {
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-500/10',
        iconBg: 'bg-green-500',
        border: 'border-green-200 dark:border-green-800'
      },
      yellow: {
        text: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-500/10',
        iconBg: 'bg-yellow-500',
        border: 'border-yellow-200 dark:border-yellow-800'
      },
      blue: {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10',
        iconBg: 'bg-blue-500',
        border: 'border-blue-200 dark:border-blue-800'
      },
      orange: {
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10',
        iconBg: 'bg-orange-500',
        border: 'border-orange-200 dark:border-orange-800'
      },
      red: {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10',
        iconBg: 'bg-red-500',
        border: 'border-red-200 dark:border-red-800'
      }
    };

    const colors = colorStyles[accentColor as keyof typeof colorStyles] || colorStyles.blue;

    return (
      <div 
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between"
        style={{
          gap: 'var(--spacing-2) var(--spacing-3) var(--spacing-4)',
          marginBottom: 'var(--spacing-2) var(--spacing-3) var(--spacing-4)',
        }}
      >
        {/* Left side - Title and Description */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div 
            className="flex items-center"
            style={{
              gap: 'var(--spacing-2)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            {icon && (
              <div 
                className={`rounded-xl flex items-center justify-center ${colors.iconBg} text-white`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xl)',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <h2 
              className={`text-lg sm:text-xl md:text-2xl lg:text-3xl ${colors.text}`}
              style={{ fontWeight: 'var(--font-weight-medium)' }}
            >
              {title}
            </h2>
          </div>
          <p 
            className="text-xs sm:text-sm lg:text-base"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {description}
          </p>
          {additionalInfo}
        </div>

        {/* Right side - Business Dropdown and Optional Content */}
        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
          {rightContent}
          <div className="w-auto min-w-0 max-w-fit">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1) var(--spacing-2)' }}>
              <label 
              className="text-xs uppercase tracking-wide"
              style={{ 
                color: 'var(--muted-foreground)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Current Business
            </label>
            {businessList.length > 0 ? (
              <Select
                value={selectedBusiness?.id || undefined}
                onValueChange={(businessId) => {
                  try {
                    const business = businessList.find(b => b.id === businessId);
                    if (business && setSelectedBusiness) {
                      setSelectedBusiness(business);
                    }
                  } catch (error) {
                    console.error('Error changing business:', error);
                  }
                }}
              >
                <SelectTrigger 
                  className="w-auto text-left"
                  style={{
                    height: '36px',
                    padding: 'var(--spacing-2)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--card)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div 
                    className="flex items-center w-auto"
                    style={{ gap: 'var(--spacing-2)' }}
                  >
                    <div 
                      className="rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        borderRadius: 'var(--radius-lg)',
                      }}
                    >
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <SelectValue placeholder="Select a business">
                        {selectedBusiness ? (
                          <div 
                            className="truncate text-left whitespace-nowrap"
                            style={{ 
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--foreground)'
                            }}
                          >
                            {selectedBusiness.name}
                          </div>
                        ) : null}
                      </SelectValue>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent align="end" side="bottom" className="max-w-[calc(100vw-2rem)]">
                  {businessList.map((business, index) => (
                    <SelectItem 
                      key={`business-${business.id || business.name || index}`}
                      value={business.id || `business-${index}`}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 py-1">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: business.id === selectedBusiness?.id 
                              ? 'var(--primary)' 
                              : 'var(--muted)',
                            color: business.id === selectedBusiness?.id 
                              ? 'var(--primary-foreground)' 
                              : 'var(--muted-foreground)'
                          }}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div 
                          className="whitespace-nowrap"
                          style={{ 
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--foreground)'
                          }}
                        >
                          {business.name}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div 
                className="w-full h-12 rounded-lg flex items-center justify-center"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--muted)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: 'var(--radius)'
                }}
              >
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  No businesses available
                </p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('BusinessDropdownHeader: Fatal error rendering component:', error);
    // Return a minimal fallback UI
    return (
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      </div>
    );
  }
}