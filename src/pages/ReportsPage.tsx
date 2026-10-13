import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ApiError, reportsApi, type ReportsOverview } from '../api';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { buildOverviewFromBills } from '../utils/reportsOverview';
import { categoryLabel } from '../i18n/translations';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { addIsoDays, formatPKR } from '../utils/format';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const emptyOverview: ReportsOverview = {
  revenue: 0,
  profit: 0,
  billCount: 0,
  trend: [],
  categories: [],
  topProducts: [],
  topCustomers: [],
};

function monthRange(year: number, month: number) {
  const last = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, '0');
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(last).padStart(2, '0')}`,
  };
}

export function ReportsPage() {
  const { state } = useStore();
  const { t, lang } = useLanguage();
  const { hideFinancials } = usePrivacy();
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<ReportsOverview>(emptyOverview);

  const range = useMemo(() => {
    if (period === 'yearly') {
      return { from: `${selectedYear}-01-01`, to: `${selectedYear}-12-31` };
    }
    return monthRange(selectedYear, selectedMonth);
  }, [period, selectedMonth, selectedYear]);

  useEffect(() => {
    let cancelled = false;
    void reportsApi
      .overview(range.from, range.to, period)
      .then((overview) => {
        if (!cancelled) setData(overview);
      })
      .catch(async (err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          try {
            const sales = await reportsApi.sales(range.from, addIsoDays(range.to, 1));
            const bills = sales.bills ?? [];
            if (!cancelled) {
              setData(
                bills.length
                  ? buildOverviewFromBills(bills, state.products, period, range.from)
                  : {
                      ...emptyOverview,
                      revenue: Number(sales.revenue ?? 0),
                      billCount: Number(sales.billCount ?? 0),
                      trend: (sales.daily ?? []).map((row) => ({
                        label: period === 'yearly' ? row.date.slice(5, 7) : String(Number(row.date.slice(8, 10))),
                        sales: row.revenue,
                      })),
                    },
              );
            }
            return;
          } catch {
            /* fall through */
          }
        }
        if (!cancelled) setData(emptyOverview);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, period, state.products]);

  const categoryData = data.categories.map((row) => ({
    ...row,
    name: categoryLabel(lang, row.name),
  }));

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

      {!hideFinancials && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><p className="text-sm text-[var(--color-text-muted)]">{t('revenue')}</p><p className="text-2xl font-bold mt-1">{formatPKR(data.revenue)}</p></Card>
        <Card><p className="text-sm text-[var(--color-text-muted)]">{t('profit')}</p><p className="text-2xl font-bold mt-1 text-emerald-600">{formatPKR(data.profit)}</p></Card>
        <Card><p className="text-sm text-[var(--color-text-muted)]">{t('sales')}</p><p className="text-2xl font-bold mt-1">{data.billCount} bills</p></Card>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('salesTrend')}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.trend}>
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
          {data.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topProducts} layout="vertical">
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
          {data.topCustomers.length > 0 ? (
            <div className="space-y-3">
              {data.topCustomers.map((c, i) => (
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
