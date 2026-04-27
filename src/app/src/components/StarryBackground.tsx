import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

interface StarryBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function StarryBackground({ className = '', children }: StarryBackgroundProps) {
  const { theme } = useTheme();
  const [shootingStars, setShootingStars] = useState<Array<{
    id: number;
    delay: number;
    duration: number;
    top: string;
    left: string;
  }>>([]);

  useEffect(() => {
    // Generate fewer shooting stars for better performance
    const generateStars = () => {
      const stars = [];
      const numStars = 3; // Reduced to just 3 shooting stars

      for (let i = 0; i < numStars; i++) {
        stars.push({
          id: i,
          delay: Math.random() * 120 + 20, // Random delay between 20-140 seconds
          duration: Math.random() * 2 + 4, // Random duration between 4-6 seconds
          top: Math.random() * 80 + 10 + '%', // Random top position between 10-90%
          left: Math.random() * 100 + '%', // Random left position
        });
      }

      setShootingStars(stars);
    };

    generateStars();

    // Regenerate stars less frequently
    const starInterval = setInterval(generateStars, 300000); // Every 5 minutes

    return () => {
      clearInterval(starInterval);
    };
  }, []);

  return (
    <div className={`homepage-starry-background ${className}`}>
      {/* Simple shooting stars - only in dark mode */}
      {theme === 'dark' && shootingStars.map((star) => (
        <div
          key={star.id}
          className="shooting-star"
          style={{
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            top: star.top,
            left: star.left,
          }}
        />
      ))}
      
      {children}
    </div>
  );
}

export default StarryBackground;