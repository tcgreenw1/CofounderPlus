import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  prefillData?: {
    subject?: string;
    message?: string;
    category?: string;
  };
}

interface SupportType {
  value: string;
  label: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, user, prefillData }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [supportTypes, setSupportTypes] = useState<SupportType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle prefilled data
  useEffect(() => {
    if (isOpen && prefillData) {
      if (prefillData.subject) setSubject(prefillData.subject);
      if (prefillData.message) setMessage(prefillData.message);
      if (prefillData.category) setType(prefillData.category);
    }
  }, [isOpen, prefillData]);

  // Load support types on mount
  useEffect(() => {
    const loadSupportConfig = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/support/config`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config.types) {
            setSupportTypes(data.config.types);
            // Set default type
            if (!type && data.config.types.length > 0) {
              setType(data.config.types[0].value);
            }
          }
        }
      } catch (error) {
        console.error('Error loading support config:', error);
        // Fallback support types
        setSupportTypes([
          { value: 'technical-issue', label: 'Technical Issue' },
          { value: 'billing-question', label: 'Billing Question' },
          { value: 'feature-request', label: 'Feature Request' },
          { value: 'account-help', label: 'Account Help' },
          { value: 'roadmap-question', label: 'Roadmap Question' },
          { value: 'business-setup', label: 'Business Setup' },
          { value: 'operations-help', label: 'Operations Help' },
          { value: 'general-inquiry', label: 'General Inquiry' },
          { value: 'bug-report', label: 'Bug Report' },
          { value: 'partnership-inquiry', label: 'Partnership Inquiry' },
          { value: 'enterprise', label: 'Enterprise Inquiry' }
        ]);
        if (!type) {
          setType('general-inquiry');
        }
      }
    };

    if (isOpen) {
      loadSupportConfig();
    }
  }, [isOpen, type]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form after a delay to avoid jarring UX
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setType('');
        setPriority('medium');
        setIsSuccess(false);
        setError('');
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim() || !type) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/create-ticket`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: subject.trim(),
            message: message.trim(),
            type,
            priority,
            userEmail: user.email,
            userId: user.id
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        // Close modal after success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
      setError('Failed to create support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🛟 Get Support
          </DialogTitle>
          <DialogDescription>
            Need help with your business journey? Submit a support ticket and our team will get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-green-700 dark:text-green-400">
                Support Ticket Created!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your support request has been submitted. You can track its progress on the Support page.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Support Type */}
            <div className="space-y-2">
              <Label htmlFor="support-type">Support Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="support-type">
                  <SelectValue placeholder="Select support type..." />
                </SelectTrigger>
                <SelectContent>
                  {supportTypes.map((supportType) => (
                    <SelectItem key={supportType.value} value={supportType.value}>
                      {supportType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue..."
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please provide as much detail as possible about your issue or question..."
                rows={4}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !subject.trim() || !message.trim() || !type}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Ticket
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;