import { useState, useMemo } from 'react';
import { Plus, Minus, Trash2, Printer, MessageCircle, ShoppingCart } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { Modal } from '../components/ui/Modal';
import { ThermalReceipt } from '../components/billing/ThermalReceipt';
import { BillRecordsPanel } from '../components/billing/BillRecordsPanel';
import { formatPKR, whatsappBillLink, buildBillWhatsAppText } from '../utils/format';
import type { Bill, BillItem } from '../types';

interface CartItem extends BillItem {
  maxQty: number;
}

type Tab = 'new' | 'records';

export function BillingPage() {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();

  const [tab, setTab] = useState<Tab>('new');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'credit' | 'mixed'>('cash');
  const [notes, setNotes] = useState('');
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return state.products.filter((p) =>
      p.quantity > 0 && (
        p.name.toLowerCase().includes(q) || p.nameUrdu.includes(q) ||
        p.partNumber.toLowerCase().includes(q) || p.companyNumber.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      ),
    ).slice(0, 8);
  }, [search, state.products]);

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - discount);

  const addToCart = (productId: string) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product || product.quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i,
        );
      }
      return [...prev, {
        productId: product.id,
        productName: lang === 'ur' ? product.nameUrdu : product.name,
        partNumber: product.partNumber,
        quantity: 1,
        unitPrice: product.salePrice,
        total: product.salePrice,
        maxQty: product.quantity,
      }];
    });
    setSearch('');
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.productId !== productId) return [i];
        const newQty = i.quantity + delta;
        if (newQty <= 0) return [];
        if (newQty > i.maxQty) return [i];
        return [{ ...i, quantity: newQty, total: newQty * i.unitPrice }];
      }),
    );
  };

  const completeBill = async () => {
    if (cart.length === 0) return;
    const customer = customerId ? state.customers.find((c) => c.id === customerId) : undefined;
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
      setCart([]);
      setCustomerId('');
      setDiscount(0);
      setPaidAmount(0);
      setNotes('');
    } catch {
      /* toast handled in store */
    }
  };

  const handlePrint = () => window.print();

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
            <SearchInput value={search} onChange={setSearch} placeholder={`${t('search')} — part no, company no, name...`} />

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
                        <p className="text-xs text-[var(--color-text-muted)]">{p.partNumber} · {p.companyNumber} · {p.brand}</p>
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
              cart.length > 0 && <Button variant="ghost" size="sm" onClick={() => setCart([])}>{t('clearCart')}</Button>
            }>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                  <p>{t('search')} {t('addToBill').toLowerCase()}</p>
                </div>
              ) : (
                <div className="space-y-3 -m-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-elevated)]">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{item.partNumber} · {formatPKR(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" icon={<Minus size={14} />} onClick={() => updateQty(item.productId, -1)} />
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => updateQty(item.productId, 1)} />
                      </div>
                      <p className="font-semibold w-24 text-end">{formatPKR(item.total)}</p>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => updateQty(item.productId, -999)} />
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
