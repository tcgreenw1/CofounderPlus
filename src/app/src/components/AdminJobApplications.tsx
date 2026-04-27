import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  Eye,
  Trash2,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Search,
  ExternalLink
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  linkedIn: string;
  yearsOfExperience: string;
  currentRole: string;
  education: string;
  relevantExpertise: string;
  whyInterested: string;
  availability: string;
  resumeText: string;
  submittedAt: string;
  status: 'new' | 'reviewed' | 'interviewing' | 'accepted' | 'rejected';
  notes: string;
  lastUpdated?: string;
}

interface ApplicationStats {
  total: number;
  byStatus: {
    new: number;
    reviewed: number;
    interviewing: number;
    accepted: number;
    rejected: number;
  };
  byJob: Record<string, number>;
  recent: Array<{
    id: string;
    name: string;
    job: string;
    submittedAt: string;
    status: string;
  }>;
}

function AdminJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJob, setFilterJob] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadApplications();
    loadStats();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/job-applications`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setApplications(result.applications || []);
      } else {
        toast.error('Failed to load applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/job-applications-stats`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowDetailDialog(true);
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    setUpdating(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/job-applications/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, notes })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Application updated successfully');
        await loadApplications();
        await loadStats();
        
        if (selectedApplication?.id === id) {
          setSelectedApplication(result.application);
        }
      } else {
        toast.error('Failed to update application');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Error updating application');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/job-applications/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Application deleted successfully');
        setShowDetailDialog(false);
        await loadApplications();
        await loadStats();
      } else {
        toast.error('Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Error deleting application');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { background: 'var(--primary)', color: 'var(--primary-foreground)' };
      case 'reviewed':
        return { background: 'var(--accent)', color: 'var(--accent-foreground)' };
      case 'interviewing':
        return { background: 'var(--energy)', color: 'var(--energy-foreground)' };
      case 'accepted':
        return { background: 'var(--success)', color: 'var(--success-foreground)' };
      case 'rejected':
        return { background: 'var(--destructive)', color: 'var(--destructive-foreground)' };
      default:
        return { background: 'var(--muted)', color: 'var(--muted-foreground)' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="size-4" />;
      case 'reviewed':
        return <Eye className="size-4" />;
      case 'interviewing':
        return <Users className="size-4" />;
      case 'accepted':
        return <CheckCircle className="size-4" />;
      case 'rejected':
        return <XCircle className="size-4" />;
      default:
        return <Clock className="size-4" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesJob = filterJob === 'all' || app.jobId === filterJob;
    const matchesSearch = searchQuery === '' || 
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesJob && matchesSearch;
  });

  const uniqueJobs = Array.from(new Set(applications.map(app => app.jobId)));

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center" style={{ background: 'var(--card)' }}>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading applications...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2" style={{ color: 'var(--foreground)' }}>Job Applications</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Manage and review job applications for AI training positions
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <Briefcase className="size-5" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
                  {stats.total}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>New</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
                  {stats.byStatus.new}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                <Eye className="size-5" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Reviewed</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
                  {stats.byStatus.reviewed}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--energy)', color: 'var(--energy-foreground)' }}>
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Interviewing</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
                  {stats.byStatus.interviewing}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--success)', color: 'var(--success-foreground)' }}>
                <CheckCircle className="size-5" />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Accepted</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
                  {stats.byStatus.accepted}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label style={{ color: 'var(--card-foreground)' }}>Search</Label>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Search by name, email, or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{
                  background: 'var(--input-background)',
                  borderColor: 'var(--border)',
                  color: 'var(--card-foreground)'
                }}
              />
            </div>
          </div>

          <div>
            <Label style={{ color: 'var(--card-foreground)' }}>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ color: 'var(--card-foreground)' }}>Job Position</Label>
            <Select value={filterJob} onValueChange={setFilterJob}>
              <SelectTrigger style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {uniqueJobs.map(jobId => (
                  <SelectItem key={jobId} value={jobId}>
                    {applications.find(a => a.jobId === jobId)?.jobTitle || jobId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card className="p-8 text-center border-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>
              No applications found matching your filters.
            </p>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="p-4 sm:p-6 border-2 hover:shadow-lg transition-all duration-300"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 style={{ color: 'var(--card-foreground)' }}>{application.fullName}</h3>
                    <Badge style={getStatusBadgeStyle(application.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        <span className="capitalize">{application.status}</span>
                      </span>
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p style={{ color: 'var(--card-foreground)' }}>
                      <strong>Position:</strong> {application.jobTitle}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="flex items-center gap-1">
                        <Mail className="size-4" />
                        {application.email}
                      </span>
                      {application.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-4" />
                          {application.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        {new Date(application.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {application.currentRole && (
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <strong>Current Role:</strong> {application.currentRole}
                      </p>
                    )}
                    {application.yearsOfExperience && (
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <strong>Experience:</strong> {application.yearsOfExperience}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                  <Button
                    onClick={() => handleViewDetails(application)}
                    size="sm"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)'
                    }}
                  >
                    <Eye className="size-4 sm:mr-2" />
                    <span className="hidden sm:inline">View Details</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Application Detail Dialog */}
      {selectedApplication && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)'
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--card-foreground)' }}>
                Application Details
              </DialogTitle>
              <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
                Review and manage this job application
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                {/* Personal Information */}
                <div className="space-y-3">
                  <h4 style={{ color: 'var(--card-foreground)' }}>Personal Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                    <div>
                      <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Full Name</p>
                      <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Email</p>
                      <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.email}</p>
                    </div>
                    {selectedApplication.phone && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Phone</p>
                        <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.phone}</p>
                      </div>
                    )}
                    {selectedApplication.linkedIn && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>LinkedIn</p>
                        <a 
                          href={selectedApplication.linkedIn} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--primary)' }}
                        >
                          View Profile <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Background */}
                <div className="space-y-3">
                  <h4 style={{ color: 'var(--card-foreground)' }}>Professional Background</h4>
                  <div className="space-y-4 p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                    <div>
                      <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Position Applied For</p>
                      <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.jobTitle}</p>
                    </div>
                    {selectedApplication.currentRole && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Current Role</p>
                        <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.currentRole}</p>
                      </div>
                    )}
                    {selectedApplication.yearsOfExperience && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Years of Experience</p>
                        <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.yearsOfExperience}</p>
                      </div>
                    )}
                    {selectedApplication.education && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Education & Certifications</p>
                        <p className="whitespace-pre-wrap" style={{ color: 'var(--card-foreground)' }}>
                          {selectedApplication.education}
                        </p>
                      </div>
                    )}
                    {selectedApplication.availability && (
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Availability</p>
                        <p style={{ color: 'var(--card-foreground)' }}>{selectedApplication.availability}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expertise */}
                {selectedApplication.relevantExpertise && (
                  <div className="space-y-3">
                    <h4 style={{ color: 'var(--card-foreground)' }}>Relevant Expertise</h4>
                    <div className="p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                      <p className="whitespace-pre-wrap" style={{ color: 'var(--card-foreground)' }}>
                        {selectedApplication.relevantExpertise}
                      </p>
                    </div>
                  </div>
                )}

                {/* Why Interested */}
                {selectedApplication.whyInterested && (
                  <div className="space-y-3">
                    <h4 style={{ color: 'var(--card-foreground)' }}>Why Interested</h4>
                    <div className="p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                      <p className="whitespace-pre-wrap" style={{ color: 'var(--card-foreground)' }}>
                        {selectedApplication.whyInterested}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resume */}
                {selectedApplication.resumeText && (
                  <div className="space-y-3">
                    <h4 style={{ color: 'var(--card-foreground)' }}>Resume/CV</h4>
                    <div className="p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                      <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--card-foreground)' }}>
                        {selectedApplication.resumeText}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manage" className="space-y-6 mt-4">
                {/* Status Management */}
                <div className="space-y-3">
                  <h4 style={{ color: 'var(--card-foreground)' }}>Update Status</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['new', 'reviewed', 'interviewing', 'accepted', 'rejected'].map((status) => (
                      <Button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedApplication.id, status, selectedApplication.notes)}
                        disabled={updating || selectedApplication.status === status}
                        variant={selectedApplication.status === status ? 'default' : 'outline'}
                        style={
                          selectedApplication.status === status
                            ? getStatusBadgeStyle(status)
                            : { borderColor: 'var(--border)', color: 'var(--card-foreground)' }
                        }
                      >
                        {getStatusIcon(status)}
                        <span className="ml-2 capitalize">{status}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <Label htmlFor="notes" style={{ color: 'var(--card-foreground)' }}>
                    Internal Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={selectedApplication.notes}
                    onChange={(e) => setSelectedApplication({ ...selectedApplication, notes: e.target.value })}
                    placeholder="Add internal notes about this application..."
                    rows={6}
                    style={{
                      background: 'var(--input-background)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  />
                  <Button
                    onClick={() => handleUpdateStatus(selectedApplication.id, selectedApplication.status, selectedApplication.notes)}
                    disabled={updating}
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)'
                    }}
                  >
                    {updating ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                  <h4 style={{ color: 'var(--card-foreground)' }}>Metadata</h4>
                  <div className="p-4 rounded-lg space-y-2 text-sm" style={{ background: 'var(--muted)' }}>
                    <p style={{ color: 'var(--muted-foreground)' }}>
                      <strong>Application ID:</strong> {selectedApplication.id}
                    </p>
                    <p style={{ color: 'var(--muted-foreground)' }}>
                      <strong>Submitted:</strong> {new Date(selectedApplication.submittedAt).toLocaleString()}
                    </p>
                    {selectedApplication.lastUpdated && (
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        <strong>Last Updated:</strong> {new Date(selectedApplication.lastUpdated).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-3 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <h4 style={{ color: 'var(--destructive)' }}>Danger Zone</h4>
                  <Button
                    onClick={() => handleDeleteApplication(selectedApplication.id)}
                    variant="destructive"
                    style={{
                      background: 'var(--destructive)',
                      color: 'var(--destructive-foreground)'
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Application
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminJobApplications;
