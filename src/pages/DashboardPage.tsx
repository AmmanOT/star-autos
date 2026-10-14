import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Receipt, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { reportsApi, type DashboardSummary } from '../api';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { StatCard, Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { addIsoDays, formatPKR, formatDateShort, isLowStock, todayPkDateKey } from '../utils/format';
import type { Bill } from '../types';

export function DashboardPage() {
  const { state } = useStore();
  const { t, lang } = useLanguage();
  const { hideFinancials } = usePrivacy();
  const [api, setApi] = useState<DashboardSummary | null>(null);
  const [todayExtra, setTodayExtra] = useState<{ sales: number; count: number; recent: Bill[] }>({
    sales: 0,
    count: 0,
    recent: [],
  });

  useEffect(() => {
    let cancelled = false;
    const today = todayPkDateKey();
    void reportsApi
      .dashboard()
      .then((summary) => {
        if (!cancelled) setApi(summary);
      })
      .catch(() => {
        if (!cancelled) setApi(null);
      });
    void reportsApi
      .sales(today, addIsoDays(today, 1))
      .then((sales) => {
        if (cancelled) return;
        const recent = [...(sales.bills ?? [])]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setTodayExtra({
          sales: Number(sales.revenue ?? 0),
          count: Number(sales.billCount ?? recent.length),
          recent,
        });
      })
      .catch(() => {
        /* dashboard store fallback still fills counts */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productCount = api?.productCount || state.products.length;
  const customerCount = api?.customerCount || state.customers.length;
  const pendingDues =
    api?.pendingDues ||
    state.customers.reduce((sum, customer) => sum + Math.max(0, customer.balance), 0);
  const inventoryValue =
    api?.inventoryValue ||
    state.products.reduce((sum, product) => sum + product.purchasePrice * product.quantity, 0);
  const todaySales = api?.todaySales || todayExtra.sales;
  const todayBillCount = api?.todayBillCount || todayExtra.count;
  const billsThisMonth = api?.billsThisMonth ?? 0;
  const storeLowStock = state.products
    .filter((p) => isLowStock(p.quantity, p.minStock))
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
  const lowStockItems = storeLowStock.length > 0 ? storeLowStock : (api?.lowStock ?? []);
  const lowStockCount = Math.max(api?.lowStockCount ?? 0, lowStockItems.length);
  const recentBills = api?.recentBills?.length ? api.recentBills : todayExtra.recent;

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
          <Card
            title={t('lowStock')}
            action={
              <Link to="/admin/inventory?stock=low" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                {t('viewAll')} <ArrowRight size={14} />
              </Link>
            }
          >
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{t('noResults')}</p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto pe-1">
                {lowStockItems.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lang === 'ur' ? p.nameUrdu || p.name : p.name}</p>
                      {p.partNumber ? (
                        <p className="text-xs text-[var(--color-text-muted)]">{p.partNumber}</p>
                      ) : null}
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
                <Badge variant="warning"><AlertTriangle size={12} className="me-1" />{lowStockCount}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
