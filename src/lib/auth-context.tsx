'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  darkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkModeState] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Apply dark mode class to html element
  const applyDarkMode = useCallback((value: boolean) => {
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
    applyDarkMode(value);
    localStorage.setItem('db_academy_dark_mode', value ? '1' : '0');
    // Also save to server if logged in
    const savedToken = localStorage.getItem('db_academy_token');
    if (savedToken) {
      fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ dark_mode: value }),
      }).catch(() => {});
    }
  }, [applyDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  useEffect(() => {
    const savedToken = localStorage.getItem('db_academy_token');
    const savedUser = localStorage.getItem('db_academy_user');

    // Check system preference or saved preference
    const savedDark = localStorage.getItem('db_academy_dark_mode');
    if (savedDark === '1') {
      setDarkModeState(true);
      applyDarkMode(true);
    } else if (savedDark === '0') {
      setDarkModeState(false);
      applyDarkMode(false);
    } else {
      // Follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkModeState(prefersDark);
      applyDarkMode(prefersDark);
    }

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [applyDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const savedDark = localStorage.getItem('db_academy_dark_mode');
      if (savedDark === null) {
        // Only follow system if user hasn't set a preference
        setDarkModeState(e.matches);
        applyDarkMode(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [applyDarkMode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (loading) return;
    const publicPaths = ['/login'];
    if (!token && !publicPaths.includes(pathname) && pathname !== '/') {
      router.push('/login');
    }
  }, [token, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('db_academy_token', data.token);
    localStorage.setItem('db_academy_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    // Fetch dark mode preference from server
    try {
      const settingsRes = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const settingsData = await settingsRes.json();
      if (settingsData.settings?.dark_mode !== undefined) {
        const prefersDark = !!settingsData.settings.dark_mode;
        // Local preference overrides server
        const localDark = localStorage.getItem('db_academy_dark_mode');
        if (localDark === null) {
          setDarkModeState(prefersDark);
          applyDarkMode(prefersDark);
        }
      }
    } catch {}
  }, [applyDarkMode]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('db_academy_token', data.token);
    localStorage.setItem('db_academy_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('db_academy_token');
    localStorage.removeItem('db_academy_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, darkMode, setDarkMode, toggleDarkMode, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Helper for authenticated fetch
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('db_academy_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  return res;
}
