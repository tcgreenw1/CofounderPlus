import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from './ui/use-mobile';
import { Logo } from './Logo';

export const TaskAutomationSetup: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBookCall = () => {
    // Navigate to the booking flow
    navigate('/book-task-automation');
  };

  const handleLogin = () => {
    navigate('/auth?mode=login', { state: { mode: 'login' } });
  };

  const handleSignUp = () => {
    navigate('/auth?mode=signup', { state: { mode: 'signup' } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with same style as homepage */}
      <nav className="relative z-10 flex items-center justify-between p-4 sm:p-6 pt-12 sm:pt-6">
        <div className="flex items-center space-x-2">
          <Logo size="md" showText={true} />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Supported Businesses button - always visible */}
          <button
            onClick={() => navigate('/supported-businesses')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            Supported Businesses
          </button>
          
          {/* Jobs button - always visible */}
          <button
            onClick={() => navigate('/jobs')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            Jobs
          </button>
          
          {/* About Us button - always visible */}
          <button
            onClick={() => navigate('/about-us')}
            className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base text-primary"
          >
            About Us
          </button>
          
          {/* Auth buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogin}
              className="bouncy-button px-3 py-2 sm:px-4 sm:py-2 rounded-xl liquid-glass-nav text-sm sm:text-base"
              style={{ color: 'var(--color-foreground)' }}
            >
              Login
            </button>
            <button
              onClick={handleSignUp}
              className="bouncy-button px-3 py-2 sm:px-6 sm:py-2 rounded-xl text-sm sm:text-base font-semibold"
              style={{ 
                background: 'linear-gradient(135deg, rgba(0, 224, 255, 1) 0%, rgba(0, 200, 255, 1) 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 224, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.2s ease-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 224, 255, 1) 0%, rgba(0, 255, 255, 1) 100%)';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 6px 16px rgba(0, 224, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 224, 255, 1) 0%, rgba(0, 200, 255, 1) 100%)';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 224, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="px-[var(--spacing-4)] py-12 md:py-20 lg:py-24 max-w-3xl mx-auto w-full flex-grow flex flex-col justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.03) 0%, rgba(108, 92, 231, 0.03) 100%)',
          borderRadius: '0 0 var(--radius-2xl) var(--radius-2xl)',
        }}
      >
        <div className="text-center space-y-[var(--spacing-6)]">
          {/* Headline */}
          <h1 
            className="text-foreground"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: '1.15',
              letterSpacing: '-0.02em'
            }}
          >
            Remove the repetitive parts of your job — fast.
          </h1>
          
          {/* Subheadline */}
          <p 
            className="text-muted-foreground max-w-2xl mx-auto"
            style={{
              fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
              lineHeight: '1.5'
            }}
          >
            Book a 60-minute working session where we identify, design, and scope an automation that saves you hours every week.
          </p>
          
          {/* Primary CTA */}
          <div className="flex flex-col items-center gap-[var(--spacing-2)] pt-[var(--spacing-6)]">
            <button
              onClick={handleBookCall}
              className="text-white px-[var(--spacing-8)] py-[var(--spacing-4)] rounded-[var(--radius-lg)] transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                fontSize: '1.125rem',
                minWidth: '280px',
                background: 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)',
                boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
              }}
            >
              Book Task Automation Setup — $99
            </button>
            <p className="text-sm text-muted-foreground">
              Live working session · One-time · No contracts
            </p>
          </div>
        </div>
      </section>

      {/* Context / Credibility Line */}
      <section 
        className="px-[var(--spacing-4)] py-12 md:py-16 max-w-2xl mx-auto w-full"
        style={{
          marginTop: 'var(--spacing-8)',
        }}
      >
        <div 
          className="space-y-[var(--spacing-4)]"
          style={{
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <p className="text-lg text-foreground leading-relaxed">
            Built by a solo founder who ships real automation systems for operations, data, and workflows.
          </p>
        </div>
      </section>

      {/* What This Is */}
      <section className="px-[var(--spacing-4)] py-8 md:py-12 max-w-2xl mx-auto w-full">
        <div className="text-center space-y-[var(--spacing-4)]">
          <h2 
            className="text-foreground" 
            style={{ 
              fontSize: '1.5rem',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            This is a working session, not a sales call.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            You bring a task that’s repetitive, manual, or error-prone.<br/>
            We break it down, design the automation, and define exactly what gets built.
          </p>
        </div>
      </section>

      {/* What You'll Walk Away With */}
      <section className="px-[var(--spacing-4)] py-12 md:py-16 max-w-2xl mx-auto w-full">
        <h2 
          className="text-foreground mb-[var(--spacing-6)]" 
          style={{ 
            fontSize: '1.75rem',
            textAlign: 'center',
          }}
        >
          What You'll Walk Away With
        </h2>
        <div 
          className="space-y-[var(--spacing-4)]"
          style={{
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.03) 0%, rgba(39, 209, 124, 0.01) 100%)',
            border: '1px solid rgba(39, 209, 124, 0.1)',
          }}
        >
          <ul className="space-y-[var(--spacing-4)]">
            <li className="flex items-start gap-[var(--spacing-3)]">
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-success" style={{ fontSize: '1rem' }}>✓</span>
              </div>
              <span className="text-foreground text-lg">A clearly defined automation plan</span>
            </li>
            <li className="flex items-start gap-[var(--spacing-3)]">
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-success" style={{ fontSize: '1rem' }}>✓</span>
              </div>
              <span className="text-foreground text-lg">Tools and systems mapped (spreadsheets, email, CRM, APIs, etc.)</span>
            </li>
            <li className="flex items-start gap-[var(--spacing-3)]">
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-success" style={{ fontSize: '1rem' }}>✓</span>
              </div>
              <span className="text-foreground text-lg">A delivery estimate and fixed price</span>
            </li>
            <li className="flex items-start gap-[var(--spacing-3)]">
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-soft)',
                }}
              >
                <span className="text-success" style={{ fontSize: '1rem' }}>✓</span>
              </div>
              <span className="text-foreground text-lg">A system you can reuse or expand later</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Common Tasks I Automate (New Section) */}
      <section className="px-[var(--spacing-4)] py-12 md:py-16 max-w-2xl mx-auto w-full">
        <h2 
          className="text-foreground mb-[var(--spacing-6)]" 
          style={{ 
            fontSize: '1.75rem',
            textAlign: 'center',
          }}
        >
          Common Tasks I Automate
        </h2>
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-4)]"
        >
          {[
            "Reports and recurring spreadsheets",
            "Data cleanup, categorization, and syncing",
            "Email follow-ups and notifications",
            "CRM updates and lead routing",
            "File organization and document generation"
          ].map((task, index) => (
            <div 
              key={index}
              className="flex items-center gap-[var(--spacing-3)] p-[var(--spacing-4)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]"
            >
               <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(43, 127, 255, 0.1)',
                  color: '#2b7fff',
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>⚙️</span>
              </div>
              <span className="text-foreground">{task}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground mt-[var(--spacing-6)] italic">
          Small, concrete examples. No jargon.
        </p>
      </section>

      {/* Who This Is For */}
      <section className="px-[var(--spacing-4)] py-12 md:py-16 max-w-2xl mx-auto w-full bg-[var(--accent)] rounded-[var(--radius-2xl)]">
        <h2 
          className="text-foreground mb-[var(--spacing-6)]" 
          style={{ 
            fontSize: '1.75rem',
            textAlign: 'center',
          }}
        >
          Who This Is For
        </h2>
        <div className="flex flex-wrap justify-center gap-[var(--spacing-3)] mb-[var(--spacing-8)]">
           {[
            "Finance and accounting roles",
            "Operations and admin work",
            "Sales ops and CRM-heavy roles",
            "HR, recruiting, and coordination tasks",
            "Data and reporting workflows"
          ].map((role, index) => (
            <span 
              key={index}
              className="px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-full)] bg-[var(--card)] text-foreground border border-[var(--border)] text-sm font-medium"
            >
              {role}
            </span>
          ))}
        </div>
        <p className="text-center text-muted-foreground max-w-lg mx-auto">
          <strong>Not for:</strong> replacing jobs, long-term consulting, or enterprise transformations.
        </p>
      </section>

      {/* How It Works */}
      <section className="px-[var(--spacing-4)] py-12 md:py-16 max-w-2xl mx-auto w-full">
        <h2 
          className="text-foreground mb-[var(--spacing-6)]" 
          style={{ 
            fontSize: '1.75rem',
            textAlign: 'center',
          }}
        >
          How It Works
        </h2>
        <div className="space-y-[var(--spacing-4)]">
          <div 
            className="flex items-start gap-[var(--spacing-4)]"
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.2) 0%, rgba(43, 127, 255, 0.1) 100%)',
                border: '2px solid rgba(43, 127, 255, 0.3)',
                color: '#2b7fff',
                fontSize: '1.25rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              1
            </div>
            <span className="text-foreground text-lg pt-2">Book and pay for the session</span>
          </div>
          <div 
            className="flex items-start gap-[var(--spacing-4)]"
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, rgba(108, 92, 231, 0.1) 100%)',
                border: '2px solid rgba(108, 92, 231, 0.3)',
                color: '#6c5ce7',
                fontSize: '1.25rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              2
            </div>
            <span className="text-foreground text-lg pt-2">Bring one real task to the call</span>
          </div>
          <div 
            className="flex items-start gap-[var(--spacing-4)]"
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.2) 0%, rgba(39, 209, 124, 0.1) 100%)',
                border: '2px solid rgba(39, 209, 124, 0.3)',
                color: 'var(--success)',
                fontSize: '1.25rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              3
            </div>
            <div className="pt-2">
              <span className="text-foreground text-lg block">We design the automation live</span>
              <span className="text-muted-foreground text-sm mt-1 block">Most automations are delivered in days, not months.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Reinforcement */}
      <section className="px-[var(--spacing-4)] py-12 md:py-16 max-w-xl mx-auto w-full">
        <div 
          className="border space-y-[var(--spacing-4)]"
          style={{
            padding: 'var(--spacing-6) var(--spacing-8)',
            borderRadius: 'var(--radius-2xl)',
            background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.05) 0%, rgba(108, 92, 231, 0.05) 100%)',
            borderColor: 'rgba(43, 127, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(43, 127, 255, 0.1)',
          }}
        >
          <p className="text-foreground text-lg text-center">60-minute Task Automation Setup</p>
          <p 
            className="text-center"
            style={{
              fontSize: '2rem',
              fontWeight: 'var(--font-weight-bold)',
              background: 'linear-gradient(135deg, #2b7fff 0%, #6c5ce7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            $99 one-time
          </p>
          <p className="text-foreground text-lg text-center">No subscriptions · No upsells</p>
          <p className="text-muted-foreground text-sm text-center pt-2">
            If the task isn’t a good fit for automation, I’ll tell you honestly.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        className="px-[var(--spacing-4)] py-12 md:py-16 max-w-2xl mx-auto w-full text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.03) 0%, rgba(108, 92, 231, 0.03) 100%)',
          borderRadius: 'var(--radius-2xl)',
          marginBottom: 'var(--spacing-8)',
        }}
      >
        <div className="space-y-[var(--spacing-6)]" style={{ padding: 'var(--spacing-6)' }}>
          <button
            onClick={handleBookCall}
            className="text-white px-[var(--spacing-8)] py-[var(--spacing-4)] rounded-[var(--radius-lg)] transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
            style={{
              fontSize: '1.125rem',
              minWidth: '280px',
              background: 'linear-gradient(135deg, #2b7fff 0%, #1e5dd9 100%)',
              boxShadow: '0 4px 20px rgba(43, 127, 255, 0.3)',
            }}
          >
            Book Task Automation Setup — $99
          </button>
          <p className="text-sm text-muted-foreground">
            Limited weekly availability
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-[var(--spacing-4)] py-[var(--spacing-8)] text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Independent product · No guarantees · Cancel anytime
        </p>
      </footer>
    </div>
  );
};
