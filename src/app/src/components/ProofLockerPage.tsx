import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2,
  Calendar,
  FileText,
  Image,
  Link,
  Award,
  Star,
  Zap,
  Target,
  Camera,
  Clock,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from './BusinessContext';
import { ALL_ROADMAPS, UserProgress } from './roadmap/RoadmapData';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface ProofItem {
  id: string;
  taskId: string;
  taskTitle: string;
  milestoneTitle: string;
  roadmapTitle: string;
  evidenceType: 'document' | 'image' | 'url' | 'text';
  evidenceUrl?: string;
  evidenceText?: string;
  description: string;
  completedAt: string;
  xpEarned: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  signedUrl?: string;
}

export const ProofLockerPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'document' | 'image' | 'url' | 'text'>('all');
  const [realProofItems, setRealProofItems] = useState<ProofItem[]>([]);

  // Load real user evidence data from the server
  useEffect(() => {
    const loadUserEvidenceData = async () => {
      if (!selectedBusiness) {
        setRealProofItems([]);
        return;
      }

      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('ProofLocker: No active session');
          setRealProofItems([]);
          return;
        }

        console.log('ProofLocker: Loading evidence for business:', selectedBusiness.id);

        // Get all evidence files for this business from the server
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/user-evidence/${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error('ProofLocker: Failed to fetch evidence:', response.status);
          setRealProofItems([]);
          return;
        }

        const result = await response.json();
        console.log('ProofLocker: Evidence data received:', result);

        if (!result.success || !result.evidence) {
          setRealProofItems([]);
          return;
        }

        const proofItems: ProofItem[] = [];

        // Convert evidence files to proof items
        Object.entries(result.evidence).forEach(([taskId, evidenceFiles]: [string, any[]]) => {
          evidenceFiles.forEach((evidence) => {
            // Find the task details in roadmaps
            let taskDetails = null;
            let milestoneTitle = 'Unknown Milestone';
            let roadmapTitle = 'Unknown Roadmap';

            for (const roadmap of ALL_ROADMAPS) {
              for (const milestone of roadmap.milestones) {
                const task = milestone.tasks.find(t => t.id === taskId);
                if (task) {
                  taskDetails = task;
                  milestoneTitle = milestone.title;
                  roadmapTitle = roadmap.title;
                  break;
                }
              }
              if (taskDetails) break;
            }

            // Create proof item from evidence
            const proofItem: ProofItem = {
              id: evidence.id,
              taskId: taskId,
              taskTitle: taskDetails?.title || 'Unknown Task',
              milestoneTitle,
              roadmapTitle,
              evidenceType: evidence.evidenceType.toLowerCase().includes('image') ? 'image' : 
                          evidence.evidenceType.toLowerCase().includes('document') ? 'document' :
                          evidence.evidenceType.toLowerCase().includes('url') ? 'url' : 'text',
              evidenceUrl: evidence.signedUrl,
              fileName: evidence.fileName,
              fileSize: evidence.fileSize,
              fileType: evidence.fileType,
              signedUrl: evidence.signedUrl,
              description: evidence.evidenceType || `Evidence for ${taskDetails?.title || 'task'}`,
              completedAt: evidence.uploadedAt,
              xpEarned: taskDetails?.xpReward || 0,
              verificationStatus: 'verified' // All uploaded evidence is considered verified
            };
            proofItems.push(proofItem);
          });
        });

        console.log('ProofLocker: Processed proof items:', proofItems.length);
        setRealProofItems(proofItems.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));

      } catch (error) {
        console.error('ProofLocker: Error loading evidence:', error);
        setRealProofItems([]);
      }
    };

    loadUserEvidenceData();
  }, [selectedBusiness]);

  const filteredProofs = realProofItems.filter(proof => {
    const matchesSearch = proof.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proof.milestoneTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proof.roadmapTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proof.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || proof.verificationStatus === selectedFilter;
    const matchesType = selectedType === 'all' || proof.evidenceType === selectedType;
    
    return matchesSearch && matchesFilter && matchesType;
  });

  const getEvidenceIcon = (type: string, fileType?: string) => {
    if (fileType) {
      if (fileType.startsWith('image/')) return Image;
      if (fileType === 'application/pdf') return FileText;
      if (fileType.includes('word')) return FileText;
      if (fileType.includes('excel') || fileType.includes('sheet')) return FileText;
      if (fileType === 'text/plain') return FileText;
    }
    
    switch (type) {
      case 'document': return FileText;
      case 'image': return Image;
      case 'url': return Link;
      case 'text': return FileText;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDisplay = (fileType?: string): string => {
    if (!fileType) return 'File';
    
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('word')) return 'Word Doc';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'Spreadsheet';
    if (fileType === 'text/plain') return 'Text File';
    
    return 'File';
  };

  const handleViewEvidence = (proof: ProofItem) => {
    if (proof.signedUrl) {
      window.open(proof.signedUrl, '_blank');
    }
  };

  const handleDownloadEvidence = (proof: ProofItem) => {
    if (proof.signedUrl && proof.fileName) {
      const link = document.createElement('a');
      link.href = proof.signedUrl;
      link.download = proof.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const totalXP = realProofItems.reduce((sum, proof) => sum + proof.xpEarned, 0);
  const verifiedCount = realProofItems.filter(p => p.verificationStatus === 'verified').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950">
      <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/roadmap')}
            className="glass-morphism border-white/30 text-sm sm:text-base"
            size="sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Roadmap
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-3 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white">
              <Shield className="w-4 h-4 sm:w-8 sm:h-8" />
            </div>
          </div>
          <h1 className="text-base sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            Proof Locker
          </h1>
          <p className="text-[10px] sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
            Your evidence vault for completed tasks and achievements.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-6 mb-3 sm:mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50">
            <CardHeader className="pb-0 p-1 sm:p-6">
              <CardTitle className="flex items-center gap-0.5 text-[8px] sm:text-lg">
                <Award className="w-2 h-2 sm:w-5 sm:h-5 text-blue-600" />
                <span className="hidden sm:inline">Total Evidence</span>
                <span className="sm:hidden">Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-6 pt-0">
              <div className="text-xs sm:text-2xl font-bold text-blue-600">
                {realProofItems.length}
              </div>
              <div className="text-[7px] sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">Completed tasks</span>
                <span className="sm:hidden">Files</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50">
            <CardHeader className="pb-0 p-1 sm:p-6">
              <CardTitle className="flex items-center gap-0.5 text-[8px] sm:text-lg">
                <CheckCircle2 className="w-2 h-2 sm:w-5 sm:h-5 text-green-600" />
                <span className="hidden sm:inline">Verified</span>
                <span className="sm:hidden">Done</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-6 pt-0">
              <div className="text-xs sm:text-2xl font-bold text-green-600">
                {verifiedCount}
              </div>
              <div className="text-[7px] sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">Evidence</span>
                <span className="sm:hidden">OK</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-700/50">
            <CardHeader className="pb-0 p-1 sm:p-6">
              <CardTitle className="flex items-center gap-0.5 text-[8px] sm:text-lg">
                <Zap className="w-2 h-2 sm:w-5 sm:h-5 text-purple-600" />
                <span className="hidden sm:inline">Total XP</span>
                <span className="sm:hidden">XP</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-6 pt-0">
              <div className="text-xs sm:text-2xl font-bold text-purple-600">
                {totalXP}
              </div>
              <div className="text-[7px] sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">Points</span>
                <span className="sm:hidden">Pts</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-3 sm:mb-6">
          <CardContent className="p-1.5 sm:p-4">
            <div className="flex flex-col gap-1.5 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-6 sm:pl-10 text-[10px] sm:text-base h-7 sm:h-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                {['all', 'verified', 'pending', 'rejected'].map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={selectedFilter === filter ? "default" : "outline"}
                    onClick={() => setSelectedFilter(filter as any)}
                    className="capitalize text-[9px] sm:text-sm px-1.5 sm:px-3 h-6 sm:h-9"
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                {['all', 'document', 'image', 'url', 'text'].map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={selectedType === type ? "secondary" : "outline"}
                    onClick={() => setSelectedType(type as any)}
                    className="capitalize text-[9px] sm:text-sm px-1.5 sm:px-3 h-6 sm:h-9"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {filteredProofs.map((proof, index) => {
            const EvidenceIcon = getEvidenceIcon(proof.evidenceType, proof.fileType);
            
            return (
              <motion.div
                key={proof.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-morphism border border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-1 sm:pb-3 p-1.5 sm:p-6">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-0.5 sm:gap-2 mb-0.5 sm:mb-2">
                          <EvidenceIcon className="w-2 h-2 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                          <h3 className="text-[10px] sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {proof.taskTitle}
                          </h3>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-2 text-[8px] sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                          <Target className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate">{proof.milestoneTitle}</span>
                        </div>
                        {proof.fileName && (
                          <div className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                            {proof.fileName}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-0.5 sm:gap-2 flex-shrink-0">
                        <Badge className={`${getStatusColor(proof.verificationStatus)} text-[7px] sm:text-xs px-0.5 py-0 sm:px-2 sm:py-1`}>
                          {proof.verificationStatus}
                        </Badge>
                        <Badge variant="outline" className="text-[7px] sm:text-xs px-0.5 py-0 sm:px-2 sm:py-1">
                          +{proof.xpEarned} XP
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-1.5 sm:p-6 pt-0">
                    <div className="space-y-1 sm:space-y-4">
                      {/* File Details */}
                      {proof.fileName && (
                        <div className="p-1 sm:p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center justify-between gap-1 sm:gap-2">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                              <EvidenceIcon className="w-2 h-2 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[8px] sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {proof.fileName}
                                </div>
                                <div className="text-[7px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  {getFileTypeDisplay(proof.fileType)}
                                  {proof.fileSize && ` • ${formatFileSize(proof.fileSize)}`}
                                </div>
                              </div>
                            </div>
                            {proof.signedUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewEvidence(proof)}
                                className="flex-shrink-0 p-0.5 sm:p-2 h-auto"
                              >
                                <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Evidence Description */}
                      <p className="text-[8px] sm:text-sm text-gray-600 dark:text-gray-400">
                        {proof.description}
                      </p>

                      {/* Upload Date */}
                      <div className="flex items-center gap-0.5 sm:gap-2 text-[7px] sm:text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(proof.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Roadmap Context */}
                      <div className="flex items-center gap-0.5 sm:gap-2 text-[7px] sm:text-xs text-gray-500 dark:text-gray-400">
                        <Award className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{proof.roadmapTitle}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 sm:gap-2 pt-0.5 sm:pt-2">
                        {proof.signedUrl && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-[8px] sm:text-sm h-6 sm:h-9 px-1.5 sm:px-4"
                              onClick={() => handleViewEvidence(proof)}
                            >
                              <Eye className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              View
                            </Button>
                            {proof.fileName && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-[8px] sm:text-sm h-6 sm:h-9 px-1.5 sm:px-4"
                                onClick={() => handleDownloadEvidence(proof)}
                              >
                                <Download className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">Download</span>
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProofs.length === 0 && (
          <Card className="text-center py-8 sm:py-12">
            <CardContent className="p-4 sm:p-6">
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No evidence found</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 px-2">
                {searchTerm || selectedFilter !== 'all' || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Complete tasks to start building your proof collection.'
                }
              </p>
              {(!searchTerm && selectedFilter === 'all' && selectedType === 'all') && (
                <Button onClick={() => navigate('/roadmap')} size="sm" className="text-sm">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Start Completing Tasks
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Change to default export
export default ProofLockerPage;