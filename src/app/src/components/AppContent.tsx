import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useBusiness } from './BusinessContext';
import { LoadingSpinner } from './LoadingSpinner';
import { useIsMobile } from './ui/use-mobile';
import { useRouteTracking } from '../hooks/useRouteTracking';
import { getLastRoute } from '../utils/routePersistence';

// Essential imports only
import Homepage from './Homepage';
import { MobileWelcome } from './MobileWelcome';
import { MobileHomeRedirect } from './MobileHomeRedirect';
import Questionnaire from './Questionnaire';
import PathChoice from './PathChoice';
import BusinessInfoForm from './BusinessInfoForm';
import PersonalityTest from './PersonalityTest';
import BusinessNameGenerator from './BusinessNameGenerator';
import AuthPage from './AuthPage';
import EnhancedAuthPage from './EnhancedAuthPage';
import AuthCallback from './AuthCallback';
import PhoneSignupCompletion from './PhoneSignupCompletion';
import { BillingRedirect } from './BillingRedirect';
import { PlaidOAuthRedirect } from './PlaidOAuthRedirect';
import { AdminAccountCreator } from './AdminAccountCreator';
import { ProtectedDashboard } from './ProtectedRoutes';
import ResponsiveLayout from './ResponsiveLayout';
import { NotFoundPage } from './NotFoundPage';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { OnboardingTour, useOnboarding } from './OnboardingTour';
import { isAdminUser } from '../utils/authUtils';
import { EmailAuthExample } from './EmailAuthExample';
import { FounderSetupCallLanding } from './FounderSetupCallLanding';
import { FounderCallBooking } from './FounderCallBooking';
import { BookingConfirmation } from './BookingConfirmation';
import { TaskAutomationSetup } from './TaskAutomationSetup';
import { TaskAutomationBooking } from './TaskAutomationBooking';
import { TaskAutomations } from './TaskAutomations';

// Main app pages
import { RoadmapScreenEnhanced } from './roadmap/RoadmapScreenEnhanced';
import { RoadmapScreenGlass } from './roadmap/RoadmapScreenGlass';
import { MasteryScreen } from './roadmap/MasteryScreen';
import { RoadmapDataModelSchema } from './roadmap/RoadmapDataModelSchema';
import { RoadmapDataModel } from './roadmap/RoadmapDataModel';
import { ReactScaffoldingRoadmap } from './roadmap/ReactScaffoldingRoadmap';
import { AGILogicEngineBlueprint } from './roadmap/AGILogicEngineBlueprint';
import DreamBoardPage from './DreamBoardPage';
import NotesPageContent from './NotesPageContent';
import { TodoListPage } from './TodoListPage';
import { ProofLockerPage } from './ProofLockerPage';
import AdminDashboard from './AdminDashboard';
import { CreditDiagnostic } from './CreditDiagnostic';
import { PricingPage } from './PricingPage';
import Upgrade from './Upgrade';

// Missing page imports
import UniversityPage from './UniversityPage';
import CofounderAIPage from './CofounderAIPage';
import CofounderMake from './CofounderMake'; // Switched back to full version
// import CofounderMake from './CofounderMakeSimple'; // TEMP: Using simple version to test
import GitHubCallback from './GitHubCallback';

// Additional imports
import SupportPage from './SupportPage';
import { SettingsPage } from './SettingsPage';
import { IntegrationsPage } from './IntegrationsPage';
import { AIModelSelection } from './AIModelSelection';
import { CofounderSettings } from './CofounderSettings';
import CalendarPage from './CalendarPageNew';
import { NotificationsPage } from './NotificationsPage';
import { AutomationReportsPage } from './AutomationReportsPage';
import BusinessManagementPage from './BusinessManagementPage';
import SupportedBusinesses from './SupportedBusinesses';
import AboutUs from './AboutUs';
import HelpSupportPage from './HelpSupportPage';
import JobsPage from './JobsPage';
import CofounderFinancePage from './CofounderFinancePage';
import { MobileCustomizationSettings } from './MobileCustomizationSettings';

// Operations components
import { OperationsOverview } from './OperationsOverview';
import { OperationsDepartment } from './operations/OperationsDepartment';
import ProductOperations from './operations/ProductOperations';
import MarketingOperations from './operations/MarketingOperations';
import SalesOperations from './operations/SalesOperations';
import FinanceOperations from './operations/FinanceOperationsNew';
import HumanResourcesOperations from './operations/HumanResourcesOperations_fixed';
import { HandbookEditor } from './operations/HandbookEditor';
import HubSpotOAuthCallback from './operations/HubSpotOAuthCallback';
import HubSpotPage from './operations/HubSpotPage';
import SalesforcePage from './operations/SalesforcePage';
import SalesforceOAuthCallback from './operations/SalesforceOAuthCallback';
import GoogleOAuthCallback from './operations/GoogleOAuthCallback';
import SlackPage from './operations/SlackPage';
import SlackOAuthCallback from './operations/SlackOAuthCallback';
import { InviteAcceptanceWrapper } from './InviteAcceptanceWrapper';
import { AutoIAPSync } from './AutoIAPSync';
import DataDiagnostic from '../pages/DataDiagnostic';

interface AppContentProps {
  user: any;
  userData: any;
  authError?: string | null;
  supabaseAvailable?: boolean; // This is now specifically for auth availability
  customServerAvailable?: boolean; // This is for custom server features
  isSigningOut?: boolean; // Add signing out state
  authReady?: boolean; // Add auth readiness state
  accessToken?: string | null; // Add access token
}

export const AppContent: React.FC<AppContentProps> = ({ 
  user, 
  userData, 
  authError, 
  supabaseAvailable = true, // Auth service availability
  customServerAvailable = true, // Custom server availability
  isSigningOut = false,
  authReady = false,
  accessToken = null
}) => {
  // Onboarding tour state
  const { needsOnboarding, markOnboardingComplete } = useOnboarding(user?.id);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track route changes for persistence
  useRouteTracking(!!user && !isSigningOut);

  // DISABLED: Onboarding tour - uncomment to re-enable
  // useEffect(() => {
  //   // CRITICAL: Skip onboarding for admin users
  //   if (user && isAdminUser(user)) {
  //     console.log('AppContent: Admin user detected - skipping onboarding');
  //     setShowOnboarding(false);
  //     return;
  //   }

  //   if (user && needsOnboarding && !isSigningOut) {
  //     // Small delay to let the user settle in
  //     const timer = setTimeout(() => {
  //       setShowOnboarding(true);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [user, needsOnboarding, isSigningOut]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    markOnboardingComplete();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // Mark as complete even when skipped to prevent it from showing again
    markOnboardingComplete();
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) {
      // If user refreshes on a protected route while logged out, go to homepage instead of auth
      console.log('🔧 ProtectedRoute: No user, redirecting to homepage');
      return <Navigate to="/" replace />;
    }

    // Check if user signed up via phone and needs completion
    const isPhoneUser = user?.app_metadata?.provider === 'phone' || user?.phone;
    const hasEmail = user?.email && user.email !== '';
    const needsCompletion = isPhoneUser && !hasEmail;

    // If user needs to complete profile, show PhoneSignupCompletion component
    if (needsCompletion) {
      return <PhoneSignupCompletion user={user} />;
    }

    return <>{children}</>;
  };

  // Enhanced homepage route with mobile redirect and sign out handling
  const HomeRoute = () => {
    // Handle authenticated users - redirect to dashboard or admin
    if (user && !isSigningOut) {
      console.log('🔧 HomeRoute: User authenticated, checking redirect...');
      
      // Check if there's a saved route to restore
      const lastRoute = getLastRoute();
      if (lastRoute) {
        console.log('📍 HomeRoute: Restoring last visited route:', lastRoute);
        return <Navigate to={lastRoute} replace />;
      }
      
      // Simple admin check
      if (user.email === 'tylerg@cofounderplus.com' || user.email === 'admin@cofounderplus.com') {
        console.log('🔧 HomeRoute: Admin user detected, redirecting to /admin');
        return <Navigate to="/admin" replace />;
      }
      
      // Check if mobile device - redirect to finance for mobile, dashboard for desktop
      const isMobileDevice = window.innerWidth < 768;
      if (isMobileDevice) {
        console.log('🔧 HomeRoute: Mobile user, redirecting to /operations/finance');
        return <Navigate to="/operations/finance" replace />;
      }
      
      console.log('🔧 HomeRoute: Desktop user, redirecting to /dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    
    // For non-authenticated users: Mobile users go to welcome, desktop users see homepage
    // The MobileHomeRedirect component handles the detection and redirect
    return (
      <MobileHomeRedirect
        user={isSigningOut ? null : user}
        authError={authError}
        supabaseAvailable={supabaseAvailable}
        customServerAvailable={customServerAvailable}
        isSigningOut={isSigningOut}
      />
    );
  };

  // REMOVED: Console log on every render was causing performance issues
  // console.log('🔧 AppContent: Rendering routes with user:', user?.email || 'none', 'isSigningOut:', isSigningOut);

  return (
    <>
      {/* Auto IAP Sync - Automatically restores iOS subscriptions on app startup */}
      {user && !isSigningOut && (
        <AutoIAPSync 
          userId={user.id}
          userEmail={user.email}
          onSyncComplete={(success) => {
            if (success) {
              console.log('✅ Auto IAP Sync: Subscription synced successfully');
            }
          }}
        />
      )}

      {/* Onboarding Tour */}
      {showOnboarding && user && (
        <OnboardingTour 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          userId={user.id}
        />
      )}

      <Routes>
      {/* Home Route - enhanced with better sign out handling */}
      <Route path="/" element={<HomeRoute />} />

      {/* Public Routes */}
      <Route path="/questionnaire" element={<Questionnaire />} />
      <Route path="/path-choice" element={<PathChoice />} />
      <Route path="/business-info" element={<BusinessInfoForm />} />
      <Route path="/personality-test" element={<PersonalityTest />} />
      <Route path="/business-name" element={<BusinessNameGenerator />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/supported-businesses" element={<SupportedBusinesses user={user} />} />
      <Route path="/jobs" element={<JobsPage user={user} />} />
      <Route path="/about-us" element={<AboutUs user={user} />} />
      <Route path="/help" element={<HelpSupportPage />} />
      <Route path="/cofounder-finance" element={<CofounderFinancePage />} />
      
      {/* Founder Setup Call Landing Page */}
      <Route path="/founder-setup-call" element={<FounderSetupCallLanding />} />
      <Route path="/book-founder-call" element={<FounderCallBooking />} />
      <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />

      {/* Task Automation Setup Pages */}
      <Route path="/task-automations" element={
        <ProtectedRoute>
          <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
            <TaskAutomations />
          </ResponsiveLayout>
        </ProtectedRoute>
      } />
      <Route path="/task-automation-setup" element={<TaskAutomationSetup />} />
      <Route path="/book-task-automation" element={<TaskAutomationBooking />} />
      
      {/* Mobile Welcome Route - for mobile app experience */}
      <Route path="/mobile-welcome" element={<MobileWelcome user={user} />} />
      
      {/* Auth Routes */}
      <Route 
        path="/auth" 
        element={
          <EnhancedAuthPage 
            user={user} 
            authError={authError} 
            supabaseAvailable={supabaseAvailable}
          />
        } 
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/phone-signup-completion" element={<PhoneSignupCompletion user={user} />} />
      <Route path="/billing-redirect" element={<BillingRedirect />} />
      <Route path="/plaid-oauth-redirect" element={<PlaidOAuthRedirect />} />
      <Route path="/create-admin" element={<AdminAccountCreator />} />
      
      {/* Email Auth Example Route */}
      <Route path="/email-auth-example" element={<EmailAuthExample />} />
      
      {/* Team Invite Route */}
      <Route 
        path="/invite/:token" 
        element={
          <InviteAcceptanceWrapper />
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <ProtectedDashboard 
              user={user} 
              userData={userData} 
              customServerAvailable={customServerAvailable}
            />
          </ProtectedRoute>
        } 
      />

      {/* Admin Route */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard 
              user={user} 
              isSigningOut={isSigningOut} 
              authReady={authReady} 
              accessToken={accessToken} 
            />
          </ProtectedRoute>
        } 
      />

      {/* Credit Diagnostic Route */}
      <Route 
        path="/credit-diagnostic" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <CreditDiagnostic />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Main App Pages */}
      <Route 
        path="/roadmap" 
        element={
          <ProtectedRoute>
            {/* Hide roadmap for desktop, show only on mobile */}
            {(() => {
              const isMobileDevice = window.innerWidth < 768;
              if (!isMobileDevice) {
                return <Navigate to="/dashboard" replace />;
              }
              return (
                <ResponsiveLayout user={user}>
                  <RoadmapScreenGlass user={user} />
                </ResponsiveLayout>
              );
            })()}
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/roadmap-old" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <RoadmapScreenEnhanced user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/roadmap-glass" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <RoadmapScreenGlass user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/roadmap-data-model" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <RoadmapDataModel />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/mastery" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <MasteryScreen />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/roadmap-schema" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <RoadmapDataModelSchema />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/react-scaffolding-roadmap" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <ReactScaffoldingRoadmap />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/agi-logic-engine-blueprint" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user}>
              <AGILogicEngineBlueprint />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/dream-board" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <DreamBoardPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/notes" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <NotesPageContent user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/todos" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <TodoListPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/proof-locker" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <ProofLockerPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/subscription-dashboard" 
        element={<Navigate to="/pricing" replace />} 
      />

      <Route 
        path="/upgrade" 
        element={<Navigate to="/settings?tab=plan" replace />} 
      />

      <Route 
        path="/pricing" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <PricingPage />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/subscription-debug" 
        element={<Navigate to="/settings?tab=plan" replace />}
      />

      {/* Operations Routes */}
      <Route 
        path="/operations" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <OperationsOverview user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/department" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <OperationsDepartment user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/product" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <ProductOperations user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/marketing" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <MarketingOperations user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/sales" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <SalesOperations user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* HubSpot OAuth Callback Route */}
      <Route 
        path="/operations/sales/hubspot-callback" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <HubSpotOAuthCallback user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* HubSpot Page Route */}
      <Route 
        path="/operations/sales/hubspot" 
        element={
          <ProtectedRoute>
            <HubSpotPage />
          </ProtectedRoute>
        } 
      />

      {/* Salesforce OAuth Callback Route */}
      <Route 
        path="/operations/sales/salesforce-callback" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <SalesforceOAuthCallback user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Google OAuth Callback Route */}
      <Route 
        path="/operations/sales/google-callback" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <GoogleOAuthCallback />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Salesforce Page Route */}
      <Route 
        path="/operations/sales/salesforce" 
        element={
          <ProtectedRoute>
            <SalesforcePage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/finance" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <FinanceOperations user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/hr" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <HumanResourcesOperations user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/operations/hr/handbook/:handbookId" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <HandbookEditor />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Slack OAuth Callback Route */}
      <Route 
        path="/operations/hr/slack-callback" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <SlackOAuthCallback />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Slack Page Route */}
      <Route 
        path="/operations/hr/slack" 
        element={
          <ProtectedRoute>
            <SlackPage />
          </ProtectedRoute>
        } 
      />

      {/* University Route */}
      <Route 
        path="/university/*" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <UniversityPage user={user} accessToken={accessToken} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* CofounderAI Routes */}
      <Route 
        path="/cofounder-ai" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <CofounderAIPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/ai" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <CofounderAIPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/cofounder" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <CofounderAIPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Cofounder Make Route */}
      <Route 
        path="/cofounder-make" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <CofounderMake />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* GitHub Callback Route - MUST be outside ProtectedRoute if possible, or inside if we expect user to be logged in */}
      <Route 
        path="/cofounder-make/github-callback" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <GitHubCallback />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Support Route */}
      <Route 
        path="/support" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <SupportPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Settings Route - Team, Plan, Security, Beta tabs */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <SettingsPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Notifications Route */}
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <NotificationsPage />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Integrations Route */}
      <Route 
        path="/integrations" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <IntegrationsPage />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* AI Model Selection Route */}
      <Route 
        path="/ai-model-selection" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <AIModelSelection />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Cofounder Settings Route */}
      <Route 
        path="/cofounder-settings" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <CofounderSettings />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Automation Reports Route */}
      <Route 
        path="/automation-reports/:category" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <AutomationReportsPage />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Calendar Route */}
      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <CalendarPage />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Business Management Route */}
      <Route 
        path="/business-management" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <BusinessManagementPage user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Mobile Customization Settings Route */}
      <Route 
        path="/mobile-customization" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <MobileCustomizationSettings user={user} />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Database Diagnostic Route - Verify GPT-5.1 CRUD functions */}
      <Route 
        path="/database-diagnostic" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <DataDiagnostic />
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />

      {/* Route Status Debug */}
      <Route 
        path="/routes-status" 
        element={
          <ProtectedRoute>
            <ResponsiveLayout user={user} customServerAvailable={customServerAvailable}>
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Routes Status ✅</h1>
                <div className="space-y-2">
                  <p>✅ /university - University Page</p>
                  <p>✅ /cofounder-ai - CofounderAI Page</p>
                  <p>✅ /ai - CofounderAI Page (alias)</p>
                  <p>✅ /cofounder - CofounderAI Page (alias)</p>
                  <p>✅ /support - Support Page</p>
                  <p>✅ /settings - User Profile (alias)</p>
                  <p>✅ /dream-board - Dream Board (with database)</p>
                  <p>✅ /integrations - Integrations Page</p>
                  <p>✅ /business-management - Business Management Page</p>
                  <p>✅ All operations routes working</p>
                </div>
              </div>
            </ResponsiveLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage user={user} />} />
      </Routes>
    </>
  );
};