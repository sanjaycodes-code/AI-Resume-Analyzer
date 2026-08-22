import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginData, RegisterData } from '../types/auth.types';
import authApi from '../services/api/authApi';
import { setAuthToken, setOnAuthFailure } from '../services/api/axiosClient';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app load via refresh cookie
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const refreshResponse = await authApi.refresh();
        const token = refreshResponse.data.accessToken;
        
        // Update in-memory token for subsequent requests
        setAuthToken(token);
        if (isMounted) {
          setAccessToken(token);
        }

        // Fetch user profile
        const meResponse = await authApi.me();
        if (isMounted) {
          setUser(meResponse.data.user);
        }
      } catch {
        // No valid session cookie found or expired
        setAuthToken(null);
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Register callback for when background 401 refresh fails
    setOnAuthFailure(() => {
      if (isMounted) {
        setUser(null);
        setAccessToken(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (data: LoginData): Promise<void> => {
    const response = await authApi.login(data);
    const token = response.data.accessToken;
    setAuthToken(token);
    setAccessToken(token);
    setUser(response.data.user);
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    const response = await authApi.register(data);
    const token = response.data.accessToken;
    setAuthToken(token);
    setAccessToken(token);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthToken(null);
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
