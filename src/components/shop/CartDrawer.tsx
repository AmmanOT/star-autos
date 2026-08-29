import { X, Plus, Minus, MessageCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStore } from '../../contexts/StoreContext';
import { Button } from '../ui/Button';
import { formatPKR, whatsappBillLink } from '../../utils/format';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQty, removeItem, clearCart, totalAmount } = useCart();
  const { t, lang } = useLanguage();
  const { state } = useStore();

  if (!open) return null;

  const buildOrderMessage = () => {
    const lines = [
      `🛒 *${t('orderViaWhatsApp')}*`,
      `📍 ${t('shopInfo')}`,
      '---',
      ...items.map((i) => {
        const name = lang === 'ur' ? i.nameUrdu : i.name;
        return `${name} (${i.partNumber}) x${i.quantity} = Rs.${(i.quantity * i.unitPrice).toLocaleString()}`;
      }),
      '---',
      `*${t('total')}: Rs.${totalAmount.toLocaleString()}*`,
      '',
      t('orderNote'),
    ];
    return lines.join('\n');
  };

  const handleWhatsAppOrder = () => {
    window.open(whatsappBillLink(t('shopPhoneRaw'), buildOrderMessage()), '_blank');
  };

  const syncMaxQty = (productId: string) => {
    const product = state.products.find((p) => p.id === productId);
    return product?.quantity ?? 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-[var(--color-surface)] border-s border-[var(--color-border)] shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">{t('cart')} ({items.length})</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-elevated)]"><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--color-text-muted)]">
            <p className="mb-4">{t('cartEmpty')}</p>
            <Link to="/shop" onClick={onClose}>
              <Button>{t('browseShop')}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => {
                const maxQty = syncMaxQty(item.productId);
                return (
                  <div key={item.productId} className="flex gap-3 p-3 rounded-xl bg-[var(--color-surface-elevated)]">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lang === 'ur' ? item.nameUrdu : item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.partNumber}</p>
                      <p className="text-sm font-semibold mt-1">{formatPKR(item.unitPrice)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeItem(item.productId)} className="text-[var(--color-text-muted)] hover:text-red-500"><Trash2 size={14} /></button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 rounded border border-[var(--color-border)] flex items-center justify-center"><Minus size={12} /></button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, Math.min(maxQty, item.quantity + 1))} className="w-7 h-7 rounded border border-[var(--color-border)] flex items-center justify-center" disabled={item.quantity >= maxQty}><Plus size={12} /></button>
                      </div>
                      <p className="text-sm font-bold">{formatPKR(item.quantity * item.unitPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-[var(--color-border)] space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>{t('total')}</span>
                <span>{formatPKR(totalAmount)}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{t('codNote')}</p>
              <Button className="w-full" size="lg" icon={<MessageCircle size={18} />} onClick={handleWhatsAppOrder}>
                {t('orderViaWhatsApp')}
              </Button>
              <Button variant="ghost" className="w-full" onClick={clearCart}>{t('clearCart')}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
