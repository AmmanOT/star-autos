import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { usersApi } from '../api';
import { PERMISSIONS } from '../constants/permissions';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import type { Permission, User } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import type { TranslationKey } from '../i18n/translations';

const emptyForm = () => ({
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  permissions: [] as Permission[],
});

const PERMISSION_LABEL: Record<Permission, TranslationKey> = {
  dashboard: 'dashboard',
  inventory: 'inventory',
  customers: 'customers',
  billing: 'billing',
  ledger: 'ledger',
  reports: 'reports',
  activityLogs: 'activityLogs',
};

export function EmployeesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees(await usersApi.list());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (employee: User) => {
    setEditing(employee);
    setForm({
      name: employee.name,
      username: employee.username,
      password: '',
      confirmPassword: '',
      phone: employee.phone ?? '',
      permissions: [...(employee.permissions ?? [])],
    });
    setError('');
    setModalOpen(true);
  };

  const togglePermission = (permission: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSave = async () => {
    setError('');
    if (form.name.trim().length < 2) {
      setError(t('nameRequired'));
      return;
    }
    const username = form.username.trim();
    const usernameUnchanged = !!editing && username.toLowerCase() === editing.username;
    if (!usernameUnchanged && !/^[a-zA-Z0-9._@-]{2,40}$/.test(username)) {
      setError(t('usernameHint'));
      return;
    }
    if (!editing && !form.password) {
      setError(t('passwordMin'));
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        permissions: form.permissions,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) {
        await usersApi.update(editing.id, payload);
        toast.success(t('employeeUpdated'));
      } else {
        await usersApi.create({ ...payload, password: form.password });
        toast.success(t('employeeCreated'));
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee: User) => {
    if (!confirm(`${t('confirmDelete')} (${employee.username})`)) return;
    try {
      await usersApi.remove(employee.id);
      toast.success(t('employeeDeleted'));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('employees')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('employeesHint')}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>{t('addEmployee')}</Button>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('loading')}</p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('noEmployees')}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 font-medium text-start">{t('name')}</th>
                  <th className="px-3 py-3 font-medium text-start">{t('username')}</th>
                  <th className="px-3 py-3 font-medium text-start">{t('phone')}</th>
                  <th className="px-3 py-3 font-medium text-start">{t('permissions')}</th>
                  <th className="px-5 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-3 font-medium">{employee.name}</td>
                    <td className="px-3 py-3 font-mono text-[var(--color-text-muted)]">{employee.username}</td>
                    <td className="px-3 py-3 text-[var(--color-text-muted)]">{employee.phone || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(employee.permissions ?? []).length === 0 && (
                          <Badge>{t('noAccess')}</Badge>
                        )}
                        {(employee.permissions ?? []).map((permission) => (
                          <Badge key={permission} variant="info">{t(PERMISSION_LABEL[permission])}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(employee)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void handleDelete(employee)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('editEmployee') : t('addEmployee')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('name')}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label={t('username')}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="ahmed.pos"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
            <Input
              label={editing ? t('newPasswordOptional') : t('password')}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
              required={!editing}
            />
            <Input
              label={t('confirmPassword')}
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              autoComplete="new-password"
              required={!editing || !!form.password}
            />
            <div className="sm:col-span-2">
              <Input
                label={t('phone')}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)] mb-2">{t('permissions')}</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">{t('permissionsHint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSIONS.map((permission) => {
                const checked = form.permissions.includes(permission);
                return (
                  <label
                    key={permission}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                      checked
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(permission)}
                      className="rounded border-[var(--color-border)]"
                    />
                    <span className="text-sm">{t(PERMISSION_LABEL[permission])}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? '…' : t('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
