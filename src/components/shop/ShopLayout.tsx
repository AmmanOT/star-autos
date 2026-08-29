import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShoppingCart, Moon, Sun, Globe, Menu, X, Phone, Wrench, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { CartDrawer } from './CartDrawer';

export function ShopLayout() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { totalItems } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const isHome = location.pathname === '/';

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/shop', label: t('shop') },
    { to: '/shop#categories', label: t('categories') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-elevated)]">
      <header className={`sticky top-0 z-40 border-b border-[var(--color-border)] backdrop-blur-md ${isHome ? 'bg-[var(--color-surface)]/90' : 'bg-[var(--color-surface)]/95'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 rounded-xl bg-brand-600 text-white">
              <Wrench size={20} />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-[var(--color-text)] leading-tight">{t('shopInfo')}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">{t('shopTagline')}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors hover:text-brand-600 ${location.pathname === to ? 'text-brand-600' : 'text-[var(--color-text-muted)]'}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a href={`tel:${t('shopPhoneRaw')}`} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-600 font-medium">
              <Phone size={16} /> {t('shopPhone')}
            </a>
            <button onClick={() => setLang(lang === 'en' ? 'ur' : 'en')} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]" title={t('language')}>
              <Globe size={16} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
            <Link to="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700">
              <LogIn size={16} /> {t('staffLogin')}
            </Link>
            <button className="md:hidden p-2 rounded-lg border border-[var(--color-border)]" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] px-4 py-3 space-y-2 bg-[var(--color-surface)]">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium">{label}</Link>
            ))}
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-brand-600">{t('staffLogin')}</Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">{t('shopInfo')}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{t('shopAddress')}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('shopPhone')}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('shopHours')}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{t('shopHoursDetail')}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('quickLinks')}</h3>
            <div className="flex flex-col gap-1 text-sm">
              <Link to="/shop" className="text-brand-600 hover:underline">{t('shop')}</Link>
              <Link to="/login" className="text-brand-600 hover:underline">{t('staffLogin')}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
          © 2025 {t('shopInfo')} — {t('allRights')}
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
