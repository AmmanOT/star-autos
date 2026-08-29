import { Link } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import type { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { categoryLabel } from '../../i18n/translations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPKR } from '../../utils/format';

const CATEGORY_ICONS: Record<string, string> = {
  ring: '⭕', piston: '🔩', bearing: '⚙️', oil: '🛢️', filter: '🔲',
  gasket: '📋', clutch: '🔧', brake: '🛑', spark_plug: '⚡', belt: '🔗', shock: '💨', other: '📦',
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const inStock = product.quantity > 0;
  const icon = CATEGORY_ICONS[product.category] ?? '📦';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      nameUrdu: product.nameUrdu,
      partNumber: product.partNumber,
      unitPrice: product.salePrice,
      maxQty: product.quantity,
    });
  };

  return (
    <Link to={`/shop/${product.id}`} className="group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all">
      <div className="aspect-[4/3] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900 flex items-center justify-center relative">
        <span className="text-5xl opacity-80">{icon}</span>
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="danger">{t('outOfStock')}</Badge>
          </div>
        )}
        <div className="absolute top-3 start-3">
          <Badge variant="info">{categoryLabel(lang, product.category)}</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-brand-600 transition-colors">
          {lang === 'ur' ? product.nameUrdu : product.name}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">{product.partNumber}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{product.brand} · {product.vehicleModels.slice(0, 2).join(', ')}</p>
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="text-lg font-bold text-brand-600">{formatPKR(product.salePrice)}</span>
          {inStock ? (
            <Button size="sm" icon={<ShoppingCart size={14} />} onClick={handleAdd}>{t('addToCart')}</Button>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">{t('outOfStock')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardCompact({ product, added }: { product: Product; added?: boolean }) {
  const { lang } = useLanguage();
  return (
    <Link to={`/shop/${product.id}`} className="flex gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-brand-300 transition-colors">
      <div className="w-16 h-16 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-2xl shrink-0">
        {CATEGORY_ICONS[product.category] ?? '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{lang === 'ur' ? product.nameUrdu : product.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{formatPKR(product.salePrice)}</p>
        {added && <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1"><Check size={12} /> Added</span>}
      </div>
    </Link>
  );
}
