import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from '../db/api';
import { Profile } from '../types/types';

// Mock User interface to minimize changes in other files
interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

const LOCAL_USER: User = {
  id: 'local-user',
  email: 'local@app.com'
};

const LOCAL_PROFILE: Profile = {
  id: 'local-user',
  username: '本地用户',
  role: 'user',
  created_at: new Date().toISOString()
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Initialize DB (Seeding)
      try {
        await initializeApp();
      } catch (e) {
        console.error("Failed to init DB", e);
      }
      
      // Auto login as local user
      setUser(LOCAL_USER);
      setProfile(LOCAL_PROFILE);
      setLoading(false);
    };

    init();
  }, []);

  const signOut = async () => {
    // Reload page to reset state if needed
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
