import React, { useEffect } from 'react';

interface ErrorLoggerProps {
  children: React.ReactNode;
}

export const ErrorLogger: React.FC<ErrorLoggerProps> = ({ children }) => {
  useEffect(() => {
    // Global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 GLOBAL ERROR:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 UNHANDLED PROMISE REJECTION:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
};