'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  User 
} from 'firebase/auth';

import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Handle the redirect result when the user returns
    console.log("Checking for redirect result...");
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("Redirect success! User:", result.user.email);
      } else {
        console.log("No redirect result found (normal page load).");
      }
    }).catch((error) => {
      console.error("Critical Redirect Error:", error.code, error.message);
      setLoading(false);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("🔥 AUTH SUCCESS: User is logged in as", user.email);
      } else {
        console.warn("⚠️ AUTH SESSION MISSING: User is null");
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!auth) {
      alert("Firebase is not initialized. Check your environment variables.");
      return;
    }
    setLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured: isFirebaseConfigured, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
