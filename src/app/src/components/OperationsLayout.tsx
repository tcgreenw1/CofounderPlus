import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useBusiness } from './BusinessContext';
import { BusinessSwitcher } from './BusinessSwitcher';
import ResponsiveLayout from './ResponsiveLayout';
import { 
  ArrowLeft, Moon, Sun, HelpCircle, Menu, TrendingUp, Target, Users, DollarSign, 
  CheckCircle, Clock, Star, BookOpen, MessageSquare, StickyNote, LogOut, 
  Map, Package, Megaphone, Home, Settings, User, 
  X, ChevronRight, Building2, Wifi, WifiOff, Server
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import HelpSystem from './HelpSystem';
import SupportButton from './SupportButton';
import { Button } from './ui/button';
import { Sheet, SheetContent } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

interface OperationsLayoutProps {
  user: any;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  activeSection: string;
}

function OperationsLayout({ user, title, icon, children, activeSection }: OperationsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { 
    selectedBusiness, 
    userBusinesses, 
    isServerAvailable, 
    serverErrorMessage 
  } = useBusiness();
  const [userData, setUserData] = useState<any>(null);
  const [customServerAvailable, setCustomServerAvailable] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <ResponsiveLayout 
      user={user} 
      customServerAvailable={customServerAvailable}
    >
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-sky-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950">
        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              {icon}
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            {selectedBusiness && (
              <p className="text-muted-foreground">
                Managing {selectedBusiness.name}
              </p>
            )}
          </div>

          {/* Main Content */}
          {children}
        </div>
      </div>
    </ResponsiveLayout>
  );
}

export default OperationsLayout;