import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { formatPKR, formatDateShort } from '../utils/format';

export function LedgerPage() {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(state.customers[0]?.id ?? null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0, type: 'received' as 'received' | 'paid', method: 'cash' as 'cash' | 'bank', notes: '' });

  const filteredCustomers = state.customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.nameUrdu.includes(q) || c.phone.includes(q);
  });

  const selected = state.customers.find((c) => c.id === selectedId);
  const customerBills = state.bills.filter((b) => b.customerId === selectedId);
  const customerPayments = state.payments.filter((p) => p.customerId === selectedId);

  const handlePayment = async () => {
    if (!selectedId || payForm.amount <= 0) return;
    try {
      await dispatch({
        type: 'ADD_PAYMENT',
        payload: {
          customerId: selectedId,
          amount: payForm.amount,
          type: payForm.type,
          method: payForm.method,
          notes: payForm.notes,
        },
      });
      setPaymentModal(false);
      setPayForm({ amount: 0, type: 'received', method: 'cash', notes: '' });
    } catch {
      /* toast handled in store */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('ledger')}</h1>
        {selected && (
          <Button icon={<Plus size={16} />} onClick={() => setPaymentModal(true)}>{t('addPayment')}</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <Card title={t('customers')}>
          <SearchInput value={search} onChange={setSearch} placeholder={t('search')} className="mb-4" />
          <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-2">
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-start p-3 rounded-lg transition-colors ${
                  selectedId === c.id ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800' : 'hover:bg-[var(--color-surface-elevated)]'
                }`}
              >
                <p className="font-medium">{lang === 'ur' ? c.nameUrdu : c.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-[var(--color-text-muted)]">{c.phone}</span>
                  <Badge variant={c.balance > 0 ? 'warning' : c.balance < 0 ? 'info' : 'success'}>
                    {formatPKR(Math.abs(c.balance))}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Ledger detail */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{lang === 'ur' ? selected.nameUrdu : selected.name}</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">{selected.phone} · {selected.city}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm text-[var(--color-text-muted)]">{t('balance')}</p>
                    <p className={`text-2xl font-bold ${selected.balance > 0 ? 'text-amber-600' : selected.balance < 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {formatPKR(Math.abs(selected.balance))}
                    </p>
                    <Badge variant={selected.balance > 0 ? 'warning' : selected.balance < 0 ? 'info' : 'success'}>
                      {selected.balance > 0 ? t('theyOweUs') : selected.balance < 0 ? t('weOweThem') : t('settled')}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card title={t('billHistory')}>
                {customerBills.length === 0 ? (
                  <p className="text-[var(--color-text-muted)] text-sm">{t('noResults')}</p>
                ) : (
                  <div className="overflow-x-auto -mx-5 -mb-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                          <th className="text-start px-5 py-2">{t('billNumber')}</th>
                          <th className="text-end px-3 py-2">{t('total')}</th>
                          <th className="text-end px-3 py-2">{t('paid')}</th>
                          <th className="text-end px-3 py-2">{t('due')}</th>
                          <th className="text-end px-5 py-2">{t('date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerBills.map((b) => (
                          <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                            <td className="px-5 py-3 font-medium">{b.billNumber}</td>
                            <td className="px-3 py-3 text-end">{formatPKR(b.total)}</td>
                            <td className="px-3 py-3 text-end">{formatPKR(b.paidAmount)}</td>
                            <td className="px-3 py-3 text-end text-amber-600">{formatPKR(b.total - b.paidAmount)}</td>
                            <td className="px-5 py-3 text-end text-[var(--color-text-muted)]">{formatDateShort(b.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title={t('addPayment')}>
                {customerPayments.length === 0 ? (
                  <p className="text-[var(--color-text-muted)] text-sm">{t('noResults')}</p>
                ) : (
                  <div className="space-y-2">
                    {customerPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-elevated)]">
                        <div>
                          <Badge variant={p.type === 'received' ? 'success' : 'info'}>
                            {p.type === 'received' ? t('paymentReceived') : t('paymentPaid')}
                          </Badge>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDateShort(p.createdAt)} · {p.method}</p>
                          {p.notes && <p className="text-xs mt-0.5">{p.notes}</p>}
                        </div>
                        <span className="font-bold">{formatPKR(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card><p className="text-[var(--color-text-muted)]">{t('selectCustomer')}</p></Card>
          )}
        </div>
      </div>

      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title={t('addPayment')}>
        <div className="space-y-4">
          <Select
            label={t('type')}
            value={payForm.type}
            onChange={(e) => setPayForm({ ...payForm, type: e.target.value as 'received' | 'paid' })}
            options={[
              { value: 'received', label: t('paymentReceived') },
              { value: 'paid', label: t('paymentPaid') },
            ]}
          />
          <Input label={t('amount')} type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: +e.target.value })} />
          <Select
            label={t('method')}
            value={payForm.method}
            onChange={(e) => setPayForm({ ...payForm, method: e.target.value as 'cash' | 'bank' })}
            options={[{ value: 'cash', label: t('cash') }, { value: 'bank', label: t('bank') }]}
          />
          <Input label={t('notes')} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPaymentModal(false)}>{t('cancel')}</Button>
            <Button onClick={handlePayment}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
