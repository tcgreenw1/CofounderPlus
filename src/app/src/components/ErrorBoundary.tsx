import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if we're in the middle of signing out - if so, don't show error
    try {
      const isSigningOut = localStorage.getItem('cofounder_signing_out') === 'true';
      if (isSigningOut) {
        console.log('🔧 ErrorBoundary: Ignoring error during sign out');
        return { hasError: false };
      }
    } catch (e) {
      // Continue with error handling if localStorage check fails
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if we're signing out - don't log errors during sign out
    try {
      const isSigningOut = localStorage.getItem('cofounder_signing_out') === 'true';
      if (isSigningOut) {
        console.log('🔧 ErrorBoundary: Suppressing error during sign out:', error.message);
        return;
      }
    } catch (e) {
      // Continue with error logging if check fails
    }
    
    console.error('❌ ErrorBoundary caught an error:');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-semibold mb-4 text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              The app encountered an error. Try refreshing the page or check your internet connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}