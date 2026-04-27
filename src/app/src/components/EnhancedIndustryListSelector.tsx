import React, { useState, useMemo, memo } from 'react';
import { Search, ChevronDown, ChevronRight, ArrowUpDown, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { ROADMAP_INDUSTRIES, INDUSTRY_CATEGORIES } from '../utils/industryData';

interface EnhancedIndustryListSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

type SortOption = 'alphabetical' | 'category';

const EnhancedIndustryListSelectorComponent: React.FC<EnhancedIndustryListSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(INDUSTRY_CATEGORIES));

  // Convert industries array to format we need
  const industries = useMemo(() => {
    return ROADMAP_INDUSTRIES.map((industry: any) => ({
      id: industry.id,
      title: industry.title,
      category: industry.category || 'Other',
      searchTerms: industry.searchTerms || []
    }));
  }, []);

  // Filter and sort industries
  const filteredAndSortedIndustries = useMemo(() => {
    let filtered = industries;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = industries.filter(industry => {
        const titleMatch = industry.title.toLowerCase().includes(query);
        const categoryMatch = industry.category.toLowerCase().includes(query);
        const searchTermMatch = industry.searchTerms.some((term: string) => 
          term.toLowerCase().includes(query)
        );
        return titleMatch || categoryMatch || searchTermMatch;
      });
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Sort by category, then alphabetically within category
      return [...filtered].sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });
    }
  }, [industries, searchQuery, sortBy]);

  // Group industries by category
  const industriesByCategory = useMemo(() => {
    const grouped: Record<string, typeof industries> = {};
    
    filteredAndSortedIndustries.forEach(industry => {
      if (!grouped[industry.category]) {
        grouped[industry.category] = [];
      }
      grouped[industry.category].push(industry);
    });

    return grouped;
  }, [filteredAndSortedIndustries]);

  const toggleCategory = (category: string) => {
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

  const toggleAllCategories = () => {
    if (expandedCategories.size === Object.keys(industriesByCategory).length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(Object.keys(industriesByCategory)));
    }
  };

  const handleSelectIndustry = (industryTitle: string) => {
    if (!disabled) {
      onChange(industryTitle);
    }
  };

  const renderIndustryItem = (industry: typeof industries[0]) => {
    const isSelected = value === industry.title || value === industry.id;
    
    return (
      <button
        key={industry.id}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSelectIndustry(industry.title);
        }}
        disabled={disabled}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
          isSelected
            ? 'bg-[#00E0FF] text-white font-medium shadow-sm'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {industry.title}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search and Controls */}
      <div className="space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search industries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-9 text-sm"
            disabled={disabled}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-7 w-7"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Sort Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSortBy(prev => prev === 'alphabetical' ? 'category' : 'alphabetical');
              }}
              className="h-7 text-xs gap-1.5"
              disabled={disabled}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === 'alphabetical' ? 'A-Z' : 'Category'}
            </Button>

            {/* Expand/Collapse All */}
            {sortBy === 'category' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleAllCategories();
                }}
                className="h-7 text-xs"
                disabled={disabled}
              >
                {expandedCategories.size === Object.keys(industriesByCategory).length ? 'Collapse All' : 'Expand All'}
              </Button>
            )}
          </div>

          {/* Count Badge */}
          <Badge variant="secondary" className="text-xs">
            {filteredAndSortedIndustries.length} industries
          </Badge>
        </div>
      </div>

      {/* Industry List */}
      <ScrollArea className="h-[300px] rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-2 space-y-1">
          {sortBy === 'alphabetical' ? (
            // Alphabetical list
            filteredAndSortedIndustries.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No industries found matching "{searchQuery}"
              </div>
            ) : (
              filteredAndSortedIndustries.map(industry => renderIndustryItem(industry))
            )
          ) : (
            // Category grouped list
            Object.keys(industriesByCategory).length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No industries found matching "{searchQuery}"
              </div>
            ) : (
              Object.entries(industriesByCategory)
                .sort(([catA], [catB]) => catA.localeCompare(catB))
                .map(([category, categoryIndustries]) => {
                  const isExpanded = expandedCategories.has(category);
                  
                  return (
                    <div key={category} className="mb-2">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCategory(category);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {category}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {categoryIndustries.length}
                          </Badge>
                        </div>
                      </button>

                      {/* Category Industries */}
                      {isExpanded && (
                        <div className="mt-1 ml-6 space-y-1">
                          {categoryIndustries.map(industry => renderIndustryItem(industry))}
                        </div>
                      )}
                    </div>
                  );
                })
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Export memoized version for performance
export const EnhancedIndustryListSelector = memo(EnhancedIndustryListSelectorComponent);
