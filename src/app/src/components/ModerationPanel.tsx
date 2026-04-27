import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, CheckCircle, XCircle, Clock, User, Calendar,
  MessageSquare, FileText, Eye, ThumbsUp, ThumbsDown, Filter,
  Search, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ModerationAppeal } from '../utils/contentModeration';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface ModerationPanelProps {
  user: any;
}

const reasonDisplayNames = {
  spam: 'Spam/Promotional Content',
  harassment: 'Harassment/Bullying',
  offtopic: 'Off-Topic Content',
  inappropriate: 'Inappropriate Content',
  scam: 'Potential Scam/Fraud'
};

const reasonColors = {
  spam: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  harassment: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  offtopic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  inappropriate: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  scam: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function ModerationPanel({ user }: ModerationPanelProps) {
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [selectedAppeal, setSelectedAppeal] = useState<ModerationAppeal | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('You must be logged in to view appeals');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/moderation/appeals`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAppeals(result.appeals || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to load appeals:', errorText);
        toast.error('Failed to load moderation appeals');
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
      toast.error('An error occurred while loading appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAppeal = async (appealId: string, status: 'approved' | 'rejected') => {
    try {
      setReviewing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('You must be logged in to review appeals');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/moderation/appeals/${appealId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status,
            reviewNote: reviewNote.trim()
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Update appeals list
        setAppeals(prevAppeals => 
          prevAppeals.map(appeal => 
            appeal.id === appealId ? result.appeal : appeal
          )
        );
        
        setSelectedAppeal(null);
        setReviewNote('');
        toast.success(`Appeal ${status} successfully`);
      } else {
        const errorText = await response.text();
        console.error('Failed to review appeal:', errorText);
        toast.error('Failed to review appeal');
      }
    } catch (error) {
      console.error('Error reviewing appeal:', error);
      toast.error('An error occurred while reviewing the appeal');
    } finally {
      setReviewing(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredAppeals = appeals.filter(appeal => {
    const matchesSearch = searchTerm === '' || 
      appeal.originalContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appeal.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appeal.userMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appeal.status === statusFilter;
    const matchesContentType = contentTypeFilter === 'all' || appeal.contentType === contentTypeFilter;
    
    return matchesSearch && matchesStatus && matchesContentType;
  });

  const pendingCount = appeals.filter(appeal => appeal.status === 'pending').length;
  const approvedCount = appeals.filter(appeal => appeal.status === 'approved').length;
  const rejectedCount = appeals.filter(appeal => appeal.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Content Moderation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and manage content moderation appeals
          </p>
        </div>
        <Button
          onClick={loadAppeals}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{pendingCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{approvedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{rejectedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{appeals.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Appeals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search appeals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 dark:bg-gray-700/20 border-white/30 dark:border-gray-600/30"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white/10 dark:bg-gray-700/20 border-white/30 dark:border-gray-600/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-40 bg-white/10 dark:bg-gray-700/20 border-white/30 dark:border-gray-600/30">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appeals List */}
      <div className="space-y-4">
        {filteredAppeals.length === 0 ? (
          <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No Appeals Found
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                No moderation appeals match your current filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAppeals.map((appeal) => (
            <motion.div
              key={appeal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border-white/30 dark:border-gray-700/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {appeal.contentType === 'post' ? (
                          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                            {appeal.userName}
                          </h3>
                          <Badge className={statusColors[appeal.status]}>
                            {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatTimeAgo(appeal.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAppeal(appeal)}
                      className="bg-white/10 dark:bg-gray-700/20 border-white/30 dark:border-gray-600/30"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Flagged Reasons */}
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Flagged for:</h4>
                    <div className="flex flex-wrap gap-2">
                      {appeal.flaggedReasons.map((reason) => (
                        <Badge
                          key={reason}
                          className={reasonColors[reason] || 'bg-gray-100 text-gray-800'}
                        >
                          {reasonDisplayNames[reason] || reason}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Original Content Preview */}
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Original Content:</h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {appeal.originalContent.length > 150 
                          ? `${appeal.originalContent.substring(0, 150)}...` 
                          : appeal.originalContent
                        }
                      </p>
                    </div>
                  </div>

                  {/* User's Appeal Message */}
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">User's Appeal:</h4>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        {appeal.userMessage}
                      </p>
                    </div>
                  </div>

                  {/* Review Info */}
                  {appeal.status !== 'pending' && (
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Review Decision:</h4>
                      <div className={`p-3 rounded-lg border ${
                        appeal.status === 'approved' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <p className={`text-sm ${
                          appeal.status === 'approved' 
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                        }`}>
                          {appeal.reviewNote || `Appeal ${appeal.status} by admin`}
                        </p>
                        {appeal.reviewedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Reviewed {formatTimeAgo(appeal.reviewedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Review Appeal: {selectedAppeal.userName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAppeal(null)}
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Full Content */}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Original Content:</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border max-h-40 overflow-y-auto">
                    <pre className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                      {selectedAppeal.originalContent}
                    </pre>
                  </div>
                </div>

                {/* Appeal Message */}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">User's Appeal:</h4>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200">
                      {selectedAppeal.userMessage}
                    </p>
                  </div>
                </div>

                {/* Review Note */}
                {selectedAppeal.status === 'pending' && (
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Review Note (optional):
                    </h4>
                    <Textarea
                      placeholder="Add a note explaining your decision..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                      className="bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedAppeal.status === 'pending' && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAppeal(null)}
                      disabled={reviewing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleReviewAppeal(selectedAppeal.id, 'rejected')}
                      disabled={reviewing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject Appeal
                    </Button>
                    <Button
                      onClick={() => handleReviewAppeal(selectedAppeal.id, 'approved')}
                      disabled={reviewing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve Appeal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}