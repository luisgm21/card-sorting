import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, type LoginData, type RegisterData } from '../api/auth';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'researcher' | 'participant';
  organization?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isResearcher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = useCallback(async (data: LoginData) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);
      if (response.success) {
        const { user: userData, token: jwtToken } = response.data;
        setUser(userData);
        setToken(jwtToken);
      } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.success) {
        const { user: userData, token: jwtToken } = response.data;
        setUser(userData);
        setToken(jwtToken);
      } else {
        throw new Error(response.message || 'Error al registrarse');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isResearcher: user?.role === 'researcher' || user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
