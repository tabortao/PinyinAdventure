import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { RouteGuard } from './components/common/RouteGuard';
import { Layout } from './components/common/Layout';
// import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { MistakesPage } from './pages/MistakesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudyPage } from './pages/StudyPage';
import { HelpPage } from './pages/HelpPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* <Route path="/login" element={<LoginPage />} /> */}
            
            <Route element={<RouteGuard />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/study" element={<StudyPage />} />
                <Route path="/mistakes" element={<MistakesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>
              {/* Game page without layout (full screen immersion) */}
              <Route path="/game/:levelId" element={<GamePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
