import React from 'react';
import { motion } from 'motion/react';
import { Building2, CheckCircle2, Circle } from 'lucide-react';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

interface Business {
  id: string;
  name: string;
  industry?: string;
}

interface MultiBusinessSelectorProps {
  businesses: Business[];
  selectedBusinessIds: string[];
  currentBusinessId: string;
  onChange: (businessIds: string[]) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export const MultiBusinessSelector: React.FC<MultiBusinessSelectorProps> = ({
  businesses,
  selectedBusinessIds,
  currentBusinessId,
  onChange,
  disabled = false,
  label = 'Add to Businesses',
  description = 'Select which businesses should have this record'
}) => {
  const handleToggleBusiness = (businessId: string) => {
    if (disabled) return;
    
    // Current business should always be selected
    if (businessId === currentBusinessId) return;
    
    if (selectedBusinessIds.includes(businessId)) {
      onChange(selectedBusinessIds.filter(id => id !== businessId));
    } else {
      onChange([...selectedBusinessIds, businessId]);
    }
  };

  const handleToggleAll = () => {
    if (disabled) return;
    
    if (selectedBusinessIds.length === businesses.length) {
      // Deselect all except current business
      onChange([currentBusinessId]);
    } else {
      // Select all
      onChange(businesses.map(b => b.id));
    }
  };

  // Don't show if user only has one business
  if (businesses.length <= 1) {
    return null;
  }

  const allSelected = selectedBusinessIds.length === businesses.length;
  const someSelected = selectedBusinessIds.length > 0 && selectedBusinessIds.length < businesses.length;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {/* Select All Toggle */}
        <button
          type="button"
          onClick={handleToggleAll}
          disabled={disabled}
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: 'var(--color-info)' }}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Business Checklist */}
      <div 
        className="space-y-2 p-3 rounded-xl border"
        style={{
          background: 'var(--glass-background)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'var(--border-color)',
        }}
      >
        {businesses.map((business) => {
          const isSelected = selectedBusinessIds.includes(business.id);
          const isCurrent = business.id === currentBusinessId;
          
          return (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                  ${isCurrent 
                    ? 'border-[var(--color-info)] bg-[var(--color-info)]/5' 
                    : isSelected
                      ? 'border-[var(--color-success)] bg-[var(--color-success)]/5 cursor-pointer hover:bg-[var(--color-success)]/10'
                      : 'border-transparent cursor-pointer hover:border-border hover:bg-card/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleBusiness(business.id)}
                    disabled={disabled || isCurrent}
                    className="w-5 h-5"
                  />
                </div>

                {/* Business Icon */}
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(0, 224, 255, 0.15), rgba(150, 235, 255, 0.1))'
                      : isSelected
                        ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.15), rgba(200, 255, 200, 0.1))'
                        : 'rgba(var(--foreground-rgb), 0.05)',
                    border: isCurrent
                      ? '1px solid rgba(0, 224, 255, 0.3)'
                      : isSelected
                        ? '1px solid rgba(108, 255, 108, 0.3)'
                        : '1px solid transparent',
                  }}
                >
                  <Building2 
                    className="w-4 h-4" 
                    style={{ 
                      color: isCurrent 
                        ? 'var(--color-info)' 
                        : isSelected 
                          ? 'var(--color-success)' 
                          : 'var(--muted-foreground)' 
                    }} 
                  />
                </div>

                {/* Business Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {business.name}
                    </p>
                    {isCurrent && (
                      <span 
                        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: 'rgba(0, 224, 255, 0.15)',
                          color: 'var(--color-info)',
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  {business.industry && (
                    <p className="text-xs text-muted-foreground truncate">
                      {business.industry}
                    </p>
                  )}
                </div>

                {/* Selected Indicator */}
                {isSelected && !isCurrent && (
                  <div className="flex-shrink-0">
                    <CheckCircle2 
                      className="w-5 h-5" 
                      style={{ color: 'var(--color-success)' }}
                    />
                  </div>
                )}
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div 
        className="text-xs font-medium p-2 rounded-lg text-center"
        style={{
          background: 'rgba(0, 224, 255, 0.08)',
          color: 'var(--color-info)',
        }}
      >
        {selectedBusinessIds.length === 1 
          ? 'This record will be added to 1 business'
          : `This record will be added to ${selectedBusinessIds.length} businesses`
        }
      </div>
    </div>
  );
};
