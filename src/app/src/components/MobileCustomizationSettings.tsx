import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useTheme } from './ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Palette,
  Sparkles,
  Briefcase,
  Package,
  TrendingUp,
  Megaphone,
  Users,
  MapPin,
  StickyNote,
  User,
  CreditCard,
  GraduationCap,
  Shield,
  Settings,
  Sun,
  Moon,
  LifeBuoy,
  Home,
  MessageCircle,
  Calendar,
  Code
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
}

// All available nav items - NEW STRUCTURE
const availableNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
  { id: 'sales', label: 'Sales', icon: 'trending-up', path: '/operations/sales' },
  { id: 'finance', label: 'Finance', icon: 'credit-card', path: '/operations/finance' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone', path: '/operations/marketing' },
  { id: 'product', label: 'Product', icon: 'package', path: '/operations/product' },
  { id: 'hr', label: 'HR', icon: 'users', path: '/operations/hr' },
  { id: 'notes', label: 'Notes', icon: 'sticky-note', path: '/notes' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/calendar' },
  { id: 'roadmap', label: 'Roadmap', icon: 'sparkles', path: '/roadmap' },
  { id: 'support', label: 'Support', icon: 'life-buoy', path: '/support' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
];

interface MobileCustomizationSettingsProps {
  user: any;
}

export function MobileCustomizationSettings({ user }: MobileCustomizationSettingsProps) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      console.log('🔧 Loading nav customization (v2)...');
      console.log('🔧 Server URL:', `${serverUrl}/nav-customize/get`);

      const response = await fetch(`${serverUrl}/nav-customize/get`, {
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔧 Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Got nav data:', data);
        
        if (data.success && data.navItems && Array.isArray(data.navItems)) {
          console.log('✅ Setting nav items:', data.navItems);
          setSelectedItems(data.navItems);
        } else {
          console.log('⚠️ No valid nav items array, using defaults. Got:', data.navItems);
          setDefaultItems();
        }
      } else {
        console.error('❌ Failed to load nav, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setDefaultItems();
      }
    } catch (err: any) {
      console.error('❌ Error loading nav:', err);
      setDefaultItems();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultItems = () => {
    setSelectedItems([
      { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
      { id: 'operations', label: 'Operations', icon: 'briefcase', path: '/operations' },
      { id: 'roadmap', label: 'Roadmap', icon: 'sparkles', path: '/roadmap' },
      { id: 'notes', label: 'Notes', icon: 'sticky-note', path: '/notes' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/calendar' }
    ]);
  };

  const savePreferences = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      console.log('🔧 Saving nav (v2):', `${serverUrl}/nav-customize/save`);
      console.log('🔧 Nav items to save:', selectedItems);

      const response = await fetch(`${serverUrl}/nav-customize/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navItems: selectedItems
        })
      });

      console.log('🔧 Save response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Save response:', data);
        
        if (data.success) {
          setSuccess('✅ Navigation saved to database! Changes applied.');
          
          // Also save to local storage for instant updates
          localStorage.setItem('navCustomization', JSON.stringify(selectedItems));
          window.dispatchEvent(new CustomEvent('navCustomizationUpdated', { detail: selectedItems }));
          
          setTimeout(() => {
            navigate('/settings?tab=customization');
          }, 1500);
        } else {
          setError(data.error || 'Failed to save');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Save failed:', errorText);
        setError(`Failed to save: ${response.status} ${errorText}`);
      }
    } catch (err: any) {
      console.error('❌ Error saving:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const optimizeWithCofounder = async () => {
    setAiOptimizing(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      console.log('🤖 Requesting Cofounder mobile navigation optimization...');

      const response = await fetch(`${serverUrl}/nav-customize/cofounder-optimize-mobile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentItems: selectedItems,
          availableItems: availableNavItems
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Cofounder optimization result:', data);
        
        if (data.success && data.recommendedItems) {
          setSelectedItems(data.recommendedItems);
          setSuccess(`✨ Cofounder optimized your navigation! ${data.reasoning || 'Selected the best pages for your workflow.'}`);
        } else {
          setError(data.error || 'Failed to optimize navigation');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Optimization failed:', errorText);
        setError('Failed to optimize with Cofounder');
      }
    } catch (err: any) {
      console.error('❌ Error optimizing:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setAiOptimizing(false);
    }
  };

  const resetToDefault = async () => {
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

      console.log('🔧 Resetting to defaults...');

      const response = await fetch(`${serverUrl}/nav-customize/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reset response:', data);
        
        // Set the default items in state - NEW STRUCTURE
        const defaultNavItems = [
          { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
          { id: 'sales', label: 'Sales', icon: 'trending-up', path: '/operations/sales' },
          { id: 'finance', label: 'Finance', icon: 'credit-card', path: '/operations/finance' },
          { id: 'marketing', label: 'Marketing', icon: 'megaphone', path: '/operations/marketing' }
        ];
        
        setSelectedItems(defaultNavItems);
        
        // Save the defaults to local storage immediately
        localStorage.setItem('navCustomization', JSON.stringify(defaultNavItems));
        window.dispatchEvent(new CustomEvent('navCustomizationUpdated', { detail: defaultNavItems }));
        
        setSuccess('✅ Reset to defaults! Navigation updated.');
        
        // Navigate back after a brief delay
        setTimeout(() => {
          navigate('/settings?tab=customization');
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('❌ Reset failed:', errorText);
        setError(`Failed to reset: ${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ Error resetting:', err);
      setError(`Failed to reset: ${err.message}`);
    }
  };

  const addItem = (item: NavItem) => {
    if (selectedItems.length >= 7) {
      setError('Maximum 7 items allowed');
      return;
    }
    if (selectedItems.find(i => i.id === item.id)) {
      setError('Item already added');
      return;
    }
    setSelectedItems([...selectedItems, item]);
    setError(null);
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...selectedItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setSelectedItems(newItems);
  };

  const moveDown = (index: number) => {
    if (index === selectedItems.length - 1) return;
    const newItems = [...selectedItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setSelectedItems(newItems);
  };

  // Get the icon component for display
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'sparkles': Sparkles,
      'briefcase': Briefcase,
      'package': Package,
      'trending-up': TrendingUp,
      'megaphone': Megaphone,
      'users': Users,
      'map': MapPin,
      'sticky-note': StickyNote,
      'user': User,
      'users-2': Users,
      'credit-card': CreditCard,
      'graduation-cap': GraduationCap,
      'shield': Shield,
      'settings': Settings,
      'sun-moon': Sun,
      'life-buoy': LifeBuoy,
      'home': Home,
      'message-circle': MessageCircle,
      'calendar': Calendar,
      'code': Code
    };
    return iconMap[iconName] || Settings;
  };

  // Ensure selectedItems is always an array (defensive coding)
  const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];
  
  const availableToAdd = availableNavItems.filter(
    item => !safeSelectedItems.find(selected => selected.id === item.id)
  );

  // Detect if touch device for backend selection
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // Move item function for drag and drop
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = selectedItems[dragIndex];
    const newItems = [...selectedItems];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setSelectedItems(newItems);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background starry-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customization...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
      <MobileCustomizationSettingsContent 
        selectedItems={safeSelectedItems}
        setSelectedItems={setSelectedItems}
        moveItem={moveItem}
        removeItem={removeItem}
        addItem={addItem}
        savePreferences={savePreferences}
        resetToDefault={resetToDefault}
        getIconComponent={getIconComponent}
        availableToAdd={availableToAdd}
        saving={saving}
        error={error}
        success={success}
        navigate={navigate}
        optimizeWithCofounder={optimizeWithCofounder}
        aiOptimizing={aiOptimizing}
      />
    </DndProvider>
  );
}

// Draggable Nav Item Component
interface DraggableNavItemProps {
  item: NavItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (itemId: string) => void;
  getIconComponent: (iconName: string) => any;
}

const DraggableNavItem: React.FC<DraggableNavItemProps> = ({ 
  item, 
  index, 
  moveItem, 
  removeItem,
  getIconComponent
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const IconComponent = getIconComponent(item.icon);

  const [{ handlerId }, drop] = useDrop({
    accept: 'NAV_ITEM',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(draggedItem: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'NAV_ITEM',
    item: () => {
      return { id: item.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`flex items-center gap-2 p-3 border rounded-lg bg-muted/50 cursor-move transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      <IconComponent className="h-5 w-5 shrink-0 text-primary" />
      <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeItem(item.id)}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Main Content Component
interface MobileCustomizationSettingsContentProps {
  selectedItems: NavItem[];
  setSelectedItems: (items: NavItem[]) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: NavItem) => void;
  savePreferences: () => void;
  resetToDefault: () => void;
  getIconComponent: (iconName: string) => any;
  availableToAdd: NavItem[];
  saving: boolean;
  error: string | null;
  success: string | null;
  navigate: (path: string) => void;
  optimizeWithCofounder: () => void;
  aiOptimizing: boolean;
}

const MobileCustomizationSettingsContent: React.FC<MobileCustomizationSettingsContentProps> = ({
  selectedItems,
  moveItem,
  removeItem,
  addItem,
  savePreferences,
  resetToDefault,
  getIconComponent,
  availableToAdd,
  saving,
  error,
  success,
  navigate,
  optimizeWithCofounder,
  aiOptimizing
}) => {
  return (
    <div className="min-h-screen bg-background starry-background">
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6 text-purple-600" />
              Customize App
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Personalize your mobile navigation
            </p>
          </div>
        </div>

        {/* Dark/Light Mode Toggle - Toy Box Pop Styling */}
        <ThemeToggleCard />

        <Separator className="my-6" />

        {/* Info Banner */}
        <Card className="mb-6 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                  Navigation Customization
                </p>
                <p className="text-purple-700 dark:text-purple-300 text-xs">
                  Customize your navigation menu. Select up to 7 items and arrange them in your preferred order. Changes will apply to your mobile bottom navigation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Navigation Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Your Navigation ({selectedItems.length}/7)</span>
              <Badge variant={selectedItems.length === 7 ? 'default' : 'secondary'}>
                {7 - selectedItems.length} slots left
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Drag to reorder, tap X to remove
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No items selected</p>
                <p className="text-xs">Add items from the list below</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item, index) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <DraggableNavItem
                      key={item.id}
                      item={item}
                      index={index}
                      moveItem={moveItem}
                      removeItem={removeItem}
                      getIconComponent={getIconComponent}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Items to Add */}
        {availableToAdd.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Available Items</CardTitle>
              <CardDescription className="text-xs">
                Tap to add to your navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableToAdd.map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <Button
                      key={item.id}
                      variant="outline"
                      onClick={() => addItem(item)}
                      disabled={selectedItems.length >= 7}
                      className="justify-start h-auto py-3"
                    >
                      <IconComponent className="h-5 w-5 mr-2 shrink-0" />
                      <span className="text-sm truncate flex-1 text-left">{item.label}</span>
                      <Plus className="h-4 w-4 ml-2 shrink-0" />
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={savePreferences}
            disabled={saving || selectedItems.length === 0}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Customization
              </>
            )}
          </Button>

          <Button
            onClick={resetToDefault}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-sm text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Separator className="my-6" />

        {/* Info Text */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Changes apply instantly - just go back to see your new navigation</p>
          <p className="mt-1">Navigation customization affects mobile bottom navigation menu</p>
        </div>
      </div>
    </div>
  );
};

// Theme Toggle Card Component - Toy Box Pop Styling
const ThemeToggleCard: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isPinkTheme, setIsPinkTheme] = React.useState(false);

  // Load pink theme preference on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('colorTheme');
    const isPink = savedTheme === 'pink';
    setIsPinkTheme(isPink);
  }, []);

  // Toggle pink/cyan theme
  const toggleColorTheme = (checked: boolean) => {
    setIsPinkTheme(checked);
    localStorage.setItem('colorTheme', checked ? 'pink' : 'cyan');
    
    if (checked) {
      document.documentElement.classList.add('theme-pink');
    } else {
      document.documentElement.classList.remove('theme-pink');
    }
    
    // Force repaint to apply changes
    document.documentElement.style.display = 'none';
    document.documentElement.offsetHeight; // Trigger reflow
    document.documentElement.style.display = '';
  };

  return (
    <Card className="mb-6 border-2" style={{ borderColor: isPinkTheme ? '#FF1493' : '#00E0FF' }}>
      <CardHeader style={{ backgroundColor: isPinkTheme ? '#FF1493' : '#00E0FF' }}>
        <CardTitle className="text-lg flex items-center gap-2 text-white font-bold">
          <Sun className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription className="text-white/90 text-xs font-semibold">
          Choose your preferred theme
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Light/Dark Mode Toggle */}
        <div>
          <label className="text-sm font-medium mb-2 block">Light/Dark Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 h-auto py-4 px-3 bouncy-button hover:scale-105 transition-transform font-bold ${
                theme === 'light' ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ 
                backgroundColor: theme === 'light' ? '#FFCF00' : 'transparent',
                color: theme === 'light' ? '#4B00FF' : 'inherit',
                border: theme === 'light' ? '2px solid #4B00FF' : `2px solid ${isPinkTheme ? '#FF1493' : '#00E0FF'}`
              }}
            >
              <Sun className="h-6 w-6" style={{ color: theme === 'light' ? '#4B00FF' : '#FFCF00' }} />
              <span className="text-sm">Light Mode</span>
            </Button>

            <Button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 h-auto py-4 px-3 bouncy-button hover:scale-105 transition-transform font-bold ${
                theme === 'dark' ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ 
                backgroundColor: theme === 'dark' ? '#4B00FF' : 'transparent',
                color: theme === 'dark' ? '#FFFFFF' : 'inherit',
                border: theme === 'dark' ? `2px solid ${isPinkTheme ? '#FF1493' : '#00E0FF'}` : `2px solid ${isPinkTheme ? '#FF1493' : '#00E0FF'}`
              }}
            >
              <Moon className="h-6 w-6" style={{ color: theme === 'dark' ? (isPinkTheme ? '#FF1493' : '#00E0FF') : '#4B00FF' }} />
              <span className="text-sm">Dark Mode</span>
            </Button>
          </div>
        </div>

        {/* Pink/Cyan Color Theme Toggle */}
        <div>
          <label className="text-sm font-medium mb-2 block">Color Theme</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => toggleColorTheme(false)}
              className={`flex flex-col items-center gap-2 h-auto py-4 px-3 bouncy-button hover:scale-105 transition-transform font-bold ${
                !isPinkTheme ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ 
                backgroundColor: !isPinkTheme ? '#00E0FF' : 'transparent',
                color: !isPinkTheme ? '#FFFFFF' : 'inherit',
                border: !isPinkTheme ? '2px solid #4B00FF' : '2px solid #00E0FF'
              }}
            >
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: '#00E0FF' }} />
              <span className="text-sm">Cyan</span>
            </Button>

            <Button
              onClick={() => toggleColorTheme(true)}
              className={`flex flex-col items-center gap-2 h-auto py-4 px-3 bouncy-button hover:scale-105 transition-transform font-bold ${
                isPinkTheme ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ 
                backgroundColor: isPinkTheme ? '#FF1493' : 'transparent',
                color: isPinkTheme ? '#FFFFFF' : 'inherit',
                border: isPinkTheme ? '2px solid #4B00FF' : '2px solid #FF1493'
              }}
            >
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: '#FF1493' }} />
              <span className="text-sm">Pink</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};