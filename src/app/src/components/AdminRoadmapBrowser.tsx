import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Grid3X3, List, Zap, ChevronDown, ChevronUp, Eye, Calendar, 
  DollarSign, Users, TrendingUp, ArrowLeft, MapPin, Lightbulb, BarChart3, Settings,
  FileText, CheckSquare, Layers, Hash, Target, Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { ALL_ROADMAPS } from './roadmap/RoadmapData';
import { copyToClipboard } from '../utils/clipboard';
import { toast } from 'react-toastify';

interface AdminRoadmapBrowserProps {
  user: any;
  onBack: () => void;
}

export const AdminRoadmapBrowser: React.FC<AdminRoadmapBrowserProps> = ({ 
  user,
  onBack 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedRoadmap, setSelectedRoadmap] = useState<any>(null);
  const [detailViewMode, setDetailViewMode] = useState<'overview' | 'milestones' | 'tasks' | 'json'>('overview');

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

  // Auto-expand all groups initially
  React.useEffect(() => {
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

  const handleRoadmapSelect = (roadmapId: string) => {
    const roadmap = ALL_ROADMAPS.find(r => r.id === roadmapId);
    setSelectedRoadmap(roadmap);
  };

  const handleRoadmapTest = (roadmapId: string) => {
    // Navigate to roadmap test page with specific roadmap
    navigate(`/roadmap-test?roadmapId=${roadmapId}`);
  };

  // Show roadmap details if one is selected
  if (selectedRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        {/* Header */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRoadmap(null)}
                  className="border-gray-200 dark:border-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Browser
                </Button>
                <div className={`p-3 bg-gradient-to-r ${selectedRoadmap.color} rounded-xl`}>
                  <span className="text-white text-2xl">{selectedRoadmap.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {selectedRoadmap.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedRoadmap.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleRoadmapTest(selectedRoadmap.id)}
                  className={`bg-gradient-to-r ${selectedRoadmap.color} hover:opacity-90 text-white`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Roadmap
                </Button>
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border-gray-200 dark:border-gray-700"
                >
                  Back to Admin
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Roadmap Details */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={detailViewMode} onValueChange={(value) => setDetailViewMode(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                All Milestones ({selectedRoadmap.milestones?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                All Tasks ({selectedRoadmap.milestones?.reduce((total: number, m: any) => total + (m.tasks?.length || 0), 0) || 0})
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Raw Data
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedRoadmap.description}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Time to Revenue:</span>
                            <span>{selectedRoadmap.estimatedTimeToRevenue}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-medium">Difficulty:</span>
                            <span>{selectedRoadmap.difficulty}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Target Audience:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedRoadmap.targetAudience?.map((audience: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {audience}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Milestone Preview */}
                  {selectedRoadmap.milestones && selectedRoadmap.milestones.length > 0 && (
                    <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Milestone Preview (First 3)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedRoadmap.milestones.slice(0, 3).map((milestone: any, index: number) => (
                            <div key={milestone.id} className="flex items-start gap-3 p-3 bg-white/20 dark:bg-gray-700/20 rounded-lg">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedRoadmap.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {milestone.description}
                                </p>
                                {milestone.tasks && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {milestone.tasks.length} tasks
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          {selectedRoadmap.milestones.length > 3 && (
                            <div className="text-center">
                              <Button 
                                variant="outline" 
                                onClick={() => setDetailViewMode('milestones')}
                                className="text-sm"
                              >
                                View all {selectedRoadmap.milestones.length} milestones →
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Enhanced Sidebar */}
                <div className="space-y-6">
                  {/* Detailed Stats */}
                  <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Detailed Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white/20 dark:bg-gray-700/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedRoadmap.milestones?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Milestones</div>
                        </div>
                        <div className="text-center p-3 bg-white/20 dark:bg-gray-700/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedRoadmap.milestones?.reduce((total: number, m: any) => 
                              total + (m.tasks?.length || 0), 0) || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
                        </div>
                      </div>
                      
                      {/* Task complexity breakdown */}
                      {selectedRoadmap.milestones && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Task Distribution:
                          </div>
                          {selectedRoadmap.milestones.map((milestone: any, index: number) => (
                            <div key={milestone.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400 truncate">
                                M{index + 1}: {milestone.title.slice(0, 20)}...
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {milestone.tasks?.length || 0} tasks
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Roadmap ID:</span>
                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {selectedRoadmap.id}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Color Theme:</span>
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${selectedRoadmap.color}`}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Admin Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => handleRoadmapTest(selectedRoadmap.id)}
                        className={`w-full bg-gradient-to-r ${selectedRoadmap.color} hover:opacity-90 text-white`}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Test Roadmap
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/roadmap?preload=${selectedRoadmap.id}`)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View as User
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDetailViewMode('milestones')}
                        className="w-full"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View All Milestones
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDetailViewMode('tasks')}
                        className="w-full"
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        View All Tasks
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* All Milestones Tab */}
            <TabsContent value="milestones" className="space-y-6">
              <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    All Milestones ({selectedRoadmap.milestones?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] roadmap-scroll">
                    <div className="space-y-6">
                      {selectedRoadmap.milestones?.map((milestone: any, index: number) => (
                        <div key={milestone.id} className="border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 bg-white/20 dark:bg-gray-700/20">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedRoadmap.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {milestone.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {milestone.description}
                              </p>
                              
                              {/* Milestone metadata */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="outline" className="text-xs">
                                  <Hash className="w-3 h-3 mr-1" />
                                  ID: {milestone.id}
                                </Badge>
                                {milestone.tasks && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckSquare className="w-3 h-3 mr-1" />
                                    {milestone.tasks.length} tasks
                                  </Badge>
                                )}
                                {milestone.estimatedDuration && (
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {milestone.estimatedDuration}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Tasks preview */}
                              {milestone.tasks && milestone.tasks.length > 0 && (
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="mb-2">
                                      <ChevronDown className="w-4 h-4 mr-2" />
                                      Show Tasks ({milestone.tasks.length})
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="bg-white/30 dark:bg-gray-800/30 rounded-lg p-3 space-y-2">
                                      {milestone.tasks.slice(0, 5).map((task: any, taskIndex: number) => (
                                        <div key={task.id || taskIndex} className="flex items-start gap-2 text-sm">
                                          <div className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                            {taskIndex + 1}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                              {task.title}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400">
                                              {task.description}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {milestone.tasks.length > 5 && (
                                        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                                          ... and {milestone.tasks.length - 5} more tasks
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    All Tasks ({selectedRoadmap.milestones?.reduce((total: number, m: any) => total + (m.tasks?.length || 0), 0) || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] roadmap-scroll">
                    <div className="space-y-6">
                      {selectedRoadmap.milestones?.map((milestone: any, milestoneIndex: number) => (
                        <div key={milestone.id} className="space-y-3">
                          <div className="flex items-center gap-3 sticky top-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedRoadmap.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                              {milestoneIndex + 1}
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {milestone.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {milestone.tasks?.length || 0} tasks
                            </Badge>
                          </div>
                          
                          {milestone.tasks && milestone.tasks.length > 0 && (
                            <div className="ml-6 space-y-3">
                              {milestone.tasks.map((task: any, taskIndex: number) => (
                                <div key={task.id || taskIndex} className="bg-white/20 dark:bg-gray-700/20 rounded-lg p-4 border border-gray-200/30 dark:border-gray-700/30">
                                  <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-1">
                                      {taskIndex + 1}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                        {task.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {task.description}
                                      </p>
                                      
                                      {/* Task metadata */}
                                      <div className="flex flex-wrap gap-2">
                                        {task.id && (
                                          <Badge variant="outline" className="text-xs">
                                            <Hash className="w-3 h-3 mr-1" />
                                            {task.id}
                                          </Badge>
                                        )}
                                        {task.estimatedTime && (
                                          <Badge variant="outline" className="text-xs">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {task.estimatedTime}
                                          </Badge>
                                        )}
                                        {task.difficulty && (
                                          <Badge variant="outline" className="text-xs">
                                            <Target className="w-3 h-3 mr-1" />
                                            {task.difficulty}
                                          </Badge>
                                        )}
                                        {task.type && (
                                          <Badge variant="secondary" className="text-xs">
                                            {task.type}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Raw JSON Tab */}
            <TabsContent value="json" className="space-y-6">
              <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Raw JSON Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const success = await copyToClipboard(JSON.stringify(selectedRoadmap, null, 2));
                          if (success) {
                            toast.success('Copied to clipboard');
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Copy to Clipboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(selectedRoadmap, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `roadmap-${selectedRoadmap.id}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Download JSON
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[600px] roadmap-scroll">
                      <pre className="text-xs font-mono bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedRoadmap, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onBack}
                className="border-gray-200 dark:border-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Roadmap Browser
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Browse and manage all available business roadmaps
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as Admin: {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Controls */}
        <div className="space-y-4 mb-8">
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
              
              <div className="flex items-center gap-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-1 border border-white/20 dark:border-gray-700/20">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    console.log('Switching to grid view');
                    setViewMode('grid');
                  }}
                  className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-white/20'}`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    console.log('Switching to list view');
                    setViewMode('list');
                  }}
                  className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-white/20'}`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                              onClick={() => handleRoadmapSelect(roadmap.id)}
                            >
                              <CardContent className="p-6 flex flex-col h-full">
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${roadmap.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                  <span className="text-white text-2xl">{roadmap.icon}</span>
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                                    {roadmap.title}
                                  </h3>
                                  
                                  {roadmap.subtitle && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                      {roadmap.subtitle}
                                    </p>
                                  )}
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs">
                                      <Calendar className="w-3 h-3 text-blue-500" />
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {roadmap.estimatedTimeToRevenue}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs">
                                      <TrendingUp className="w-3 h-3 text-green-500" />
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {roadmap.difficulty}
                                      </span>
                                    </div>
                                    
                                    {roadmap.milestones && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <MapPin className="w-3 h-3 text-purple-500" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {roadmap.milestones.length} milestones
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {roadmap.targetAudience?.slice(0, 2).map((audience: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs glass-morphism border-white/20">
                                        {audience}
                                      </Badge>
                                    ))}
                                    {roadmap.targetAudience && roadmap.targetAudience.length > 2 && (
                                      <Badge variant="outline" className="text-xs glass-morphism border-white/20">
                                        +{roadmap.targetAudience.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                  <Button
                                    size="sm"
                                    className={`flex-1 bg-gradient-to-r ${roadmap.color} hover:opacity-90 text-white`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRoadmapTest(roadmap.id);
                                    }}
                                  >
                                    <Zap className="w-3 h-3 mr-1" />
                                    Test
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRoadmapSelect(roadmap.id);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
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
            /* List View */
            <div className="space-y-4">
              {filteredRoadmaps.map((roadmap, index) => (
                <motion.div
                  key={roadmap.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="glass-morphism border border-white/20 dark:border-gray-700/20 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group">
                    <CardContent className="p-6" onClick={() => handleRoadmapSelect(roadmap.id)}>
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${roadmap.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-white text-lg">{roadmap.icon}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors duration-300">
                              {roadmap.title}
                            </h3>
                            <div className="flex gap-1">
                              {roadmap.targetAudience?.slice(0, 3).map((audience: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs glass-morphism border-white/20">
                                  {audience}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {roadmap.subtitle && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {roadmap.subtitle}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{roadmap.estimatedTimeToRevenue}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{roadmap.difficulty}</span>
                            </div>
                            {roadmap.milestones && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{roadmap.milestones.length} milestones</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className={`bg-gradient-to-r ${roadmap.color} hover:opacity-90 text-white`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoadmapTest(roadmap.id);
                            }}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Test Roadmap
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoadmapSelect(roadmap.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminRoadmapBrowser;