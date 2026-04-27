import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
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
    
    return {
      hasError: true,
      error
    };
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
    
    console.error('🚨 ERROR BOUNDARY CAUGHT ERROR:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-red-200 dark:border-red-800">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Something went wrong
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    An error occurred while loading the application
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details:
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                  {this.state.error?.name}: {this.state.error?.message}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Home
                </button>
                <button
                  onClick={() => {
                    console.log('🔍 FULL ERROR DETAILS:', {
                      error: this.state.error,
                      errorInfo: this.state.errorInfo,
                      state: this.state
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Log Details
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-48">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}