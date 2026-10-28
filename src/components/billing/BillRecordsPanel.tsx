import { useCallback, useEffect, useMemo, useState } from 'react';
import { billsApi } from '../../api';
import { Eye, Pencil, Trash2, Printer, MessageCircle, Plus, Minus } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SearchInput } from '../ui/SearchInput';
import { ThermalReceipt } from './ThermalReceipt';
import { RetailRateToggle } from './RetailRateToggle';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { BulkPrintBillsButton } from './BulkPrintBills';
import { Pagination } from '../ui/Pagination';
import type { Bill, BillItem, Customer } from '../../types';
import { availableQtyForEdit, billProfit, recalcBillTotals } from '../../utils/billEffects';
import { printThermalReceipt } from '../../utils/printReceipt';
import {
  formatPKR,
  formatDate,
  formatDateShort,
  whatsappBillLink,
  buildBillWhatsAppText,
} from '../../utils/format';
import { productMatchesSearch } from '../../utils/search';

const ADD_NEW_CUSTOMER = '__add_new__';
const PAGE_SIZE = 50;

interface CartItem extends BillItem {
  maxQty: number;
}

export function BillRecordsPanel() {
  const { state, dispatch } = useStore();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { hideFinancials } = usePrivacy();
  const canEdit = hasPermission('edit');
  const canDelete = hasPermission('delete');

  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [page, setPage] = useState(1);
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, customerFilter, paymentFilter, dateFrom, dateTo]);

  const loadBills = useCallback(async (opts?: { ignore?: boolean }) => {
    const res = await billsApi.list({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      customerId: customerFilter === 'all' ? undefined : customerFilter,
      paymentMethod: paymentFilter === 'all' ? undefined : paymentFilter,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    });
    if (opts?.ignore) return;
    setBills(res.items);
    setTotal(res.total);
    const maxPage = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [page, debouncedSearch, customerFilter, paymentFilter, dateFrom, dateTo]);

  useEffect(() => {
    const req = { ignore: false };
    void loadBills(req).catch(() => {
      if (!req.ignore) {
        setBills([]);
        setTotal(0);
      }
    });
    return () => {
      req.ignore = true;
    };
  }, [loadBills]);

  const filtered = bills;

  const openView = (bill: Bill) => { setSelectedBill(bill); setModalMode('view'); };
  const openEdit = (bill: Bill) => { setSelectedBill(bill); setModalMode('edit'); };
  const closeModal = () => { setSelectedBill(null); setModalMode('view'); };

  const handleDelete = async (bill: Bill) => {
    if (!confirm(`${t('confirmDeleteBill')} (${bill.billNumber})`)) return;
    try {
      await dispatch({ type: 'DELETE_BILL', payload: bill.id });
      await loadBills();
    } catch {
      /* toast handled in store */
    }
  };

  const paymentBadge = (m: Bill['paymentMethod']) => {
    const v = m === 'credit' ? 'warning' : m === 'cash' ? 'success' : 'info';
    const label = { cash: t('cash'), bank: t('bank'), credit: t('creditSale'), mixed: t('mixed') }[m];
    return <Badge variant={v}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={`${t('search')} bill no, customer, part...`} className="flex-1" />
        <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} options={[
          { value: 'all', label: `${t('all')} ${t('customers')}` },
          { value: 'walkin', label: t('walkIn') },
          ...state.customers.map((c) => ({ value: c.id, label: c.name })),
        ]} className="lg:w-48" />
        <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} options={[
          { value: 'all', label: t('all') },
          { value: 'cash', label: t('cash') },
          { value: 'bank', label: t('bank') },
          { value: 'credit', label: t('creditSale') },
          { value: 'mixed', label: t('mixed') },
        ]} className="lg:w-36" />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="lg:w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="lg:w-40" />
        <BulkPrintBillsButton
          defaultCustomerId={customerFilter !== 'all' ? customerFilter : ''}
        />
      </div>

      <Card>
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-start px-5 py-2">{t('billNumber')}</th>
                <th className="text-start px-3 py-2">{t('customer')}</th>
                <th className="text-start px-3 py-2">{t('items')}</th>
                <th className="text-end px-3 py-2">{t('total')}</th>
                {!hideFinancials && <th className="text-end px-3 py-2">{t('profit')}</th>}
                <th className="text-end px-3 py-2">{t('paid')}</th>
                <th className="text-end px-3 py-2">{t('due')}</th>
                <th className="text-start px-3 py-2">{t('paymentMethod')}</th>
                <th className="text-end px-3 py-2">{t('date')}</th>
                <th className="text-end px-5 py-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bill) => {
                const due = bill.total - bill.paidAmount;
                return (
                  <tr key={bill.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-elevated)]">
                    <td className="px-5 py-3 font-mono font-medium">{bill.billNumber}</td>
                    <td className="px-3 py-3">{bill.customerName ?? t('walkIn')}</td>
                    <td className="px-3 py-3 text-[var(--color-text-muted)]">{bill.items?.length ?? 0}</td>
                    <td className="px-3 py-3 text-end font-medium">{formatPKR(bill.total)}</td>
                    {!hideFinancials && (
                      <td className="px-3 py-3 text-end font-medium text-emerald-600">{formatPKR(billProfit(bill, state.products))}</td>
                    )}
                    <td className="px-3 py-3 text-end">{formatPKR(bill.paidAmount)}</td>
                    <td className="px-3 py-3 text-end">
                      {due > 0 ? <span className="text-amber-600 font-medium">{formatPKR(due)}</span> : '—'}
                    </td>
                    <td className="px-3 py-3">{paymentBadge(bill.paymentMethod)}</td>
                    <td className="px-3 py-3 text-end text-[var(--color-text-muted)]">{formatDateShort(bill.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => openView(bill)} title={t('viewBill')} />
                        {canEdit && (
                          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(bill)} title={t('editBill')} />
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(bill)} title={t('deleteBill')} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-10 text-[var(--color-text-muted)]">{t('noResults')}</p>
          )}
        </div>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          shown={filtered.length}
          onPage={setPage}
          unit="bills"
        />
      </Card>

      {selectedBill && (
        <BillDetailModal
          key={`${selectedBill.id}-${modalMode}`}
          bill={selectedBill}
          mode={modalMode}
          onClose={closeModal}
          onSwitchToEdit={() => setModalMode('edit')}
          onSaved={() => void loadBills()}
        />
      )}
    </div>
  );
}

function BillDetailModal({ bill, mode, onClose, onSwitchToEdit, onSaved }: {
  bill: Bill;
  mode: 'view' | 'edit';
  onClose: () => void;
  onSwitchToEdit: () => void;
  onSaved?: () => void;
}) {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();
  const { hasPermission } = useAuth();
  const { hideFinancials } = usePrivacy();
  const canEdit = hasPermission('edit');
  const isEdit = mode === 'edit';

  const [customerId, setCustomerId] = useState(bill.customerId ?? '');
  const [items, setItems] = useState<CartItem[]>(() =>
    bill.items.map((item) => {
      const product = state.products.find((p) => p.id === item.productId);
      return {
        ...item,
        maxQty: product ? availableQtyForEdit(product, bill, item.productId) : item.quantity,
      };
    }),
  );
  const [discount, setDiscount] = useState(bill.discount);
  const [paidAmount, setPaidAmount] = useState(bill.paidAmount);
  const [paymentMethod, setPaymentMethod] = useState(bill.paymentMethod);
  const [notes, setNotes] = useState(bill.notes ?? '');
  const [search, setSearch] = useState('');
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchResults = useMemo(() => {
    if (!isEdit) return [];
    if (!search.trim()) return [];
    return state.products.filter((p) => {
      const onBill = items.find((i) => i.productId === p.id)?.quantity ?? 0;
      const avail = p.quantity + onBill;
      return avail > 0 && productMatchesSearch(search, p);
    });
  }, [search, state.products, items, isEdit, lang]);

  const { subtotal, total } = recalcBillTotals(items, discount);
  const due = total - (paymentMethod === 'credit' ? 0 : paidAmount);

  const addItemAtPrice = (productId: string, unitPrice?: number) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    const maxQty = availableQtyForEdit(product, bill, productId);
    const existing = items.find((i) => i.productId === productId);
    const price = unitPrice ?? product.salePrice;
    if (existing) {
      if (existing.quantity >= maxQty) return;
      setItems((prev) => {
        const updated = {
          ...existing,
          quantity: existing.quantity + 1,
          total: (existing.quantity + 1) * existing.unitPrice,
          maxQty,
        };
        return [updated, ...prev.filter((i) => i.productId !== productId)];
      });
    } else {
      setItems((prev) => [{
        productId: product.id,
        productName: lang === 'ur' ? product.nameUrdu : product.name,
        partNumber: product.partNumber,
        brand: product.brand,
        quantity: 1,
        unitPrice: price,
        total: price,
        maxQty,
      }, ...prev]);
    }
    setSearch('');
  };

  const addItem = (productId: string) => addItemAtPrice(productId);

  const updateQty = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.productId !== productId) return [i];
        const newQty = i.quantity + delta;
        if (newQty <= 0) return [];
        if (newQty > i.maxQty) return [i];
        return [{ ...i, quantity: newQty, total: newQty * i.unitPrice }];
      }),
    );
  };

  const updateItemPrice = (productId: string, unitPrice: number) => {
    const price = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, unitPrice: price, total: i.quantity * price } : i,
      ),
    );
  };

  const handleSave = async () => {
    if (items.length === 0 || saving) return;
    const customer = customerId ? state.customers.find((c) => c.id === customerId) : undefined;
    const paid = paymentMethod === 'credit' ? 0 : paidAmount;
    setSaving(true);
    try {
      await dispatch({
        type: 'UPDATE_BILL',
        payload: {
          ...bill,
          customerId: customer?.id,
          customerName: customer?.name,
          items: items.map(({ maxQty: _, ...item }) => item),
          subtotal,
          discount,
          total,
          paidAmount: paid,
          paymentMethod,
          notes,
        },
      });
      onSaved?.();
      onClose();
    } catch {
      /* toast handled in store */
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => printThermalReceipt();
  const handleWhatsApp = () => {
    const phone = bill.customerId
      ? state.customers.find((c) => c.id === bill.customerId)?.phone ?? '03001234567'
      : '03001234567';
    const text = buildBillWhatsAppText(
      t('shopInfo'), bill.billNumber,
      bill.items.map((i) => ({ name: i.productName, qty: i.quantity, total: i.total })),
      bill.total, bill.paidAmount, bill.total - bill.paidAmount,
    );
    window.open(whatsappBillLink(phone, text), '_blank');
  };

  const paymentLabel = (m: Bill['paymentMethod']) =>
    ({ cash: t('cash'), bank: t('bank'), credit: t('creditSale'), mixed: t('mixed') })[m];

  return (
    <Modal open onClose={onClose} title={isEdit ? t('editBill') : t('billDetails')} size={isEdit ? 'xl' : 'lg'}>
      {isEdit ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm font-mono text-[var(--color-text-muted)]">{bill.billNumber}</p>
            <SearchInput value={search} onChange={setSearch} placeholder={t('search')} />
            {searchResults.length > 0 && (
              <div className="space-y-1 border border-[var(--color-border)] rounded-lg p-2">
                {searchResults.map((p) => {
                  const inItems = items.find((item) => item.productId === p.id);
                  return (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-[var(--color-surface-elevated)] text-sm">
                    <button type="button" onClick={() => addItem(p.id)} className="flex-1 min-w-0 text-start">
                      <span className="font-medium">{lang === 'ur' ? p.nameUrdu : p.name}</span>
                      {p.brand ? <span className="text-[var(--color-text-muted)]"> · {p.brand}</span> : null}
                      <span> — {formatPKR(p.salePrice)}</span>
                    </button>
                    <RetailRateToggle
                      retail={p.retailPrice ?? 0}
                      salePrice={p.salePrice}
                      unitPrice={inItems?.unitPrice ?? p.salePrice}
                      onApply={(price) => {
                        if (inItems) updateItemPrice(p.id, price);
                        else addItemAtPrice(p.id, price);
                      }}
                    />
                  </div>
                  );
                })}
              </div>
            )}
            <div className="space-y-2">
              {items.map((item, index) => {
                const product = state.products.find((p) => p.id === item.productId);
                return (
                <div key={item.productId} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-elevated)] text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-900/60 dark:text-brand-200">{index + 1}</span>
                  <div className="flex-1 min-w-0 has-tip" data-tip={item.productName}>
                    <p className="font-medium truncate">{item.productName}</p>
                    <RetailRateToggle
                      retail={product?.retailPrice ?? 0}
                      salePrice={product?.salePrice ?? item.unitPrice}
                      unitPrice={item.unitPrice}
                      onApply={(price) => updateItemPrice(item.productId, price)}
                    />
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItemPrice(item.productId, +e.target.value)}
                    className="w-20 px-2 py-1 text-sm text-end rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                    aria-label={t('rate')}
                  />
                  <Button variant="secondary" size="sm" icon={<Minus size={12} />} onClick={() => updateQty(item.productId, -1)} />
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={() => updateQty(item.productId, 1)} />
                  <span className="font-medium w-20 text-end">{formatPKR(item.total)}</span>
                </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <Select
              label={t('selectCustomer')}
              value={customerId}
              onChange={(e) => {
                if (e.target.value === ADD_NEW_CUSTOMER) {
                  setAddCustomerOpen(true);
                  return;
                }
                setCustomerId(e.target.value);
              }}
              options={[
                { value: '', label: t('walkIn') },
                { value: ADD_NEW_CUSTOMER, label: t('addNew') },
                ...state.customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input label={t('discount')} type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} />
            <Select label={t('paymentMethod')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as Bill['paymentMethod'])} options={[
              { value: 'cash', label: t('cash') }, { value: 'bank', label: t('bank') },
              { value: 'credit', label: t('creditSale') }, { value: 'mixed', label: t('mixed') },
            ]} />
            {paymentMethod !== 'credit' && (
              <Input label={t('paid')} type="number" value={paidAmount} onChange={(e) => setPaidAmount(+e.target.value)} />
            )}
            <Input label={t('notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="pt-3 border-t border-[var(--color-border)] space-y-1 text-sm">
              <div className="flex justify-between"><span>{t('subtotal')}</span><span>{formatPKR(subtotal)}</span></div>
              <div className="flex justify-between"><span>{t('total')}</span><span className="font-bold">{formatPKR(total)}</span></div>
              {due > 0 && <div className="flex justify-between text-amber-600"><span>{t('due')}</span><span>{formatPKR(due)}</span></div>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
              <Button onClick={() => void handleSave()} disabled={items.length === 0 || saving}>{saving ? '…' : t('save')}</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4 no-print">
            <div><span className="text-[var(--color-text-muted)]">{t('billNumber')}: </span><span className="font-mono font-medium">{bill.billNumber}</span></div>
            <div><span className="text-[var(--color-text-muted)]">{t('date')}: </span>{formatDate(bill.createdAt)}</div>
            <div><span className="text-[var(--color-text-muted)]">{t('customer')}: </span>{bill.customerName ?? t('walkIn')}</div>
            <div><span className="text-[var(--color-text-muted)]">{t('paymentMethod')}: </span>{paymentLabel(bill.paymentMethod)}</div>
            {!hideFinancials && (
              <div><span className="text-[var(--color-text-muted)]">{t('profit')}: </span><span className="font-medium text-emerald-600">{formatPKR(billProfit(bill, state.products))}</span></div>
            )}
          </div>
          <ThermalReceipt bill={bill} />
          <div className="flex flex-wrap gap-2 mt-4 justify-center no-print">
            <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>{t('printBill')}</Button>
            <Button variant="success" icon={<MessageCircle size={16} />} onClick={handleWhatsApp}>{t('shareWhatsApp')}</Button>
            {mode === 'view' && canEdit && <Button icon={<Pencil size={16} />} onClick={onSwitchToEdit}>{t('editBill')}</Button>}
          </div>
        </>
      )}
      <CustomerFormModal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSaved={(customer: Customer) => {
          if (customer?.id) setCustomerId(customer.id);
        }}
      />
    </Modal>
  );
}
