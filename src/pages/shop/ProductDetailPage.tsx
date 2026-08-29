import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, MessageCircle, Check, Package } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { categoryLabel } from '../../i18n/translations';
import { ProductCard } from '../../components/shop/ProductCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPKR, whatsappBillLink } from '../../utils/format';

export function ProductDetailPage() {
  const { productId } = useParams();
  const { state } = useStore();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const product = state.products.find((p) => p.id === productId);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-lg text-[var(--color-text-muted)]">{t('noResults')}</p>
        <Link to="/shop" className="text-brand-600 mt-4 inline-block">{t('browseShop')}</Link>
      </div>
    );
  }

  const inStock = product.quantity > 0;
  const related = state.products.filter((p) => p.id !== product.id && p.category === product.category && p.quantity > 0).slice(0, 4);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      nameUrdu: product.nameUrdu,
      partNumber: product.partNumber,
      unitPrice: product.salePrice,
      maxQty: product.quantity,
      quantity: qty,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleWhatsApp = () => {
    const name = lang === 'ur' ? product.nameUrdu : product.name;
    const text = [
      `🔧 *${t('productInquiry')}*`,
      name,
      `${t('partNumber')}: ${product.partNumber}`,
      `${t('price')}: Rs.${product.salePrice.toLocaleString()}`,
      `${t('quantity')}: ${qty}`,
      '',
      t('orderNote'),
    ].join('\n');
    window.open(whatsappBillLink(t('shopPhoneRaw'), text), '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-brand-600 mb-6">
        <ArrowLeft size={16} /> {t('backToShop')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square max-h-[480px] rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900 flex items-center justify-center border border-[var(--color-border)]">
          <Package size={120} className="text-brand-300 dark:text-brand-700" />
        </div>

        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="info">{categoryLabel(lang, product.category)}</Badge>
            <Badge>{product.brand}</Badge>
            {inStock ? <Badge variant="success">{t('inStockNow')} ({product.quantity})</Badge> : <Badge variant="danger">{t('outOfStock')}</Badge>}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold">{lang === 'ur' ? product.nameUrdu : product.name}</h1>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex gap-2"><span className="text-[var(--color-text-muted)] w-28">{t('partNumber')}</span><span className="font-mono font-medium">{product.partNumber}</span></div>
            <div className="flex gap-2"><span className="text-[var(--color-text-muted)] w-28">{t('companyNumber')}</span><span className="font-mono">{product.companyNumber}</span></div>
            <div className="flex gap-2"><span className="text-[var(--color-text-muted)] w-28">{t('vehicle')}</span><span>{product.vehicleModels.join(', ')}</span></div>
            {product.location && <div className="flex gap-2"><span className="text-[var(--color-text-muted)] w-28">{t('location')}</span><span>{product.location}</span></div>}
          </div>

          <p className="text-3xl font-bold text-brand-600 mt-6">{formatPKR(product.salePrice)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('priceNote')}</p>

          {inStock && (
            <div className="flex items-center gap-3 mt-6">
              <span className="text-sm text-[var(--color-text-muted)]">{t('quantity')}</span>
              <div className="flex items-center border border-[var(--color-border)] rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-[var(--color-surface-elevated)]">−</button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(product.quantity, qty + 1))} className="px-3 py-2 hover:bg-[var(--color-surface-elevated)]">+</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-8">
            {inStock && (
              <Button size="lg" icon={justAdded ? <Check size={18} /> : <ShoppingCart size={18} />} onClick={handleAdd} disabled={justAdded}>
                {justAdded ? t('addedToCart') : t('addToCart')}
              </Button>
            )}
            <Button size="lg" variant="success" icon={<MessageCircle size={18} />} onClick={handleWhatsApp}>
              {t('inquireWhatsApp')}
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">{t('relatedParts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
