import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { RouteGuard } from './components/common/RouteGuard';
import { Layout } from './components/common/Layout';
// import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AdventurePage } from './pages/AdventurePage';
import { GamePage } from './pages/GamePage';
import { MistakesPage } from './pages/MistakesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudyPage } from './pages/StudyPage';
import { HelpPage } from './pages/HelpPage';
import { QuizGamePage } from './pages/QuizGamePage';
import { QuizLevelsPage } from './pages/QuizLevelsPage';
import { FishingStagesPage } from './pages/FishingStagesPage';
import { FishingLevelSelectPage } from './pages/FishingLevelSelectPage';
import { FishingGamePage } from './pages/FishingGamePage';
import { initializeApp } from './db/api';

const App: React.FC = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* <Route path="/login" element={<LoginPage />} /> */}
            
            <Route element={<RouteGuard />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/adventure" element={<AdventurePage />} />
                <Route path="/study" element={<StudyPage />} />
                <Route path="/mistakes" element={<MistakesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>
              {/* Game pages without layout (full screen immersion) */}
              <Route path="/game/:levelId" element={<GamePage />} />
              <Route path="/quiz-game/:levelId" element={<QuizGamePage />} />
              <Route path="/quiz-levels" element={<QuizLevelsPage />} />
              
              {/* Fishing Game Routes */}
              <Route path="/fishing" element={<FishingStagesPage />} />
              <Route path="/fishing/levels/:stageId" element={<FishingLevelSelectPage />} />
              <Route path="/fishing/game/:levelId" element={<FishingGamePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
