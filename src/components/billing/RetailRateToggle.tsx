import { formatPKR } from '../../utils/format';
import { useLanguage } from '../../contexts/LanguageContext';

export function RetailRateToggle({
  retail,
  salePrice,
  unitPrice,
  onApply,
}: {
  retail: number;
  salePrice: number;
  unitPrice: number;
  onApply: (price: number) => void;
}) {
  const { t } = useLanguage();
  if (!(retail > 0)) return null;
  const usingRetail = Math.abs(Number(unitPrice) - Number(retail)) < 0.005;

  return (
    <label
      className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="rounded border-[var(--color-border)] accent-brand-600"
        checked={usingRetail}
        onChange={() => onApply(usingRetail ? salePrice : retail)}
      />
      <span>
        {t('useRetail')} {formatPKR(retail)}
      </span>
    </label>
  );
}
