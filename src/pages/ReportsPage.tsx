import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { categoryLabel } from '../i18n/translations';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { formatPKR } from '../utils/format';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function ReportsPage() {
  const { state } = useStore();
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredBills = useMemo(() => {
    return state.bills.filter((b) => {
      const d = new Date(b.createdAt);
      if (period === 'monthly') return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear;
    });
  }, [state.bills, period, selectedMonth, selectedYear]);

  const totalRevenue = filteredBills.reduce((s, b) => s + b.total, 0);
  const totalProfit = filteredBills.reduce((s, bill) => {
    return s + bill.items.reduce((ps, item) => {
      const product = state.products.find((p) => p.id === item.productId);
      const cost = product ? product.purchasePrice * item.quantity : 0;
      return ps + (item.total - cost);
    }, 0);
  }, 0);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredBills.forEach((bill) => {
      bill.items.forEach((item) => {
        const product = state.products.find((p) => p.id === item.productId);
        const cat = product?.category ?? 'other';
        map.set(cat, (map.get(cat) ?? 0) + item.total);
      });
    });
    return Array.from(map.entries()).map(([cat, value]) => ({
      name: categoryLabel(lang, cat),
      value,
    }));
  }, [filteredBills, state.products, lang]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filteredBills.forEach((bill) => {
      bill.items.forEach((item) => {
        const existing = map.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.total;
        } else {
          map.set(item.productId, { name: item.productName, qty: item.quantity, revenue: item.total });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredBills]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; total: number; bills: number }>();
    filteredBills.forEach((bill) => {
      if (!bill.customerId || !bill.customerName) return;
      const existing = map.get(bill.customerId);
      if (existing) {
        existing.total += bill.total;
        existing.bills += 1;
      } else {
        map.set(bill.customerId, { name: bill.customerName, total: bill.total, bills: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filteredBills]);

  const dailyTrend = useMemo(() => {
    const days = period === 'monthly' ? new Date(selectedYear, selectedMonth + 1, 0).getDate() : 12;
    const data = [];
    if (period === 'monthly') {
      for (let d = 1; d <= days; d++) {
        const dayTotal = filteredBills
          .filter((b) => new Date(b.createdAt).getDate() === d)
          .reduce((s, b) => s + b.total, 0);
        data.push({ label: String(d), sales: dayTotal });
      }
    } else {
      for (let m = 0; m < 12; m++) {
        const monthTotal = state.bills
          .filter((b) => { const d = new Date(b.createdAt); return d.getFullYear() === selectedYear && d.getMonth() === m; })
          .reduce((s, b) => s + b.total, 0);
        data.push({ label: new Date(selectedYear, m).toLocaleString('en', { month: 'short' }), sales: monthTotal });
      }
    }
    return data;
  }, [filteredBills, period, selectedMonth, selectedYear, state.bills]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: new Date(2025, i).toLocaleString('en', { month: 'long' }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('reports')}</h1>
        <div className="flex gap-2">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'monthly' | 'yearly')}
            options={[
              { value: 'monthly', label: t('monthlyReport') },
              { value: 'yearly', label: t('yearlyReport') },
            ]}
            className="w-40"
          />
          {period === 'monthly' && (
            <Select value={String(selectedMonth)} onChange={(e) => setSelectedMonth(+e.target.value)} options={months} className="w-36" />
          )}
          <Select
            value={String(selectedYear)}
            onChange={(e) => setSelectedYear(+e.target.value)}
            options={[2024, 2025, 2026].map((y) => ({ value: String(y), label: String(y) }))}
            className="w-28"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><p className="text-sm text-[var(--color-text-muted)]">{t('revenue')}</p><p className="text-2xl font-bold mt-1">{formatPKR(totalRevenue)}</p></Card>
        <Card><p className="text-sm text-[var(--color-text-muted)]">{t('profit')}</p><p className="text-2xl font-bold mt-1 text-emerald-600">{formatPKR(totalProfit)}</p></Card>
        <Card><p className="text-sm text-[var(--color-text-muted)]">{t('sales')}</p><p className="text-2xl font-bold mt-1">{filteredBills.length} bills</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('salesTrend')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('categoryBreakdown')}>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatPKR(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">{t('noResults')}</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('topProducts')}>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatPKR(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">{t('noResults')}</p>
          )}
        </Card>

        <Card title={t('topCustomers')}>
          {topCustomers.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-elevated)]">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{c.bills} bills</p>
                  </div>
                  <span className="font-bold">{formatPKR(c.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">{t('noResults')}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
