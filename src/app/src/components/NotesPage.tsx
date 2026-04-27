import React, { useState, useEffect, useRef } from 'react';

// NOTE: This may not be the notes page that was worked on for hours - 
// keeping it just in case there are wires crossed but this might be the wrong version
// UPDATE: Confirmed this is NOT the correct notes page either
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import SupportButton from './SupportButton';
import { 
  ArrowLeft, Moon, Sun, HelpCircle, Menu, StickyNote, Plus, MoreHorizontal,
  Edit3, Trash2, Calendar, Flag, Tag, Search, Filter, Users, TrendingUp, 
  Target, DollarSign, LogOut, Map, X, Check, AlertCircle, CheckCircle2,
  Eye, EyeOff, FileText
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { useBusiness } from './BusinessContext';
import { useIsMobile } from './ui/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { VisuallyHidden } from './ui/visually-hidden';
import { Star } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  is_private: boolean;
  is_completed: boolean;
}

const NotesPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { selectedBusiness } = useBusiness();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPrivate, setShowPrivate] = useState(true);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    is_private: false
  });

  // Note categories
  const categories = [
    { id: 'all', label: 'All Notes', count: notes.length },
    { id: 'general', label: 'General', count: notes.filter(n => n.category === 'general').length },
    { id: 'ideas', label: 'Ideas', count: notes.filter(n => n.category === 'ideas').length },
    { id: 'meetings', label: 'Meetings', count: notes.filter(n => n.category === 'meetings').length },
    { id: 'tasks', label: 'Tasks', count: notes.filter(n => n.category === 'tasks').length },
    { id: 'research', label: 'Research', count: notes.filter(n => n.category === 'research').length }
  ];

  // Sample notes data
  useEffect(() => {
    if (selectedBusiness) {
      const sampleNotes: Note[] = [
        {
          id: '1',
          title: 'Product Launch Strategy',
          content: 'Key points for our upcoming product launch:\\n\\n• Target audience: Tech-savvy millennials\\n• Launch date: Q2 2024\\n• Marketing budget: $50k\\n• Key channels: Social media, content marketing',
          category: 'ideas',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          business_id: selectedBusiness.id,
          is_private: false,
          is_completed: false
        },
        {
          id: '2',
          title: 'Weekly Team Meeting',
          content: 'Attendees: Sarah, Mike, Lisa\\n\\nDiscussed:\\n- Q1 progress review\\n- New hire onboarding\\n- Budget allocation for Q2\\n\\nAction items:\\n- Update project timeline\\n- Schedule client calls',
          category: 'meetings',
          created_at: '2024-01-14T14:00:00Z',
          updated_at: '2024-01-14T14:00:00Z',
          business_id: selectedBusiness.id,
          is_private: false,
          is_completed: false
        },
        {
          id: '3',
          title: 'Competitor Analysis',
          content: 'Key competitors in the market:\\n\\n1. CompanyA - Strong social media presence\\n2. CompanyB - Lower pricing strategy\\n3. CompanyC - Better customer support\\n\\nOpportunities: Better feature set, premium positioning',
          category: 'research',
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T09:15:00Z',
          business_id: selectedBusiness.id,
          is_private: true,
          is_completed: false
        },
        {
          id: '4',
          title: 'Q1 Tasks Checklist',
          content: '□ Update website copy\\n□ Launch email campaign\\n□ Hire 2 new developers\\n□ Finalize Q2 budget\\n□ Client feedback survey\\n□ Product demo video',
          category: 'tasks',
          created_at: '2024-01-12T11:45:00Z',
          updated_at: '2024-01-12T11:45:00Z',
          business_id: selectedBusiness.id,
          is_private: false,
          is_completed: false
        }
      ];
      setNotes(sampleNotes);
    }
  }, [selectedBusiness]);

  // Filter notes based on search term, category, and privacy settings
  useEffect(() => {
    let filtered = notes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Filter by privacy
    if (!showPrivate) {
      filtered = filtered.filter(note => !note.is_private);
    }

    // Sort notes: incomplete notes first, then completed notes at bottom
    filtered = filtered.sort((a, b) => {
      if (a.is_completed && !b.is_completed) return 1;
      if (!a.is_completed && b.is_completed) return -1;
      // If both have same completion status, sort by updated date (newest first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    setFilteredNotes(filtered);
  }, [notes, searchTerm, selectedCategory, showPrivate]);

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !selectedBusiness) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business_id: selectedBusiness.id,
      is_private: newNote.is_private,
      is_completed: false
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '', category: 'general', is_private: false });
    setIsCreatingNote(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.title.trim()) return;

    setNotes(prev => prev.map(note =>
      note.id === editingNote.id
        ? { ...editingNote, updated_at: new Date().toISOString() }
        : note
    ));
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleCompleteNote = (noteId: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, is_completed: !note.is_completed, updated_at: new Date().toISOString() }
        : note
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Mobile Note Creation Sheet
  const MobileCreateNoteSheet = () => (
    <Sheet open={isCreatingNote} onOpenChange={setIsCreatingNote}>
      <SheetContent side="bottom" className="h-[85vh] mobile-sheet mobile-fade-in">
        <VisuallyHidden>
          <SheetTitle>Create New Note</SheetTitle>
          <SheetDescription>Add a new note to your collection</SheetDescription>
        </VisuallyHidden>
        <div className="h-full flex flex-col mobile-scroll">
          <div className="mobile-compact border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="mobile-text-lg font-bold">New Note</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mobile-touch-target p-1 h-8 w-8" 
                onClick={() => setIsCreatingNote(false)}
              >
                <X className="mobile-icon-sm" />
              </Button>
            </div>
          </div>

          <div className="flex-1 mobile-compact mobile-space-y-2">
            {/* Title Input */}
            <div>
              <label className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Title
              </label>
              <Input
                className="mobile-input"
                placeholder="Enter note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Category and Privacy Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Category
                </label>
                <select
                  className="w-full mobile-input"
                  value={newNote.category}
                  onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="general">General</option>
                  <option value="ideas">Ideas</option>
                  <option value="meetings">Meetings</option>
                  <option value="tasks">Tasks</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 mobile-text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={newNote.is_private}
                    onChange={(e) => setNewNote(prev => ({ ...prev, is_private: e.target.checked }))}
                  />
                  Private
                </label>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <label className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Content
              </label>
              <Textarea
                className="mobile-input resize-none h-[200px]"
                placeholder="Write your note content here..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>

          <div className="mobile-compact border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 mobile-button-secondary mobile-touch-target"
                onClick={() => setIsCreatingNote(false)}
              >
                <span className="mobile-text-sm">Cancel</span>
              </Button>
              <Button 
                className="flex-1 mobile-button-primary mobile-touch-target"
                onClick={handleCreateNote}
                disabled={!newNote.title.trim()}
              >
                <span className="mobile-text-sm">Create Note</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Mobile Edit Note Sheet
  const MobileEditNoteSheet = () => (
    <Sheet open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
      <SheetContent side="bottom" className="h-[85vh] mobile-sheet mobile-fade-in">
        <VisuallyHidden>
          <SheetTitle>Edit Note</SheetTitle>
          <SheetDescription>Edit your note</SheetDescription>
        </VisuallyHidden>
        {editingNote && (
          <div className="h-full flex flex-col mobile-scroll">
            <div className="mobile-compact border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="mobile-text-lg font-bold">Edit Note</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mobile-touch-target p-1 h-8 w-8" 
                  onClick={() => setEditingNote(null)}
                >
                  <X className="mobile-icon-sm" />
                </Button>
              </div>
            </div>

            <div className="flex-1 mobile-compact mobile-space-y-2">
              {/* Title Input */}
              <div>
                <label className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Title
                </label>
                <Input
                  className="mobile-input"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              {/* Category and Privacy Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Category
                  </label>
                  <select
                    className="w-full mobile-input"
                    value={editingNote.category}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, category: e.target.value } : null)}
                  >
                    <option value="general">General</option>
                    <option value="ideas">Ideas</option>
                    <option value="meetings">Meetings</option>
                    <option value="tasks">Tasks</option>
                    <option value="research">Research</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 mobile-text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={editingNote.is_private}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, is_private: e.target.checked } : null)}
                    />
                    Private
                  </label>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <label className="mobile-text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Content
                </label>
                <Textarea
                  className="mobile-input resize-none h-[200px]"
                  value={editingNote.content}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                />
              </div>
            </div>

            <div className="mobile-compact border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 mobile-button-secondary mobile-touch-target"
                  onClick={() => setEditingNote(null)}
                >
                  <span className="mobile-text-sm">Cancel</span>
                </Button>
                <Button 
                  className="flex-1 mobile-button-primary mobile-touch-target"
                  onClick={handleUpdateNote}
                >
                  <span className="mobile-text-sm">Save Changes</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );

  if (!selectedBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center mobile-content">
        <div className="text-center mobile-space-y-2">
          <FileText className="mx-auto mobile-icon-md text-gray-400" />
          <h3 className="mobile-text-base font-medium text-gray-900 dark:text-gray-100">No Business Selected</h3>
          <p className="mobile-text-sm text-gray-600 dark:text-gray-400">
            Please select a business to view notes
          </p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background-light">
        {/* Mobile Main Content - Extra padding for fixed header */}
        <div className="mobile-content" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}>
          {/* Mobile Search and Filter Header - very compact */}
          <div className="mb-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 mobile-icon-xs text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mobile-search pl-7"
              />
            </div>

            {/* Category Filter Pills - very compact */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 mobile-touch-target rounded-full px-3 py-1 transition-all duration-150 ${
                    selectedCategory === category.id
                      ? 'mobile-button-primary'
                      : 'mobile-button-secondary'
                  }`}
                >
                  <span className="mobile-text-xs font-medium">{category.label}</span>
                  {category.count > 0 && (
                    <span className="ml-1 mobile-text-xs opacity-80">({category.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List - very compact */}
          <div className="space-y-2">
            <AnimatePresence>
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-3 border mobile-fade-in relative ${
                      note.is_completed 
                        ? 'bg-yellow-50/90 dark:bg-yellow-900/20 border-yellow-400/60 dark:border-yellow-600/50' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Completion Button - Small icon to the left of title */}
                        <button
                          onClick={() => handleCompleteNote(note.id)}
                          className={`flex-shrink-0 w-4 h-4 rounded border transition-all duration-200 mt-0.5 flex items-center justify-center ${
                            note.is_completed
                              ? 'bg-yellow-500 border-yellow-500 text-white'
                              : 'border-gray-300 hover:border-yellow-400 bg-white dark:bg-gray-700 dark:border-gray-500 dark:hover:border-yellow-400'
                          }`}
                        >
                          {note.is_completed && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-semibold truncate ${
                            note.is_completed 
                              ? 'text-yellow-800 dark:text-yellow-200 line-through' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {note.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`text-xs px-1.5 py-0 ${
                              note.is_completed ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : ''
                            }`}>
                              {note.category}
                            </Badge>
                            {note.is_private && (
                              <Badge className="text-xs px-1.5 py-0 bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                                Private
                              </Badge>
                            )}
                            {note.is_completed && (
                              <Badge className="text-xs px-1.5 py-0 bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600">
                                Done
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-0.5 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNote(note)}
                          className="p-1 h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:shadow-none"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:shadow-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className={`text-xs line-clamp-2 mb-1.5 ml-6 ${
                      note.is_completed 
                        ? 'text-yellow-700 dark:text-yellow-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {note.content.length > 80 ? note.content.slice(0, 80) + '...' : note.content}
                    </p>

                    <div className="flex items-center justify-between ml-6">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(note.created_at)}
                      </span>
                      {note.updated_at !== note.created_at && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Updated
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 mobile-fade-in"
                >
                  <StickyNote className="mx-auto mobile-icon-md text-gray-400 dark:text-gray-600 mb-3" />
                  <h3 className="mobile-text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {searchTerm || selectedCategory !== 'all' ? 'No matching notes' : 'No notes yet'}
                  </h3>
                  <p className="mobile-text-sm text-gray-500 dark:text-gray-500 mb-4">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first note to get started'
                    }
                  </p>
                  {(!searchTerm && selectedCategory === 'all') && (
                    <Button 
                      onClick={() => setIsCreatingNote(true)}
                      className="mobile-button-primary mobile-touch-target"
                    >
                      <Plus className="mobile-icon-sm mr-1" />
                      <span className="mobile-text-sm">Create Note</span>
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <button
          onClick={() => setIsCreatingNote(true)}
          className="mobile-fab mobile-touch-target"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {/* Mobile Create Note Sheet */}
        <MobileCreateNoteSheet />
        
        {/* Mobile Edit Note Sheet */}
        <MobileEditNoteSheet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Warm meteor shower for notes page - inspiring creativity */}
      <div className="shooting-star" style={{ animationDelay: '12s', animationDuration: '4.1s', top: '15%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '45s', animationDuration: '5.3s', top: '42%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '78s', animationDuration: '4.7s', top: '68%' }}></div>
      {/* Sidebar with enhanced glass morphism */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border-r border-white/30 dark:border-blue-400/20 shadow-2xl transform transition-transform duration-300 ${isMobile ? 'hidden' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-2 p-6 border-b border-white/20 dark:border-blue-400/20">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Cofounder
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsCreatingNote(true)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 border bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl text-white"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create Note</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Support Button */}
          <div className="p-4 border-t border-white/20 dark:border-blue-400/20">
            <SupportButton />
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-white/20 dark:border-blue-400/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold">
                  {selectedBusiness?.name?.charAt(0) || 'B'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-blue-100">
                  {selectedBusiness?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-blue-300">
                  {selectedBusiness?.id}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNote}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-blue-300 hover:bg-white/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-white/30 dark:hover:border-blue-400/30"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header with enhanced glass morphism */}
        <header className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border-b border-white/30 dark:border-blue-400/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCreatingNote(true)}
                className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-blue-900/30 transition-colors border border-transparent hover:border-white/30 dark:hover:border-blue-400/30 text-gray-700 dark:text-blue-200"
              >
                <Plus className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white shadow-lg">
                  <StickyNote className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-blue-100">
                  Notes
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-blue-300" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white/20 dark:bg-gray-900/30 backdrop-blur-lg border-white/30 dark:border-blue-400/30 shadow-lg focus:border-blue-500/50 focus:shadow-xl transition-all text-gray-800 dark:text-blue-100 placeholder:text-gray-500 dark:placeholder:text-blue-300"
                />
              </div>
              
              <button
                onClick={() => setIsCreatingNote(true)}
                className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl transition-all">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Note Categories */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-medium text-gray-800 dark:text-blue-100">Categories</h2>
                <Separator className="h-0.5 w-16 bg-gray-300 dark:bg-gray-700" />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPrivate(!showPrivate)}
                  className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-blue-900/30 transition-colors border border-transparent hover:border-white/30 dark:hover:border-blue-400/30 text-gray-700 dark:text-blue-200"
                >
                  {showPrivate ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 dark:bg-gray-900/20 hover:bg-white/30 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <Card key={note.id} className={`relative bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg border-white/30 dark:border-blue-400/20 shadow-xl transition-all duration-300 ${
                  note.is_completed 
                    ? 'bg-yellow-50/90 dark:bg-yellow-900/20 border-yellow-400/60 dark:border-yellow-600/50' 
                    : ''
                }`}>
                  {/* Completion Star Button - Beautiful star to the left of title */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={() => handleCompleteNote(note.id)}
                      className={`flex-shrink-0 transition-all duration-300 mt-0.5 ${
                        note.is_completed
                          ? 'text-yellow-500 hover:text-yellow-600 drop-shadow-sm dark:drop-shadow-none'
                          : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600 dark:hover:text-yellow-400'
                      }`}
                    >
                      {note.is_completed ? (
                        <Star className="w-3 h-3 fill-current" />
                      ) : (
                        <Star className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <CardHeader className="pl-14">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-base ${
                        note.is_completed 
                          ? 'text-yellow-800 dark:text-yellow-200 line-through' 
                          : ''
                      }`}>{note.title}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className={`text-xs ${
                          note.is_completed ? 'bg-yellow-100 text-yellow-800' : ''
                        }`}>
                          {note.category}
                        </Badge>
                        {note.is_completed && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-400">
                            Done
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNote(note)}
                          className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 dark:shadow-none"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:shadow-none"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-14">
                    <p className={`text-sm ${
                      note.is_completed 
                        ? 'text-yellow-700 dark:text-yellow-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <StickyNote className="w-16 h-16 mx-auto text-gray-400 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No Notes Found
                </h3>
                <p className="text-gray-500 dark:text-blue-300 mb-4">
                  Create a new note to start organizing your thoughts.
                </p>
                <Button 
                  onClick={() => setIsCreatingNote(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default NotesPage;