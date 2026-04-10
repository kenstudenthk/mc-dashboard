import React, { createContext, useContext, useState } from 'react';

interface TutorContextType {
  isTutorMode: boolean;
  toggleTutorMode: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTutorMode, setIsTutorMode] = useState(false);
  
  return (
    <TutorContext.Provider value={{ isTutorMode, toggleTutorMode: () => setIsTutorMode(!isTutorMode) }}>
      {children}
    </TutorContext.Provider>
  );
};

export const useTutor = () => {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error('useTutor must be used within a TutorProvider');
  }
  return context;
};
