import React, { createContext, useContext, useState } from 'react';
import { QuestionType } from '../types/types';

type GameMode = 'all' | QuestionType;

interface SettingsContextType {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  mode: 'all',
  setMode: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<GameMode>('all');

  return (
    <SettingsContext.Provider value={{ mode, setMode }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
