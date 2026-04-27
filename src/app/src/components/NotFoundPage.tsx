import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';

interface NotFoundPageProps {
  user?: any;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ user }) => {
  const navigate = useNavigate();

  // If user is not logged in, redirect to homepage instead of showing 404
  React.useEffect(() => {
    if (!user) {
      console.log('🔧 NotFoundPage: No user found, redirecting to homepage');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        {/* 404 Number */}
        <div className="text-9xl font-bold text-gray-800 dark:text-gray-200">
          404
        </div>
        
        {/* Page Not Found Text */}
        <div className="text-2xl text-gray-700 dark:text-gray-300">
          Page not found
        </div>
        
        {/* Back Button */}
        <div className="space-y-3 pt-4">
          <div className="text-gray-600 dark:text-gray-400">
            Please go back
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full h-12 flex items-center justify-center gap-2 border-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>
        
        {/* Or Go Home */}
        <div className="space-y-3">
          <div className="text-gray-600 dark:text-gray-400">
            or go home
          </div>
          <Button 
            onClick={() => navigate('/roadmap')}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Home className="w-5 h-5" />
            Roadmap
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;