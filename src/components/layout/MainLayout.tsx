import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Receipt, BookOpen, BarChart3, Settings, LogOut,
  Moon, Sun, Globe, Menu, X, ScrollText, UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../ui/Badge';
import { BrandLogo } from '../brand/BrandLogo';
import type { Permission } from '../../types';
import type { TranslationKey } from '../../i18n/translations';

const navLinks: {
  to: string;
  icon: typeof LayoutDashboard;
  key: TranslationKey;
  permission?: Permission;
  adminOnly?: boolean;
}[] = [
  { to: '/admin', icon: LayoutDashboard, key: 'dashboard', permission: 'dashboard' },
  { to: '/admin/inventory', icon: Package, key: 'inventory', permission: 'inventory' },
  { to: '/admin/customers', icon: Users, key: 'customers', permission: 'customers' },
  { to: '/admin/billing', icon: Receipt, key: 'billing', permission: 'billing' },
  { to: '/admin/ledger', icon: BookOpen, key: 'ledger', permission: 'ledger' },
  { to: '/admin/reports', icon: BarChart3, key: 'reports', permission: 'reports' },
  { to: '/admin/activity-logs', icon: ScrollText, key: 'activityLogs', permission: 'activityLogs' },
  { to: '/admin/employees', icon: UserCog, key: 'employees', adminOnly: true },
  { to: '/admin/settings', icon: Settings, key: 'settings' },
];

export function MainLayout() {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = navLinks.filter((link) => {
    if (link.adminOnly) return isAdmin;
    if (link.permission) return hasPermission(link.permission);
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-surface-elevated)]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 start-0 z-50 w-64 flex flex-col border-e border-[var(--color-border)] bg-[var(--color-surface)] transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full rtl:lg:translate-x-0'}`}>
        <div className="px-4 py-4 border-b border-[var(--color-border)] flex justify-center bg-[var(--color-surface)]">
          <BrandLogo size="md" className="mx-auto" />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-800/50 dark:text-brand-300'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon size={18} />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)] space-y-3">
          {!isAdmin && (
            <p className="text-xs text-amber-600 dark:text-amber-400 px-1">{t('limitedAccess')}</p>
          )}
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-400 text-sm font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <Badge variant={isAdmin ? 'info' : 'default'}>{isAdmin ? t('admin') : t('employee')}</Badge>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md">
          <button
            className="lg:hidden p-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
              title={t('language')}
            >
              <Globe size={16} />
              {lang === 'en' ? 'اردو' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
              title={theme === 'light' ? t('darkMode') : t('lightMode')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto w-full max-w-[100vw] lg:max-w-none">
          <Outlet />
        </main>

        <footer className="hidden sm:block px-6 py-2 text-center text-[10px] text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          {t('prototype')}
        </footer>
      </div>
    </div>
  );
}
