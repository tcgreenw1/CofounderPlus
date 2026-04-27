/**
 * Simplified Cofounder Make Component - For Testing
 */

import React from 'react';
import { Code2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export default function CofounderMakeSimple() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)'
      }}
    >
      <div 
        className="max-w-2xl w-full rounded-lg p-8 text-center"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)'
        }}
      >
        <Code2 
          className="mx-auto mb-6" 
          size={64}
          style={{ color: 'var(--primary)' }}
        />
        
        <h1 
          className="mb-4"
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: '2rem'
          }}
        >
          Cofounder Make
        </h1>
        
        <p 
          className="mb-8"
          style={{
            color: 'var(--muted-foreground)',
            fontSize: '1rem',
            lineHeight: '1.5'
          }}
        >
          Development workspace for building apps with tool assistance.
          This feature is currently being loaded...
        </p>

        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
