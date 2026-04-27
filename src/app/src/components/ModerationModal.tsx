import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, MessageSquare, Send, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getModerationMessage, createAppeal, ModerationAppeal } from '../utils/contentModeration';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  flaggedReasons: string[];
  originalContent: string;
  contentType: 'post' | 'comment';
  postId?: string;
  commentId?: string;
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

export function ModerationModal({
  isOpen,
  onClose,
  flaggedReasons,
  originalContent,
  contentType,
  postId,
  commentId,
  user
}: ModerationModalProps) {
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  const moderationMessage = getModerationMessage(flaggedReasons);

  const handleSubmitAppeal = async () => {
    if (!appealMessage.trim()) {
      toast.error('Please provide a reason for your appeal');
      return;
    }

    try {
      setIsSubmittingAppeal(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('You must be logged in to submit an appeal');
        return;
      }

      const appeal = createAppeal(
        user.id,
        user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        contentType,
        originalContent,
        flaggedReasons,
        appealMessage.trim(),
        postId,
        commentId
      );

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/moderation/appeals`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appeal)
        }
      );

      if (response.ok) {
        setAppealSubmitted(true);
        toast.success('Your appeal has been submitted for review');
      } else {
        const errorText = await response.text();
        console.error('Failed to submit appeal:', errorText);
        toast.error('Failed to submit appeal. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      toast.error('An error occurred while submitting your appeal');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-red-200 dark:border-red-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-red-800 dark:text-red-200">
                    Content Flagged for Review
                  </CardTitle>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Your {contentType} has been flagged for the following reason{flaggedReasons.length > 1 ? 's' : ''}:
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Flagged Reasons */}
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Flagged for:</h4>
              <div className="flex flex-wrap gap-2">
                {flaggedReasons.map((reason) => (
                  <Badge
                    key={reason}
                    className={reasonColors[reason] || 'bg-gray-100 text-gray-800'}
                  >
                    {reasonDisplayNames[reason] || reason}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Moderation Message */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">
                {moderationMessage}
              </p>
            </div>

            {/* Original Content Preview */}
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Your original content:</h4>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {originalContent.length > 200 
                    ? `${originalContent.substring(0, 200)}...` 
                    : originalContent
                  }
                </p>
              </div>
            </div>

            {/* Appeal Section */}
            {!appealSubmitted ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    Think this was flagged by mistake?
                  </h4>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can appeal this decision by explaining why you believe your content should be allowed.
                  Our moderation team will review your appeal within 24 hours.
                </p>

                <Textarea
                  placeholder="Explain why you believe this content should be allowed..."
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  rows={4}
                  className="bg-white/50 dark:bg-gray-800/50"
                />

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmittingAppeal}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleSubmitAppeal}
                    disabled={isSubmittingAppeal || !appealMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingAppeal ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Appeal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Appeal Submitted Successfully
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your appeal has been sent to our moderation team for review. 
                  You'll be notified of the decision within 24 hours.
                </p>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}