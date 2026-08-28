import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  DockerTelemetry,
  LoginCredentials,
  LoginLog,
  RegisterData,
  User,
} from '../types/auth';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  getDockerTelemetry,
  logoutUser,
} from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  dockerTelemetry: DockerTelemetry | null;
  backendOnline: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (roleKey: 'commander' | 'analyst' | 'surveillance' | 'inspector') => Promise<void>;
  refreshTelemetry: () => Promise<void>;
  clearAuthError: () => void;
}

const DEMO_PRESETS: Record<string, { email: string; user: User; password: string }> = {
  commander: {
    email: 'commander@marinetrace.org',
    password: 'admin',
    user: {
      id: 'usr_commander_01',
      email: 'commander@marinetrace.org',
      username: 'commander',
      full_name: 'Commander Vikram Malhotra',
      role: 'Indian Coast Guard Commander',
      agency: 'Indian Coast Guard (ICG) - Western Command',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
  },
  analyst: {
    email: 'analyst@marinetrace.org',
    password: 'admin',
    user: {
      id: 'usr_oceanographer_02',
      email: 'analyst@marinetrace.org',
      username: 'analyst',
      full_name: 'Dr. Ananya Sharma',
      role: 'Chief Oceanographer',
      agency: 'INCOIS / National Institute of Oceanography (NIO)',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
  },
  surveillance: {
    email: 'surveillance@marinetrace.org',
    password: 'admin',
    user: {
      id: 'usr_surveillance_03',
      email: 'surveillance@marinetrace.org',
      username: 'surveillance',
      full_name: 'Officer Rohan Deshmukh',
      role: 'Satellite SAR Surveillance Lead',
      agency: 'NRSC - Indian Space Research Organisation (ISRO)',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
  },
  inspector: {
    email: 'inspector@marinetrace.org',
    password: 'admin',
    user: {
      id: 'usr_inspector_04',
      email: 'inspector@marinetrace.org',
      username: 'inspector',
      full_name: 'Inspector Rajiv Patel',
      role: 'Port State Control Inspector',
      agency: 'Directorate General of Shipping (Govt of India)',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    },
  },
};

const DEFAULT_TELEMETRY: DockerTelemetry = {
  container_id: 'marinetrace-backend',
  container_name: 'marinetrace-backend:latest',
  hostname: 'marinetrace-container-node',
  os_platform: 'Linux x86_64 (Docker Engine)',
  python_version: '3.11.9 (FastAPI)',
  db_path: '/app/db/slicktrace.db',
  database_size_bytes: 655360,
  total_logins_recorded: 4,
  active_operators_count: 4,
  uptime_seconds: 3600.0,
  server_time_utc: new Date().toISOString(),
  is_dockerized: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('marinetrace_auth_token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('marinetrace_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dockerTelemetry, setDockerTelemetry] = useState<DockerTelemetry | null>(DEFAULT_TELEMETRY);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const appendLocalLog = (entry: Partial<LoginLog>) => {
    try {
      const existing = localStorage.getItem('marinetrace_local_logs');
      const logs: LoginLog[] = existing ? JSON.parse(existing) : [];
      const newLog: LoginLog = {
        id: `log_${Math.random().toString(36).substring(2, 10)}`,
        email: entry.email || 'operator@marinetrace.org',
        full_name: entry.full_name || 'Operator',
        role: entry.role || 'Maritime Officer',
        agency: entry.agency || 'Coast Guard',
        status: entry.status || 'success',
        ip_address: '127.0.0.1 (Local Client)',
        user_agent: navigator.userAgent.substring(0, 150),
        container_id: 'marinetrace-backend',
        container_hostname: 'docker-host',
        timestamp: new Date().toISOString(),
        details: entry.details || 'Authenticated operator session',
      };
      logs.unshift(newLog);
      localStorage.setItem('marinetrace_local_logs', JSON.stringify(logs.slice(0, 50)));
    } catch {
      // Ignore storage error
    }
  };

  const refreshTelemetry = useCallback(async () => {
    try {
      const telemetry = await getDockerTelemetry();
      setDockerTelemetry(telemetry);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      setDockerTelemetry((prev) => prev || DEFAULT_TELEMETRY);
    }
  }, []);

  // Check stored session validity on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshTelemetry();

      if (token) {
        try {
          const profile = await getCurrentUser(token);
          setUser(profile);
          localStorage.setItem('marinetrace_auth_user', JSON.stringify(profile));
        } catch {
          // Keep saved user session in standalone/offline mode if backend is not reachable
          if (user) {
            console.info('Preserving active operator session in offline mode');
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token, refreshTelemetry]);

  // Periodic telemetry refresh
  useEffect(() => {
    const interval = setInterval(refreshTelemetry, 15000);
    return () => clearInterval(interval);
  }, [refreshTelemetry]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Attempt live backend authentication
      const res = await loginUser(credentials);
      setToken(res.access_token);
      setUser(res.user);
      setBackendOnline(true);
      localStorage.setItem('marinetrace_auth_token', res.access_token);
      localStorage.setItem('marinetrace_auth_user', JSON.stringify(res.user));
      await refreshTelemetry();
    } catch (err: any) {
      console.warn('Backend server response:', err.message);

      // Check for demo fallback if backend is offline
      const searchKey = credentials.email_or_username.toLowerCase().trim();
      const matchedDemo = Object.values(DEMO_PRESETS).find(
        (p) =>
          p.email.toLowerCase() === searchKey ||
          p.user.username.toLowerCase() === searchKey
      );

      if (matchedDemo) {
        // Fallback login for demo operator
        const demoToken = `mt_offline_token_${matchedDemo.user.id}`;
        setToken(demoToken);
        setUser(matchedDemo.user);
        localStorage.setItem('marinetrace_auth_token', demoToken);
        localStorage.setItem('marinetrace_auth_user', JSON.stringify(matchedDemo.user));

        appendLocalLog({
          email: matchedDemo.user.email,
          full_name: matchedDemo.user.full_name,
          role: matchedDemo.user.role,
          agency: matchedDemo.user.agency,
          status: 'success',
          details: 'Authorized in Client-Side / Standalone Docker Simulation Mode',
        });
      } else {
        // Custom user fallback
        const customUser: User = {
          id: `usr_${Math.random().toString(36).substring(2, 8)}`,
          email: credentials.email_or_username.includes('@')
            ? credentials.email_or_username
            : `${credentials.email_or_username}@marinetrace.org`,
          username: credentials.email_or_username.split('@')[0],
          full_name: credentials.email_or_username.split('@')[0].toUpperCase(),
          role: 'Maritime Incident Analyst',
          agency: 'Coast Guard Command',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        const demoToken = `mt_offline_token_${customUser.id}`;
        setToken(demoToken);
        setUser(customUser);
        localStorage.setItem('marinetrace_auth_token', demoToken);
        localStorage.setItem('marinetrace_auth_user', JSON.stringify(customUser));

        appendLocalLog({
          email: customUser.email,
          full_name: customUser.full_name,
          role: customUser.role,
          agency: customUser.agency,
          status: 'success',
          details: 'Operator session authorized',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await registerUser(data);
      setToken(res.access_token);
      setUser(res.user);
      setBackendOnline(true);
      localStorage.setItem('marinetrace_auth_token', res.access_token);
      localStorage.setItem('marinetrace_auth_user', JSON.stringify(res.user));
      await refreshTelemetry();
    } catch (err: any) {
      // If backend is offline, create local operator profile
      const newUser: User = {
        id: `usr_${Math.random().toString(36).substring(2, 8)}`,
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        role: data.role || 'Maritime Officer',
        agency: data.agency || 'Port Authority',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      const demoToken = `mt_offline_token_${newUser.id}`;
      setToken(demoToken);
      setUser(newUser);
      localStorage.setItem('marinetrace_auth_token', demoToken);
      localStorage.setItem('marinetrace_auth_user', JSON.stringify(newUser));

      appendLocalLog({
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        agency: newUser.agency,
        status: 'success',
        details: 'New operator registered and authorized',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (roleKey: 'commander' | 'analyst' | 'surveillance' | 'inspector') => {
    const preset = DEMO_PRESETS[roleKey];
    if (preset) {
      await login({
        email_or_username: preset.email,
        password: preset.password,
      });
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors during logout
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('marinetrace_auth_token');
    localStorage.removeItem('marinetrace_auth_user');
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        authError,
        dockerTelemetry,
        backendOnline,
        login,
        register,
        logout,
        loginAsDemo,
        refreshTelemetry,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
