import React, { createContext, useContext, useState } from 'react';

interface MotivationContextType {
  isOpen: boolean;
  openMotivation: () => void;
  closeMotivation: () => void;
}

const MotivationContext = createContext<MotivationContextType | undefined>(undefined);

export const useMotivation = () => {
  const context = useContext(MotivationContext);
  if (!context) {
    throw new Error('useMotivation must be used within a MotivationProvider');
  }
  return context;
};

interface MotivationProviderProps {
  children: React.ReactNode;
}

export const MotivationProvider: React.FC<MotivationProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openMotivation = () => setIsOpen(true);
  const closeMotivation = () => setIsOpen(false);

  return (
    <MotivationContext.Provider value={{ isOpen, openMotivation, closeMotivation }}>
      {children}
    </MotivationContext.Provider>
  );
};