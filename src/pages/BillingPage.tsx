import { useEffect, useMemo, useState } from 'react';
import { Trash2, Printer, MessageCircle, ShoppingCart } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBillingDraft } from '../contexts/BillingDraftContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { Modal } from '../components/ui/Modal';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { BillRecordsPanel } from '../components/billing/BillRecordsPanel';
import { QtyStepper } from '../components/billing/QtyStepper';
import { formatPKR, whatsappBillLink, buildBillWhatsAppText } from '../utils/format';
import { productMatchesSearch } from '../utils/search';
import { printThermalReceipt } from '../utils/printReceipt';
import type { Bill } from '../types';

type Tab = 'new' | 'records';

export function BillingPage() {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();
  const {
    cart,
    customerId,
    discount,
    paidAmount,
    paymentMethod,
    notes,
    addToCart: addDraftItem,
    updateQty,
    removeItem,
    clearCart,
    setCustomerId,
    setDiscount,
    setPaidAmount,
    setPaymentMethod,
    setNotes,
    clearDraft,
    syncCartStock,
  } = useBillingDraft();

  const [tab, setTab] = useState<Tab>('new');
  const [search, setSearch] = useState('');
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    syncCartStock(state.products);
  }, [state.products, syncCartStock]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return state.products.filter((p) => p.quantity > 0 && productMatchesSearch(search, p));
  }, [search, state.products]);

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - discount);

  const addToCart = (productId: string) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product || product.quantity <= 0) return;
    addDraftItem({
      productId: product.id,
      productName: lang === 'ur' ? product.nameUrdu : product.name,
      partNumber: product.partNumber,
      brand: product.brand,
      quantity: 1,
      unitPrice: product.salePrice,
      total: product.salePrice,
      maxQty: product.quantity,
    });
    setSearch('');
  };

  const completeBill = async () => {
    if (cart.length === 0) return;
    const customer = customerId
      ? state.customers.find((c) => c.id === customerId)
      : undefined;
    const paid = paymentMethod === 'credit' ? 0 : (paidAmount || total);
    try {
      const created = (await dispatch({
        type: 'ADD_BILL',
        payload: {
          customerId: customer?.id,
          customerName: customer?.name,
          items: cart.map(({ maxQty: _, ...item }) => item),
          subtotal,
          discount,
          total,
          paidAmount: paid,
          paymentMethod,
          notes,
        },
      })) as Bill;
      setReceiptBill(created);
      setShowReceipt(true);
      clearDraft();
    } catch {
      /* toast handled in store */
    }
  };

  const handlePrint = () => printThermalReceipt();

  const handleWhatsApp = () => {
    if (!receiptBill) return;
    const phone = receiptBill.customerId
      ? state.customers.find((c) => c.id === receiptBill.customerId)?.phone ?? '03001234567'
      : '03001234567';
    const text = buildBillWhatsAppText(
      t('shopInfo'),
      receiptBill.billNumber,
      receiptBill.items.map((i) => ({ name: i.productName, qty: i.quantity, total: i.total })),
      receiptBill.total,
      receiptBill.paidAmount,
      receiptBill.total - receiptBill.paidAmount,
    );
    window.open(whatsappBillLink(phone, text), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('billing')}</h1>
        <div className="flex rounded-lg border border-[var(--color-border)] p-1 bg-[var(--color-surface)]">
          <button
            onClick={() => setTab('new')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              tab === 'new'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
            }`}
          >
            {t('newBill')}
          </button>
          <button
            onClick={() => setTab('records')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              tab === 'records'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
            }`}
          >
            {t('billRecords')} ({state.bills.length})
          </button>
        </div>
      </div>

      {tab === 'records' ? (
        <BillRecordsPanel />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-4">
            <SearchInput value={search} onChange={setSearch} placeholder={`${t('search')} — name, brand...`} />

            {searchResults.length > 0 && (
              <Card>
                <div className="space-y-2 -m-2">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-surface-elevated)] text-start transition-colors"
                    >
                      <div>
                        <p className="font-medium">{lang === 'ur' ? p.nameUrdu : p.name}</p>
                        {p.brand && (
                          <p className="text-xs text-[var(--color-text-muted)]">{p.brand}</p>
                        )}
                      </div>
                      <div className="text-end">
                        <p className="font-semibold">{formatPKR(p.salePrice)}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{t('stock')}: {p.quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <Card title={`${t('items')} (${cart.length})`} action={
              cart.length > 0 && <Button variant="ghost" size="sm" onClick={clearCart}>{t('clearCart')}</Button>
            }>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                  <p>{t('search')} {t('addToBill').toLowerCase()}</p>
                </div>
              ) : (
                <div className="space-y-3 -m-2">
                  {cart.map((item, index) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-elevated)]">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {item.brand ? `${item.brand} · ` : ''}{formatPKR(item.unitPrice)}
                        </p>
                      </div>
                      <QtyStepper
                        value={item.quantity}
                        max={item.maxQty}
                        onChange={(qty) => updateQty(item.productId, qty)}
                        onDecrementToZero={() => removeItem(item.productId)}
                      />
                      <p className="font-semibold w-24 text-end">{formatPKR(item.total)}</p>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => removeItem(item.productId)} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <Card title={t('createBill')}>
              <div className="space-y-4">
                <Select
                  label={t('selectCustomer')}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: '', label: t('walkIn') },
                    ...state.customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
                  ]}
                />
                <Input label={t('discount')} type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} />
                <Select
                  label={t('paymentMethod')}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  options={[
                    { value: 'cash', label: t('cash') },
                    { value: 'bank', label: t('bank') },
                    { value: 'credit', label: t('creditSale') },
                    { value: 'mixed', label: t('mixed') },
                  ]}
                />
                {paymentMethod !== 'credit' && (
                  <Input label={t('paid')} type="number" value={paidAmount || total} onChange={(e) => setPaidAmount(+e.target.value)} />
                )}
                <Input label={t('notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />

                <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
                  <div className="flex justify-between text-sm"><span>{t('subtotal')}</span><span>{formatPKR(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-sm text-red-500"><span>{t('discount')}</span><span>-{formatPKR(discount)}</span></div>}
                  <div className="flex justify-between text-lg font-bold"><span>{t('total')}</span><span>{formatPKR(total)}</span></div>
                  {paymentMethod !== 'credit' && total - (paidAmount || total) > 0 && (
                    <div className="flex justify-between text-sm text-amber-600"><span>{t('due')}</span><span>{formatPKR(total - (paidAmount || total))}</span></div>
                  )}
                </div>

                <Button className="w-full" size="lg" onClick={completeBill} disabled={cart.length === 0}>
                  {t('completeBill')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal open={showReceipt} onClose={() => setShowReceipt(false)} title={t('thermalReceipt')} size="sm">
        {receiptBill && (
          <>
            <ThermalReceipt bill={receiptBill} />
            <div className="flex gap-2 mt-4 justify-center no-print">
              <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>{t('printBill')}</Button>
              <Button variant="success" icon={<MessageCircle size={16} />} onClick={handleWhatsApp}>{t('shareWhatsApp')}</Button>
              <Button variant="secondary" onClick={() => { setShowReceipt(false); setTab('records'); }}>{t('billRecords')}</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
