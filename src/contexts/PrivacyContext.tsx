import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'hide-financials';

interface PrivacyContextValue {
  hideFinancials: boolean;
  toggleFinancials: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [hidden, setHidden] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY) === '1' || sessionStorage.getItem('privacy-blur') === '1';
  });

  const toggleFinancials = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      sessionStorage.removeItem('privacy-blur');
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      hideFinancials: !isAdmin || hidden,
      toggleFinancials,
    }),
    [isAdmin, hidden, toggleFinancials],
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider');
  return ctx;
}
