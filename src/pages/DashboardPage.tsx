import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Receipt, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { reportsApi, type DashboardSummary } from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { StatCard, Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatPKR, formatDateShort } from '../utils/format';

export function DashboardPage() {
  const { t, lang } = useLanguage();
  const { hideFinancials } = usePrivacy();
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void reportsApi
      .dashboard()
      .then((summary) => {
        if (!cancelled) setData(summary);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const todaySales = data?.todaySales ?? 0;
  const todayBillCount = data?.todayBillCount ?? 0;
  const productCount = data?.productCount ?? 0;
  const customerCount = data?.customerCount ?? 0;
  const pendingDues = data?.pendingDues ?? 0;
  const inventoryValue = data?.inventoryValue ?? 0;
  const billsThisMonth = data?.billsThisMonth ?? 0;
  const lowStockItems = data?.lowStock ?? [];
  const recentBills = data?.recentBills ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">{t('shopInfo')} — {t('shopAddress')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {!hideFinancials && (
          <StatCard label={t('todaySales')} value={formatPKR(todaySales)} icon={<TrendingUp size={20} />} trend={`${todayBillCount} bills today`} />
        )}
        <StatCard label={t('totalProducts')} value={String(productCount)} icon={<Package size={20} />} />
        <StatCard label={t('totalCustomers')} value={String(customerCount)} icon={<Users size={20} />} />
        {!hideFinancials && (
          <StatCard label={t('pendingDues')} value={formatPKR(pendingDues)} icon={<Receipt size={20} />} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title={t('recentBills')} action={
          <Link to="/admin/billing" className="text-sm text-brand-600 hover:underline flex items-center gap-1">{t('viewAll')} <ArrowRight size={14} /></Link>
        }>
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <th className="text-start px-5 py-2 font-medium">{t('billNumber')}</th>
                  <th className="text-start px-3 py-2 font-medium">{t('customer')}</th>
                  <th className="text-end px-3 py-2 font-medium">{t('total')}</th>
                  <th className="text-end px-5 py-2 font-medium">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill) => (
                  <tr key={bill.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-elevated)]">
                    <td className="px-5 py-3 font-medium">{bill.billNumber}</td>
                    <td className="px-3 py-3">{bill.customerName ?? t('walkIn')}</td>
                    <td className="px-3 py-3 text-end">{formatPKR(bill.total)}</td>
                    <td className="px-5 py-3 text-end text-[var(--color-text-muted)]">{formatDateShort(bill.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title={t('lowStock')}>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('noResults')}</p>
            ) : (
              <ul className="space-y-3">
                {lowStockItems.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lang === 'ur' ? p.nameUrdu : p.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{p.partNumber}</p>
                    </div>
                    <Badge variant="danger">{p.quantity} left</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="space-y-3 text-sm">
              {!hideFinancials && (
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">{t('inventoryValue')}</span><span className="font-semibold">{formatPKR(inventoryValue)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">{t('billsThisMonth')}</span><span className="font-semibold">{billsThisMonth}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">{t('lowStock')}</span>
                <Badge variant="warning"><AlertTriangle size={12} className="me-1" />{data?.lowStockCount ?? lowStockItems.length}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
