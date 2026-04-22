import React, { createContext, useContext, useState } from 'react';

interface TutorContextType {
  isTutorMode: boolean;
  isFeedbackMode: boolean;
  toggleTutorMode: () => void;
  toggleFeedbackMode: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);

  const toggleTutorMode = () => {
    setIsTutorMode(prev => !prev);
    setIsFeedbackMode(false);
  };

  const toggleFeedbackMode = () => {
    setIsFeedbackMode(prev => !prev);
    setIsTutorMode(false);
  };

  return (
    <TutorContext.Provider value={{ isTutorMode, isFeedbackMode, toggleTutorMode, toggleFeedbackMode }}>
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
