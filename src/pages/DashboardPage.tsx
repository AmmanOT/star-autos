import { Link } from 'react-router-dom';
import { Package, Users, Receipt, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatCard, Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatPKR, formatDateShort, isLowStock } from '../utils/format';

export function DashboardPage() {
  const { state } = useStore();
  const { t, lang } = useLanguage();

  const today = new Date().toDateString();
  const todayBills = state.bills.filter((b) => new Date(b.createdAt).toDateString() === today);
  const todaySales = todayBills.reduce((s, b) => s + b.total, 0);
  const pendingDues = state.customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const lowStockItems = state.products.filter((p) => isLowStock(p.quantity, p.minStock));
  const inventoryValue = state.products.reduce((s, p) => s + p.purchasePrice * p.quantity, 0);
  const thisMonth = new Date().getMonth();
  const billsThisMonth = state.bills.filter((b) => new Date(b.createdAt).getMonth() === thisMonth);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">{t('shopInfo')} — {t('shopAddress')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t('todaySales')} value={formatPKR(todaySales)} icon={<TrendingUp size={20} />} trend={`${todayBills.length} bills today`} />
        <StatCard label={t('totalProducts')} value={String(state.products.length)} icon={<Package size={20} />} />
        <StatCard label={t('totalCustomers')} value={String(state.customers.length)} icon={<Users size={20} />} />
        <StatCard label={t('pendingDues')} value={formatPKR(pendingDues)} icon={<Receipt size={20} />} />
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
                {state.bills.slice(0, 5).map((bill) => (
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
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">{t('inventoryValue')}</span><span className="font-semibold">{formatPKR(inventoryValue)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">{t('billsThisMonth')}</span><span className="font-semibold">{billsThisMonth.length}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-text-muted)]">{t('lowStock')}</span>
                <Badge variant="warning"><AlertTriangle size={12} className="me-1" />{lowStockItems.length}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
