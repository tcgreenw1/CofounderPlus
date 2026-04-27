import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { X, Plus, Minus, GripVertical, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useIsMobile } from './ui/use-mobile';
import { isIOS } from '../utils/platformDetection';

// All available widget types
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: string; // Component name for rendering
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'number-one-goal',
    name: '#1 Goal',
    description: 'Your top priority from Dream Board',
    icon: '⭐',
    component: 'NumberOneGoalWidget'
  },
  {
    id: 'important-notes',
    name: 'Important Notes',
    description: 'Starred notes and cards',
    icon: '📌',
    component: 'ImportantNotesWidget'
  },
  {
    id: 'recent-transactions',
    name: 'Recent Transactions',
    description: 'Latest financial activity',
    icon: '💰',
    component: 'RecentTransactionsWidget'
  },
  {
    id: 'team-overview',
    name: 'Team Overview',
    description: 'Team members and activity',
    icon: '👥',
    component: 'TeamOverviewWidget'
  }
];

interface DashboardWidgetCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgets: string[];
  onWidgetsChange: (widgets: string[]) => void;
}

export const DashboardWidgetCustomizer: React.FC<DashboardWidgetCustomizerProps> = ({
  isOpen,
  onClose,
  activeWidgets,
  onWidgetsChange
}) => {
  const [tempActiveWidgets, setTempActiveWidgets] = useState<string[]>(activeWidgets);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedWidgetsToAdd, setSelectedWidgetsToAdd] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isIOSMobile = isMobile && isIOS();

  // Update temp widgets when active widgets change
  useEffect(() => {
    setTempActiveWidgets(activeWidgets);
  }, [activeWidgets]);

  const availableWidgetsToAdd = AVAILABLE_WIDGETS.filter(
    widget => !tempActiveWidgets.includes(widget.id)
  );

  const activeWidgetDefinitions = tempActiveWidgets
    .map(id => AVAILABLE_WIDGETS.find(w => w.id === id))
    .filter(Boolean) as WidgetDefinition[];

  const toggleWidgetSelection = (widgetId: string) => {
    setSelectedWidgetsToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  const handleAddSelectedWidgets = () => {
    if (selectedWidgetsToAdd.size === 0) return;
    const newWidgets = [...tempActiveWidgets, ...Array.from(selectedWidgetsToAdd)];
    setTempActiveWidgets(newWidgets);
    setSelectedWidgetsToAdd(new Set());
    toast.success(`Added ${selectedWidgetsToAdd.size} widget${selectedWidgetsToAdd.size > 1 ? 's' : ''}`);
  };

  const handleRemoveWidget = (widgetId: string) => {
    const newWidgets = tempActiveWidgets.filter(id => id !== widgetId);
    setTempActiveWidgets(newWidgets);
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to save your preferences');
        return;
      }

      console.log('💾 Saving dashboard widgets:', tempActiveWidgets);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dashboard/widgets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ widgets: tempActiveWidgets })
        }
      );

      console.log('💾 Save response status:', response.status);
      const responseData = await response.json();
      console.log('💾 Save response data:', responseData);

      if (response.ok && responseData.success) {
        onWidgetsChange(tempActiveWidgets);
        toast.success('Dashboard customized!');
        setSelectedWidgetsToAdd(new Set());
        onClose();
      } else {
        console.error('❌ Save failed:', responseData);
        toast.error(responseData.error || responseData.details || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('❌ Error saving widget preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleCancel = () => {
    setTempActiveWidgets(activeWidgets);
    setSelectedWidgetsToAdd(new Set());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={handleCancel}
          />

          {/* Customization Panel */}
          <motion.div
            ref={panelRef}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-4xl"
            style={{ 
              marginTop: isIOSMobile ? 'calc(env(safe-area-inset-top) + 80px)' : 'env(safe-area-inset-top)',
              padding: 'var(--spacing-3)'
            }}
          >
            <Card 
              className="overflow-hidden"
              style={{
                backgroundColor: 'var(--card)',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
              }}
            >
              {/* Header */}
              <div 
                className="p-4 border-b flex items-center justify-between"
                style={{ 
                  borderColor: 'var(--border)',
                  backgroundColor: 'rgba(var(--primary-rgb), 0.05)'
                }}
              >
                <div>
                  <h2 
                    className="font-semibold"
                    style={{ 
                      color: 'var(--foreground)',
                      fontSize: '1.125rem'
                    }}
                  >
                    Customize Dashboard
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Tap minus to remove, drag to reorder, or select widgets to add
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content - Scrollable area */}
              <div 
                className="overflow-y-auto"
                style={{ 
                  maxHeight: isIOSMobile ? '40vh' : '60vh',
                  padding: 'var(--spacing-4)'
                }}
              >


                {/* Active Widgets Section */}
                {tempActiveWidgets.length > 0 && (
                  <div className="mb-6">
                    <h3 
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Active Widgets
                    </h3>
                    <Reorder.Group
                      axis="y"
                      values={tempActiveWidgets}
                      onReorder={setTempActiveWidgets}
                      className="space-y-2"
                    >
                      <AnimatePresence>
                        {activeWidgetDefinitions.map((widget) => (
                          <Reorder.Item
                            key={widget.id}
                            value={widget.id}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={() => setIsDragging(false)}
                            className="relative"
                          >
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                              style={{
                                backgroundColor: 'var(--secondary)',
                                border: '1px solid var(--border)'
                              }}
                            >
                              {/* iOS-style minus button */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveWidget(widget.id)}
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: 'var(--destructive)',
                                  color: 'var(--destructive-foreground)'
                                }}
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>

                              {/* Widget icon */}
                              <div className="flex-shrink-0 text-2xl">
                                {widget.icon}
                              </div>

                              {/* Widget info */}
                              <div className="flex-1 min-w-0">
                                <div 
                                  className="font-medium"
                                  style={{ color: 'var(--foreground)' }}
                                >
                                  {widget.name}
                                </div>
                                <div 
                                  className="text-xs"
                                  style={{ color: 'var(--muted-foreground)' }}
                                >
                                  {widget.description}
                                </div>
                              </div>

                              {/* Drag handle */}
                              <div
                                className="flex-shrink-0"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                            </motion.div>
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  </div>
                )}

                {/* Separator between active and available widgets */}
                {tempActiveWidgets.length > 0 && availableWidgetsToAdd.length > 0 && (
                  <div 
                    className="my-6"
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--border)'
                    }}
                  />
                )}

                {/* Available Widgets to Add */}
                {availableWidgetsToAdd.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 
                          className="text-sm font-medium"
                          style={{ color: 'var(--foreground)' }}
                        >
                          Available Widgets
                        </h3>
                        {selectedWidgetsToAdd.size === 0 && (
                          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                            Tap to select, then click "Add" button
                          </p>
                        )}
                      </div>
                      {selectedWidgetsToAdd.size > 0 && (
                        <Button
                          size="sm"
                          onClick={handleAddSelectedWidgets}
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add {selectedWidgetsToAdd.size} Widget{selectedWidgetsToAdd.size > 1 ? 's' : ''}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {availableWidgetsToAdd.map((widget) => {
                        const isSelected = selectedWidgetsToAdd.has(widget.id);
                        return (
                          <motion.div
                            key={widget.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleWidgetSelection(widget.id)}
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                            style={{
                              backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--muted)',
                              border: isSelected ? '2px solid var(--primary)' : '1px dashed var(--border)'
                            }}
                          >
                            {/* Checkbox */}
                            <div 
                              className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all"
                              style={{
                                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                border: isSelected ? 'none' : '2px solid var(--muted-foreground)',
                                color: isSelected ? 'var(--primary-foreground)' : 'transparent'
                              }}
                            >
                              {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                            </div>

                            {/* Widget icon */}
                            <div className="flex-shrink-0 text-2xl">
                              {widget.icon}
                            </div>

                            {/* Widget info */}
                            <div className="flex-1 min-w-0">
                              <div 
                                className="font-medium"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {widget.name}
                              </div>
                              <div 
                                className="text-xs"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                {widget.description}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {tempActiveWidgets.length === 0 && (
                  <div 
                    className="text-center py-8"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <p className="mb-4">No widgets added yet.</p>
                    <p className="text-sm">Tap on widgets below to add them to your dashboard.</p>
                  </div>
                )}
              </div>

              {/* Footer with save/cancel buttons */}
              <div 
                className="p-4 border-t flex gap-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};