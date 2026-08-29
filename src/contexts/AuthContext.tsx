import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/auth';
import { getToken, setToken, ApiError } from '../api/client';
import { hasPermission, homePath } from '../constants/permissions';
import type { Permission, User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  homePath: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await authApi.login(username, password);
      setToken(res.accessToken);
      setUser(res.user);
      return res.user;
    } catch (err) {
      if (err instanceof ApiError) return null;
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      changePassword,
      isAdmin,
      hasPermission: (permission: Permission) => hasPermission(user, permission),
      homePath: homePath(user),
    }),
    [user, loading, login, logout, changePassword, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function roleLabel(role: UserRole, t: (k: import('../i18n/translations').TranslationKey) => string) {
  return role === 'admin' ? t('admin') : t('employee');
}
