import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { homePath } from '../constants/permissions';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BrandLogo } from '../components/brand/BrandLogo';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const signedIn = await login(username.trim().toLowerCase(), password);
      if (signedIn) {
        toast.success('Signed in successfully');
        navigate(homePath(signedIn));
      } else {
        setError(t('invalidUsernamePassword'));
        toast.error(t('invalidUsernamePassword'));
      }
    } catch {
      setError('Unable to connect. Please try again.');
      toast.error('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/brand/login-bg.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#061222]/70" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#061222]/40 via-transparent to-[#061222]/85"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl bg-white/95 dark:bg-[var(--color-surface)]/95 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden border border-white/20 dark:border-[var(--color-border)]">
          <div className="px-4 sm:px-6 pt-6 pb-3 flex flex-col items-center text-center bg-transparent">
            <BrandLogo size="lg" className="drop-shadow-sm" />
          </div>

          <form onSubmit={handleSubmit} className="px-5 sm:px-8 pb-7 pt-1 space-y-4">
            <div className="text-center mb-1">
              <h1 className="font-display text-lg font-semibold tracking-[0.14em] text-[var(--color-text)] uppercase">
                {t('staffLogin')}
              </h1>
            </div>

            <Input
              label={t('username')}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
            <Input
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? '…' : t('login')}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/60 tracking-wide px-2">
          Madina Traders · Auto Spare Parts
        </p>
      </div>
    </div>
  );
}
