import { useEffect, useMemo, useState } from 'react';
import { customersApi, newIdempotencyKey } from '../api';
import { Eye, FileDown, Plus, Printer, Trash2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { BulkPrintBillsButton } from '../components/billing/BulkPrintBills';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { formatPKR, formatDateShort, pkDateKey } from '../utils/format';
import { brandedFooter, brandedHeader, escapeHtml, printA4Pdf } from '../utils/exportPdf';
import { matchesSearch, productMatchesSearch } from '../utils/search';
import { printThermalReceipt } from '../utils/printReceipt';
import type { Bill, Payment } from '../types';

export function LedgerPage() {
  const { state, dispatch } = useStore();
  const { user, hasPermission, isDemo } = useAuth();
  const toast = useToast();
  const { t, lang } = useLanguage();
  const isCustomer = user?.role === 'customer';
  const canDelete = hasPermission('delete');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    isCustomer ? user?.customerId ?? state.customers[0]?.id ?? null : state.customers[0]?.id ?? null,
  );
  const [paymentModal, setPaymentModal] = useState(false);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [payForm, setPayForm] = useState({ amount: 0, type: 'received' as 'received' | 'paid', method: 'cash' as 'cash' | 'bank', notes: '' });
  const [customerBills, setCustomerBills] = useState<Bill[]>([]);
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    if (isCustomer) {
      const ownId = user?.customerId ?? state.customers[0]?.id ?? null;
      setSelectedId(ownId);
    }
  }, [isCustomer, user?.customerId, state.customers]);

  const filteredCustomers = state.customers.filter((c) =>
    matchesSearch(search, c.name, c.nameUrdu, c.phone),
  );

  const selected = state.customers.find((c) => c.id === selectedId);

  const inDateRange = (iso: string) => {
    const key = pkDateKey(iso);
    if (dateFrom && key < dateFrom) return false;
    if (dateTo && key > dateTo) return false;
    return true;
  };

  const visibleBills = useMemo(
    () => customerBills.filter((bill) => inDateRange(bill.createdAt)),
    [customerBills, dateFrom, dateTo],
  );
  const visiblePayments = useMemo(
    () => customerPayments.filter((payment) => inDateRange(payment.createdAt)),
    [customerPayments, dateFrom, dateTo],
  );
  const totalPurchased = visibleBills.reduce((sum, bill) => sum + Number(bill.total), 0);
  const inventoryItems = useMemo(
    () =>
      state.products.filter((product) =>
        inventorySearch.trim() ? productMatchesSearch(inventorySearch, product) : true,
      ),
    [state.products, inventorySearch],
  );

  useEffect(() => {
    if (!selectedId) {
      setCustomerBills([]);
      setCustomerPayments([]);
      return;
    }
    let cancelled = false;
    void customersApi
      .ledger(selectedId)
      .then((res) => {
        if (cancelled) return;
        setCustomerBills(
          res.entries.filter((e) => e.kind === 'bill').map((e) => e.data as Bill),
        );
        setCustomerPayments(
          res.entries.filter((e) => e.kind === 'payment').map((e) => e.data as Payment),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCustomerBills([]);
        setCustomerPayments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, state.customers, state.payments, state.bills]);

  const handlePayment = async () => {
    if (!selectedId || payForm.amount <= 0 || saving) return;
    setSaving(true);
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
        idempotencyKey: newIdempotencyKey(),
      });
      setPaymentModal(false);
      setPayForm({ amount: 0, type: 'received', method: 'cash', notes: '' });
    } catch {
      /* toast handled in store */
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm(t('confirmDeletePayment'))) return;
    try {
      await dispatch({ type: 'DELETE_PAYMENT', payload: id });
    } catch {
      /* toast handled in store */
    }
  };

  const handleDeleteBill = async (billNumber: string, id: string) => {
    if (!confirm(`${t('confirmDeleteBill')} (${billNumber})`)) return;
    try {
      await dispatch({ type: 'DELETE_BILL', payload: id });
    } catch {
      /* toast handled in store */
    }
  };

  const exportCustomerBillsPdf = () => {
    if (!selected) return;
    const rows = [...visibleBills].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    if (rows.length === 0) {
      toast.error(t('noBillsToPrint'));
      return;
    }
    const customerName = lang === 'ur' ? selected.nameUrdu || selected.name : selected.name;
    const shop = t('shopInfo');
    const address = isDemo ? t('demoShopAddress') : t('shopAddress');
    const phone = isDemo ? t('demoShopPhone') : t('shopPhone');
    const extra = `<span class="meta-chip">${escapeHtml(customerName)}${selected.phone ? ` · ${escapeHtml(selected.phone)}` : ''}</span>`;
    const itemBrand = (productId: string, saved?: string) =>
      saved || state.products.find((product) => product.id === productId)?.brand || '—';

    const invoicesHtml = rows
      .map((bill) => {
        const itemRows = (bill.items || [])
          .map(
            (item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(item.productName)}</td>
              <td>${escapeHtml(itemBrand(item.productId, item.brand))}</td>
              <td class="num">${item.quantity}</td>
              <td class="num">${escapeHtml(formatPKR(item.unitPrice))}</td>
              <td class="num">${escapeHtml(formatPKR(item.total))}</td>
            </tr>`,
          )
          .join('');
        return `
          <article class="invoice">
            <div class="invoice-head">
              <span class="bill-no">${escapeHtml(t('billNumber'))} ${escapeHtml(bill.billNumber)}</span>
              <span class="bill-date">${escapeHtml(formatDateShort(bill.createdAt))}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width:7%">#</th>
                  <th>${escapeHtml(t('items'))}</th>
                  <th>${escapeHtml(t('brand'))}</th>
                  <th class="num">${escapeHtml(t('quantity'))}</th>
                  <th class="num">${escapeHtml(t('rate'))}</th>
                  <th class="num">${escapeHtml(t('total'))}</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <div class="invoice-total">
              <span>${escapeHtml(t('total'))}</span>
              <span>${escapeHtml(formatPKR(bill.total))}</span>
            </div>
          </article>
        `;
      })
      .join('');

    const body = `
      ${brandedHeader(shop, address, phone, t('customerBillsPdf'), extra)}
      <div class="invoices">${invoicesHtml}</div>
      <div class="total-box">
        <span>${escapeHtml(t('totalBalance'))}</span>
        <span>${escapeHtml(formatPKR(selected.balance))}</span>
      </div>
      ${brandedFooter()}
    `;
    printA4Pdf(`${customerName} — ${t('customerBillsPdf')}`, body);
  };

  const inventoryCard = (
    <Card title={t('inventory')} className="h-full">
      <SearchInput value={inventorySearch} onChange={setInventorySearch} placeholder={t('search')} className="mb-4" />
      {inventoryItems.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-sm">{t('noResults')}</p>
      ) : (
        <div className="overflow-auto max-h-[min(70vh,640px)] -mx-5 -mb-5">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-start px-5 py-2">{t('name')}</th>
                <th className="text-start px-3 py-2">{t('brand')}</th>
                <th className="text-start px-3 py-2">{t('category')}</th>
                <th className="text-end px-3 py-2">{t('salePrice')}</th>
                <th className="text-end px-5 py-2">{t('stock')}</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-2 font-medium">{lang === 'ur' ? p.nameUrdu || p.name : p.name}</td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)]">{p.brand}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2 text-end">{formatPKR(p.salePrice)}</td>
                  <td className="px-5 py-2 text-end">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const ledgerDetail = selected ? (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
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
            <p className="text-sm text-[var(--color-text-muted)] mt-3">{t('totalPurchased')}</p>
            <p className="text-xl font-bold">{formatPKR(totalPurchased)}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('fromDate')} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input label={t('toDate')} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </Card>

      <Card title={t('billHistory')}>
        {visibleBills.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">{t('noResults')}</p>
        ) : (
          <div className="overflow-auto max-h-[min(50vh,420px)] -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                  <th className="text-start px-5 py-2">{t('billNumber')}</th>
                  <th className="text-end px-3 py-2">{t('total')}</th>
                  <th className="text-end px-3 py-2">{t('paid')}</th>
                  <th className="text-end px-3 py-2">{t('due')}</th>
                  <th className="text-end px-5 py-2">{t('date')}</th>
                  <th className="text-end px-5 py-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleBills.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-3 font-medium">{b.billNumber}</td>
                    <td className="px-3 py-3 text-end">{formatPKR(b.total)}</td>
                    <td className="px-3 py-3 text-end">{formatPKR(b.paidAmount)}</td>
                    <td className="px-3 py-3 text-end text-amber-600">{formatPKR(b.total - b.paidAmount)}</td>
                    <td className="px-5 py-3 text-end text-[var(--color-text-muted)]">{formatDateShort(b.createdAt)}</td>
                    <td className="px-5 py-3 text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={14} />}
                          onClick={() => setViewBill(b)}
                        />
                        {!isCustomer && canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => void handleDeleteBill(b.billNumber, b.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={t('logPayments')}>
        {visiblePayments.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">{t('noResults')}</p>
        ) : (
          <div className="space-y-2 max-h-[min(40vh,320px)] overflow-y-auto">
            {visiblePayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-elevated)]">
                <div>
                  <Badge variant={p.type === 'received' ? 'success' : 'info'}>
                    {p.type === 'received' ? t('paymentReceived') : t('paymentPaid')}
                  </Badge>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDateShort(p.createdAt)} · {p.method}</p>
                  {p.notes && <p className="text-xs mt-0.5">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatPKR(p.amount)}</span>
                  {!isCustomer && canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => void handleDeletePayment(p.id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      </div>
      <div className="lg:col-span-1 lg:sticky lg:top-4 self-start">{inventoryCard}</div>
    </div>
  ) : (
    <Card><p className="text-[var(--color-text-muted)]">{t('selectCustomer')}</p></Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('ledger')}</h1>
        {selected && !isCustomer && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<FileDown size={16} />} onClick={exportCustomerBillsPdf}>
              {t('exportPDF')}
            </Button>
            <BulkPrintBillsButton defaultCustomerId={selected.id} />
            <Button icon={<Plus size={16} />} onClick={() => setPaymentModal(true)}>{t('addPayment')}</Button>
          </div>
        )}
      </div>

      {isCustomer ? (
        <div>{ledgerDetail}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title={t('customers')}>
            <SearchInput value={search} onChange={setSearch} placeholder={t('search')} className="mb-4" />
            <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-2">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-start p-3 rounded-lg transition-colors border ${
                    selectedId === c.id
                      ? 'bg-brand-50 dark:bg-brand-800/80 border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/40 shadow-sm'
                      : 'border-transparent hover:bg-[var(--color-surface-elevated)]'
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

          <div className="lg:col-span-2 space-y-4">{ledgerDetail}</div>
        </div>
      )}

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
            <Button onClick={() => void handlePayment()} disabled={saving || payForm.amount <= 0}>{saving ? '…' : t('save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewBill} onClose={() => setViewBill(null)} title={viewBill?.billNumber ?? t('viewBill')} size="sm">
        {viewBill && (
          <div className="space-y-4">
            <ThermalReceipt bill={viewBill} />
            <div className="flex justify-end gap-2 no-print">
              <Button variant="secondary" onClick={() => setViewBill(null)}>{t('cancel')}</Button>
              {!isCustomer && (
                <Button icon={<Printer size={16} />} onClick={() => printThermalReceipt()}>{t('printBill')}</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
