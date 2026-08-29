import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { activityLogsApi } from '../api';
import type { ActivityLog } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/format';

type Filter = 'all' | 'payment' | 'bill';

function actionBadge(action: string): { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  switch (action) {
    case 'payment.created':
      return { label: 'Payment', variant: 'success' };
    case 'bill.created':
      return { label: 'Bill created', variant: 'info' };
    case 'bill.updated':
      return { label: 'Bill updated', variant: 'warning' };
    case 'bill.deleted':
      return { label: 'Bill deleted', variant: 'danger' };
    default:
      return { label: action, variant: 'default' };
  }
}

export function ActivityLogsPage() {
  const { t, lang } = useLanguage();
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityLogsApi.list(filter === 'all' ? undefined : filter);
      setLogs(data);
    } catch {
      toastError('Could not load activity logs');
    } finally {
      setLoading(false);
    }
  }, [filter, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('logAll') },
    { key: 'payment', label: t('logPayments') },
    { key: 'bill', label: t('logBills') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('activityLogs')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Who added payments, created or changed bills
          </p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              filter === key
                ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-800/50 dark:text-brand-300 dark:border-brand-700'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="text-center py-10 text-[var(--color-text-muted)]">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-center py-10 text-[var(--color-text-muted)]">{t('noLogs')}</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-start">
                  <th className="px-3 py-2 font-medium text-start">{t('logWhen')}</th>
                  <th className="px-3 py-2 font-medium text-start">{t('logAction')}</th>
                  <th className="px-3 py-2 font-medium text-start">{t('logBy')}</th>
                  <th className="px-3 py-2 font-medium text-start">{t('logDetails')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badge = actionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-elevated)]"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-[var(--color-text-muted)]">
                        {formatDate(log.createdAt, lang)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{log.userName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">@{log.userUsername}</p>
                      </td>
                      <td className="px-3 py-3 max-w-xl">
                        <p className="leading-snug">{log.summary}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
