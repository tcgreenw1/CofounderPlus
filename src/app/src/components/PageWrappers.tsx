import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import OperationsLayout from './OperationsLayout';
import CommunityHub from './CommunityHub';
import BusinessNotesPage from './BusinessNotesPage';
import NotesPageFixed from './NotesPageFixed';
import ProductOperations from './operations/ProductOperations';
import MarketingOperations from './operations/MarketingOperations';
import SalesOperations from './operations/SalesOperations';
import FinanceOperations from './operations/FinanceOperationsNew';
import HumanResourcesOperations from './operations/HumanResourcesOperations';
import { OperationsWrapper } from './operations/OperationsWrapper';
import ResponsiveLayout from './ResponsiveLayout';
import { Package, Megaphone, TrendingUp, DollarSign, Users, StickyNote } from 'lucide-react';

// Helper function to handle upgrades
const handleUpgrade = async (user: any) => {
  try {
    const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;
    
    const response = await fetch(`${serverUrl}/stripe/create-subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.email,
        plan: 'creator'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // Refresh the page to update subscription status
      window.location.reload();
    } else {
      console.error('Failed to upgrade:', data.error);
      alert('Failed to upgrade. Please try again.');
    }
  } catch (error) {
    console.error('Error upgrading:', error);
    alert('An error occurred during upgrade. Please try again.');
  }
};

export const ProductOperationsPage = ({ user }: { user: any }) => (
  <OperationsLayout 
    user={user} 
    title="Product Operations" 
    icon={<Package className="w-6 h-6" />}
    activeSection="product"
  >
    <OperationsWrapper 
      operationType="product"
      onUpgrade={() => handleUpgrade(user)}
      user={user}
    >
      <ProductOperations />
    </OperationsWrapper>
  </OperationsLayout>
);

export const MarketingOperationsPage = ({ user }: { user: any }) => (
  <OperationsLayout 
    user={user} 
    title="Marketing Operations" 
    icon={<Megaphone className="w-6 h-6" />}
    activeSection="marketing"
  >
    <OperationsWrapper 
      operationType="marketing"
      onUpgrade={() => handleUpgrade(user)}
    >
      <MarketingOperations />
    </OperationsWrapper>
  </OperationsLayout>
);

export const SalesOperationsPage = ({ user }: { user: any }) => (
  <OperationsLayout 
    user={user} 
    title="Sales Operations" 
    icon={<TrendingUp className="w-6 h-6" />}
    activeSection="sales"
  >
    <OperationsWrapper 
      operationType="sales"
      onUpgrade={() => handleUpgrade(user)}
    >
      <SalesOperations />
    </OperationsWrapper>
  </OperationsLayout>
);

export const FinanceOperationsPage = ({ user }: { user: any }) => (
  <OperationsLayout 
    user={user} 
    title="Finance Operations" 
    icon={<DollarSign className="w-6 h-6" />}
    activeSection="finance"
  >
    <OperationsWrapper 
      operationType="finance"
      onUpgrade={() => handleUpgrade(user)}
    >
      <FinanceOperations user={user} />
    </OperationsWrapper>
  </OperationsLayout>
);

export const HumanResourcesOperationsPage = ({ user }: { user: any }) => (
  <OperationsLayout 
    user={user} 
    title="Human Resources Operations" 
    icon={<Users className="w-6 h-6" />}
    activeSection="human"
  >
    <OperationsWrapper 
      operationType="hr"
      onUpgrade={() => handleUpgrade(user)}
    >
      <HumanResourcesOperations />
    </OperationsWrapper>
  </OperationsLayout>
);

export const CommunityHubPage = ({ user }: { user: any }) => {
  return (
    <ResponsiveLayout user={user}>
      <CommunityHub user={user} onBack={() => {}} />
    </ResponsiveLayout>
  );
};

export const NotesPageWrapper = ({ user }: { user: any }) => {
  return (
    <ResponsiveLayout user={user}>
      <NotesPageFixed user={user} />
    </ResponsiveLayout>
  );
};