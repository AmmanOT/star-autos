import { useState } from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, isAdmin, changePassword } = useAuth();
  const { refresh, loading } = useStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!newPassword) {
      setPwError(t('passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('passwordsDoNotMatch'));
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess(t('passwordChanged'));
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t('settings')}</h1>

      <Card title={t('language')}>
        <div className="flex gap-2">
          <Button variant={lang === 'en' ? 'primary' : 'secondary'} icon={<Globe size={16} />} onClick={() => setLang('en')}>
            {t('english')}
          </Button>
          <Button variant={lang === 'ur' ? 'primary' : 'secondary'} onClick={() => setLang('ur')} className="font-urdu">
            {t('urdu')}
          </Button>
        </div>
      </Card>

      <Card title={theme === 'light' ? t('darkMode') : t('lightMode')}>
        <Button variant="secondary" icon={theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} onClick={toggleTheme}>
          {theme === 'light' ? t('darkMode') : t('lightMode')}
        </Button>
      </Card>

      <Card title={t('account')}>
        <div className="space-y-2 text-sm">
          <p><span className="text-[var(--color-text-muted)]">{t('name')}:</span> {user?.name}</p>
          <p><span className="text-[var(--color-text-muted)]">{t('username')}:</span> {user?.username}</p>
          <p><span className="text-[var(--color-text-muted)]">{t('type')}:</span> {isAdmin ? t('admin') : t('employee')}</p>
        </div>
      </Card>

      <Card title={t('changePassword')}>
        <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-3 max-w-md">
          <Input
            label={t('currentPassword')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            label={t('newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label={t('confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-emerald-600">{pwSuccess}</p>}
          <Button type="submit" disabled={saving}>{saving ? '…' : t('save')}</Button>
        </form>
      </Card>

      <Card title={t('shopInfo')}>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t('shopInfo')}</p>
          <p className="text-[var(--color-text-muted)]">{t('shopAddress')}</p>
          <p className="text-[var(--color-text-muted)]">{t('shopPhone')}</p>
        </div>
      </Card>

      {isAdmin && (
        <Card title={t('data')}>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {t('dataHint')}
          </p>
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? t('refreshing') : t('refreshFromServer')}
          </Button>
        </Card>
      )}
    </div>
  );
}
