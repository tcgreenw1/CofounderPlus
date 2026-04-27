import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Download,
  Share2,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface HandbookSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Handbook {
  id: string;
  business_id: string;
  role_title: string;
  role_description: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  word_count: number;
  sections: HandbookSection[];
}

export function HandbookEditor() {
  const navigate = useNavigate();
  const { handbookId } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  const [handbook, setHandbook] = useState<Handbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandingSection, setExpandingSection] = useState<string | null>(null);

  useEffect(() => {
    loadHandbook();
  }, [handbookId]);

  const loadHandbook = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken || !handbookId) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks/${handbookId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHandbook(data.handbook);
      } else {
        toast.error('Failed to load handbook');
        navigate('/operations/hr');
      }
    } catch (error) {
      console.error('Error loading handbook:', error);
      toast.error('Error loading handbook');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!handbook) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks/${handbook.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role_title: handbook.role_title,
            role_description: handbook.role_description,
            content: handbook.content,
            sections: handbook.sections,
            status: handbook.status
          })
        }
      );

      if (response.ok) {
        toast.success('Handbook saved successfully');
        await loadHandbook();
      } else {
        toast.error('Failed to save handbook');
      }
    } catch (error) {
      console.error('Error saving handbook:', error);
      toast.error('Error saving handbook');
    } finally {
      setSaving(false);
    }
  };

  const handleExpandSection = async (sectionId: string) => {
    if (!handbook) return;

    setIsExpanding(true);
    setExpandingSection(sectionId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks/${handbook.id}/expand-section`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sectionId })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHandbook(prev => prev ? {
          ...prev,
          sections: prev.sections.map(s => 
            s.id === sectionId ? { ...s, content: data.expandedContent } : s
          )
        } : null);
        toast.success('Section expanded successfully');
      } else {
        toast.error('Failed to expand section');
      }
    } catch (error) {
      console.error('Error expanding section:', error);
      toast.error('Error expanding section');
    } finally {
      setIsExpanding(false);
      setExpandingSection(null);
    }
  };

  const handlePublish = async () => {
    if (!handbook) return;

    setHandbook({ ...handbook, status: 'published' });
    await handleSave();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: 'var(--primary)' }} />
          <p className="text-sm opacity-60">Loading handbook...</p>
        </div>
      </div>
    );
  }

  if (!handbook) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm opacity-60">Handbook not found</p>
          <Button
            onClick={() => navigate('/operations/hr')}
            style={{ marginTop: 'var(--spacing-4)' }}
          >
            Back to HR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        minHeight: '100vh',
        padding: 'var(--spacing-6)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
      }}
    >
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
        style={{ 
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/operations/hr')}
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 style={{ fontWeight: 'var(--font-weight-bold)' }}>
              {handbook.role_title}
            </h1>
            <p className="text-sm opacity-60" style={{ marginTop: 'var(--spacing-1)' }}>
              Employee Handbook
            </p>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
          <Badge
            variant="outline"
            className="text-xs border-none"
            style={{
              background: handbook.status === 'published' ? '#00b89420' : '#667eea20',
              color: handbook.status === 'published' ? '#00b894' : '#667eea',
              padding: 'var(--spacing-1) var(--spacing-3)',
            }}
          >
            {handbook.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
            {handbook.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
            {handbook.status}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
              gap: 'var(--spacing-2)',
            }}
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Preview' : 'Edit'}
          </Button>

          {isEditing && (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  gap: 'var(--spacing-2)',
                }}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>

              {handbook.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  style={{
                    background: '#00b894',
                    color: 'white',
                    padding: 'var(--spacing-2) var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Publish
                </Button>
              )}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Helper Alert */}
      {isEditing && (
        <Alert
          className="border-none"
          style={{
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
          }}
        >
          <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
            <Bot className="w-5 h-5 mt-0.5" style={{ color: 'var(--primary)' }} />
            <div className="flex-1">
              <h4 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                AI Assistance Available
              </h4>
              <AlertDescription>
                Click the expand button on any section to have your Cofounder add more detailed content automatically.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Main Content */}
      <Card
        className="border-none"
        style={{
          background: 'var(--background)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <CardHeader style={{ padding: 'var(--spacing-6)' }}>
          {isEditing ? (
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
              <div>
                <Label htmlFor="role-title">Role Title</Label>
                <Input
                  id="role-title"
                  value={handbook.role_title}
                  onChange={(e) => setHandbook({ ...handbook, role_title: e.target.value })}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
              <div>
                <Label htmlFor="role-description">Role Description</Label>
                <Textarea
                  id="role-description"
                  value={handbook.role_description}
                  onChange={(e) => setHandbook({ ...handbook, role_description: e.target.value })}
                  rows={3}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
            </div>
          ) : (
            <>
              <CardTitle>{handbook.role_title}</CardTitle>
              <CardDescription>{handbook.role_description}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent style={{ padding: 'var(--spacing-6)', paddingTop: 0 }}>
          {/* Sections */}
          <div className="flex flex-col" style={{ gap: 'var(--spacing-6)' }}>
            {handbook.sections.map((section, index) => (
              <div key={section.id}>
                <div 
                  className="flex items-center justify-between"
                  style={{ marginBottom: 'var(--spacing-3)' }}
                >
                  {isEditing ? (
                    <Input
                      value={section.title}
                      onChange={(e) => {
                        const updatedSections = [...handbook.sections];
                        updatedSections[index].title = e.target.value;
                        setHandbook({ ...handbook, sections: updatedSections });
                      }}
                      style={{ fontWeight: 'var(--font-weight-semibold)' }}
                    />
                  ) : (
                    <h3 style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {section.title}
                    </h3>
                  )}

                  {isEditing && (
                    <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExpandSection(section.id)}
                        disabled={isExpanding}
                        style={{
                          padding: 'var(--spacing-1) var(--spacing-3)',
                          gap: 'var(--spacing-1)',
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        {expandingSection === section.id ? 'Expanding...' : 'Expand'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ padding: 'var(--spacing-1)' }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <Textarea
                    value={section.content}
                    onChange={(e) => {
                      const updatedSections = [...handbook.sections];
                      updatedSections[index].content = e.target.value;
                      setHandbook({ ...handbook, sections: updatedSections });
                    }}
                    rows={10}
                    style={{
                      background: 'var(--muted)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  />
                ) : (
                  <div 
                    className="whitespace-pre-wrap"
                    style={{
                      background: 'var(--muted)',
                      padding: 'var(--spacing-4)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    {section.content}
                  </div>
                )}
              </div>
            ))}

            {isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  const newSection: HandbookSection = {
                    id: Date.now().toString(),
                    title: 'New Section',
                    content: '',
                    order: handbook.sections.length
                  };
                  setHandbook({
                    ...handbook,
                    sections: [...handbook.sections, newSection]
                  });
                }}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  gap: 'var(--spacing-2)',
                }}
              >
                <Plus className="w-4 h-4" />
                Add Section
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
