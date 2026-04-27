import React from 'react';
// Import the new Cofounder logo
import cofounderLogo from 'figma:asset/eb44dab7ca5a980758367dc8cc76a45d22bb3aca.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true, 
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    // Height based sizing to maintain aspect ratio
    sm: { container: 'h-8', text: 'text-lg' },
    md: { container: 'h-10', text: 'text-xl' },
    lg: { container: 'h-16', text: 'text-3xl' },
    xl: { container: 'h-24', text: 'text-5xl' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <img
        src={cofounderLogo}
        alt="Cofounder+ Logo"
        className={`
          ${currentSize.container} 
          w-auto
          object-contain
          transition-transform duration-300 hover:scale-105
        `}
      />

      {/* Text Label */}
      {showText && (
        <span 
          className={`
            ${currentSize.text}
            ${variant === 'white' 
              ? 'text-white' 
              : 'text-foreground'
            }
          `}
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          Cofounder+
        </span>
      )}
    </div>
  );
};