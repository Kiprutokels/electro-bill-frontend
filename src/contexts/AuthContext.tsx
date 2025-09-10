import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/api/services/auth.service';
import { User, LoginRequest } from '@/api/types/auth.types';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      // Store auth data
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isAuthenticated,
      hasPermission,
      hasAnyPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
