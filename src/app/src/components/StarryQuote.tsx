import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const inspirationalQuotes = [
  "Reach for the stars, and you'll land among them. 🌟",
  "Your dreams are the blueprint of your future success. ✨", 
  "Every star was once a dream that refused to dim. ⭐",
  "Build your empire one stellar decision at a time. 🌟",
  "In the darkness of business challenges, be your own guiding star. ✨",
  "Great businesses are born from starry-eyed visionaries. ⭐",
  "Let your ambitions shine brighter than the night sky. 🌟",
  "Success is written in the stars for those who dare to dream. ✨"
];

interface StarryQuoteProps {
  className?: string;
  showStar?: boolean;
}

export const StarryQuote: React.FC<StarryQuoteProps> = ({ 
  className = '',
  showStar = true 
}) => {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % inspirationalQuotes.length);
    }, 10000); // Change quote every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`text-center inspire-glow ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        {showStar && (
          <Star className="w-5 h-5 text-blue-300 dark:text-blue-200 animate-pulse" />
        )}
        <p className="text-sm font-medium text-blue-700 dark:text-blue-200 opacity-80">
          {inspirationalQuotes[currentQuote]}
        </p>
        {showStar && (
          <Star className="w-5 h-5 text-blue-300 dark:text-blue-200 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default StarryQuote;