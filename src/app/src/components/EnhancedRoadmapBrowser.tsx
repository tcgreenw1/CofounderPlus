import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Grid3X3, List, Zap, ChevronDown, ChevronUp, Eye, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ALL_ROADMAPS } from './roadmap/RoadmapData';

interface EnhancedRoadmapBrowserProps {
  onRoadmapSelect: (roadmapId: string) => void;
  onRoadmapPreview?: (roadmapId: string) => void;
}

export const EnhancedRoadmapBrowser: React.FC<EnhancedRoadmapBrowserProps> = ({ 
  onRoadmapSelect,
  onRoadmapPreview
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true); // Start with filters open
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Extract unique values for filters
  const difficulties = useMemo(() => {
    const unique = [...new Set(ALL_ROADMAPS.map(r => r.difficulty))].filter(Boolean);
    return unique.sort();
  }, []);

  const timeframes = useMemo(() => {
    const unique = [...new Set(ALL_ROADMAPS.map(r => r.estimatedTimeToRevenue))].filter(Boolean);
    return unique.sort();
  }, []);

  const industries = useMemo(() => {
    const allIndustries = ALL_ROADMAPS.flatMap(r => 
      r.targetAudience || []
    );
    return [...new Set(allIndustries)].filter(Boolean).sort();
  }, []);

  // Filter and search roadmaps
  const filteredRoadmaps = useMemo(() => {
    return ALL_ROADMAPS.filter(roadmap => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (roadmap.targetAudience || []).some(audience => 
          audience.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Difficulty filter
      const difficultyMatch = selectedDifficulty === 'all' || 
        roadmap.difficulty === selectedDifficulty;

      // Timeframe filter
      const timeframeMatch = selectedTimeframe === 'all' || 
        roadmap.estimatedTimeToRevenue === selectedTimeframe;

      // Industry filter
      const industryMatch = selectedIndustry === 'all' || 
        (roadmap.targetAudience || []).includes(selectedIndustry);

      return searchMatch && difficultyMatch && timeframeMatch && industryMatch;
    });
  }, [searchTerm, selectedDifficulty, selectedTimeframe, selectedIndustry]);

  // Group roadmaps by industry for better organization
  const groupedRoadmaps = useMemo(() => {
    const groups: Record<string, typeof ALL_ROADMAPS> = {};
    
    filteredRoadmaps.forEach(roadmap => {
      const primaryCategory = roadmap.targetAudience?.[0] || 'General';
      if (!groups[primaryCategory]) {
        groups[primaryCategory] = [];
      }
      groups[primaryCategory].push(roadmap);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRoadmaps]);

  // Auto-expand all groups for testing - use useEffect to avoid state update during render
  useEffect(() => {
    const groupNames = groupedRoadmaps.map(([name]) => name);
    setExpandedGroups(new Set(groupNames));
  }, [groupedRoadmaps]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('all');
    setSelectedTimeframe('all');
    setSelectedIndustry('all');
  };

  const activeFiltersCount = [
    selectedDifficulty !== 'all',
    selectedTimeframe !== 'all', 
    selectedIndustry !== 'all',
    searchTerm !== ''
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search roadmaps by name, industry, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 text-lg glass-morphism border-white/30"
          />
        </div>

        {/* Filter Toggle and View Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="glass-morphism border-white/30"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {activeFiltersCount}
                </Badge>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">
              {filteredRoadmaps.length} roadmap{filteredRoadmaps.length !== 1 ? 's' : ''}
            </span>
            
            <div className="flex items-center bg-white/20 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Difficulty Level
                </label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="glass-morphism border-white/30">
                    <SelectValue placeholder="Any difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any difficulty</SelectItem>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Time to Revenue
                </label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="glass-morphism border-white/30">
                    <SelectValue placeholder="Any timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any timeframe</SelectItem>
                    {timeframes.map(timeframe => (
                      <SelectItem key={timeframe} value={timeframe}>
                        {timeframe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Target Industry
                </label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="glass-morphism border-white/30">
                    <SelectValue placeholder="Any industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any industry</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {filteredRoadmaps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No roadmaps found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-8">
            {groupedRoadmaps.map(([groupName, roadmaps]) => (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Collapsible 
                  open={expandedGroups.has(groupName)} 
                  onOpenChange={() => toggleGroup(groupName)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-0 h-auto hover:bg-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {groupName}
                        </h3>
                        <Badge variant="outline" className="glass-morphism border-white/20">
                          {roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {expandedGroups.has(groupName) ? 
                        <ChevronUp className="w-5 h-5" /> : 
                        <ChevronDown className="w-5 h-5" />
                      }
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {roadmaps.map((roadmap, index) => (
                        <motion.div
                          key={roadmap.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                          <Card 
                            className="glass-morphism border border-white/20 dark:border-gray-700/20 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group h-full"
                            onClick={() => onRoadmapSelect(roadmap.id)}
                          >
                            <CardContent className="p-6 flex flex-col h-full">
                              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${roadmap.color} flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                                {roadmap.icon}
                              </div>
                              
                              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary transition-colors">
                                {roadmap.title}
                              </h3>
                              
                              <p className="text-gray-600 dark:text-gray-400 mb-4 flex-1 text-sm leading-relaxed">
                                {roadmap.subtitle}
                              </p>
                              
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="glass-morphism border-white/20 text-xs">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {roadmap.estimatedTimeToRevenue}
                                  </Badge>
                                  <Badge variant="outline" className="glass-morphism border-white/20 text-xs">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {roadmap.difficulty}
                                  </Badge>
                                </div>
                                
                                {roadmap.targetAudience && roadmap.targetAudience.length > 0 && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    <Users className="w-3 h-3 inline mr-1" />
                                    <strong>For:</strong> {roadmap.targetAudience.slice(0, 2).join(', ')}
                                    {roadmap.targetAudience.length > 2 && ` +${roadmap.targetAudience.length - 2} more`}
                                  </div>
                                )}
                                
                                <Button 
                                  className={`w-full bg-gradient-to-r ${roadmap.color} hover:opacity-90 text-white border-none`}
                                  size="sm"
                                >
                                  <Zap className="w-4 h-4 mr-2" />
                                  Start Journey
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-8">
            {groupedRoadmaps.map(([groupName, roadmaps]) => (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Collapsible 
                  open={expandedGroups.has(groupName)} 
                  onOpenChange={() => toggleGroup(groupName)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-0 h-auto hover:bg-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {groupName}
                        </h3>
                        <Badge variant="outline" className="glass-morphism border-white/20">
                          {roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {expandedGroups.has(groupName) ? 
                        <ChevronUp className="w-5 h-5" /> : 
                        <ChevronDown className="w-5 h-5" />
                      }
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-3">
                      {roadmaps.map((roadmap, index) => (
                        <motion.div
                          key={roadmap.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                        >
                          <Card 
                            className="glass-morphism border border-white/20 dark:border-gray-700/20 cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-white/30 group"
                            onClick={() => onRoadmapSelect(roadmap.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${roadmap.color} flex items-center justify-center text-white text-lg flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                  {roadmap.icon}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary transition-colors">
                                    {roadmap.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {roadmap.subtitle}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="glass-morphism border-white/20 text-xs">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {roadmap.estimatedTimeToRevenue}
                                    </Badge>
                                    <Badge variant="outline" className="glass-morphism border-white/20 text-xs">
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      {roadmap.difficulty}
                                    </Badge>
                                    {roadmap.targetAudience && roadmap.targetAudience[0] && (
                                      <Badge variant="outline" className="glass-morphism border-white/20 text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {roadmap.targetAudience[0]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button 
                                    className={`bg-gradient-to-r ${roadmap.color} hover:opacity-90 text-white border-none`}
                                    size="sm"
                                  >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Start
                                  </Button>
                                  {onRoadmapPreview && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-500 hover:text-gray-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRoadmapPreview(roadmap.id);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )} 
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {filteredRoadmaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          <Card className="glass-morphism border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredRoadmaps.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Available Roadmaps</div>
          </Card>
          <Card className="glass-morphism border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{groupedRoadmaps.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Industry Categories</div>
          </Card>
          <Card className="glass-morphism border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{difficulties.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Difficulty Levels</div>
          </Card>
          <Card className="glass-morphism border-white/20 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{industries.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Target Audiences</div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedRoadmapBrowser;