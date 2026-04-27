import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Rocket, RotateCcw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function RestartOnboardingButton() {
  const handleRestartTour = () => {
    // Clear onboarding completion flag
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_completed_date');
    
    toast.success('Onboarding tour reset! Refresh the page to start the tour.');
    
    // Refresh after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" style={{ color: '#00E0FF' }} />
          Product Tour
        </CardTitle>
        <CardDescription>
          Take a guided tour of all Cofounder features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleRestartTour}
          className="w-full bouncy-button"
          style={{
            backgroundColor: '#00E0FF',
            color: '#FFFFFF'
          }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart Onboarding Tour
        </Button>
      </CardContent>
    </Card>
  );
}
