import type { Bill } from '../../types';
import { formatDate, formatPKR } from '../../utils/format';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStore } from '../../contexts/StoreContext';

interface ThermalReceiptProps {
  bill: Bill;
}

/**
 * 80mm thermal roll, 72.1mm printable width (Printer 80(72.1) x 210 mm).
 * Headings stay bold; body copy is medium so it is readable without flooding ink.
 */
export function ThermalReceipt({ bill }: ThermalReceiptProps) {
  const { t } = useLanguage();
  const { state } = useStore();
  const due = bill.total - bill.paidAmount;

  const itemBrand = (productId: string, saved?: string) =>
    saved || state.products.find((p) => p.id === productId)?.brand || '—';

  return (
    <div
      className="thermal-receipt mx-auto bg-white text-black"
      style={{ width: '72.1mm', maxWidth: '72.1mm' }}
    >
      {/* Safe top margin for thermal head / auto-cutter */}
      <div className="receipt-top-spacer" aria-hidden />

      <div className="receipt-header">
        <p className="font-bold tracking-[0.12em] text-[15px] uppercase leading-tight">
          {t('shopInfo')}
        </p>
        <p className="text-[11px] mt-1 tracking-wide">
          Auto Spare Parts
        </p>
        <p className="text-[11px] mt-2 leading-snug">{t('shopAddress')}</p>
        <p className="text-[11px] font-bold mt-1">{t('shopPhone')}</p>
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-meta">
        <div className="receipt-row">
          <span className="receipt-label">{t('billNumber')}</span>
          <span className="receipt-value font-bold">{bill.billNumber}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{t('date')}</span>
          <span className="receipt-value">{formatDate(bill.createdAt)}</span>
        </div>
        {bill.customerName && (
          <div className="receipt-row">
            <span className="receipt-label">{t('customer')}</span>
            <span className="receipt-value font-bold">{bill.customerName}</span>
          </div>
        )}
      </div>

      <div className="receipt-rule mx-2" />

      <table className="receipt-grid">
        <thead>
          <tr>
            <th className="col-item">{t('items')}</th>
            <th className="col-brand">{t('brand')}</th>
            <th className="col-qty">{t('quantity')}</th>
            <th className="col-rate">{t('rate')}</th>
            <th className="col-amt">{t('total')}</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, i) => (
            <tr key={i}>
              <td className="col-item leading-snug">{item.productName}</td>
              <td className="col-brand">{itemBrand(item.productId, item.brand)}</td>
              <td className="col-qty">{item.quantity}</td>
              <td className="col-rate">{item.unitPrice.toLocaleString('en-PK')}</td>
              <td className="col-amt">{item.total.toLocaleString('en-PK')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-rule mx-2" />

      <div className="receipt-totals">
        <div className="receipt-row">
          <span className="receipt-label">{t('subtotal')}</span>
          <span className="receipt-value">{formatPKR(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="receipt-row">
            <span className="receipt-label">{t('discount')}</span>
            <span className="receipt-value">-{formatPKR(bill.discount)}</span>
          </div>
        )}
        <div className="receipt-row receipt-total-row">
          <span className="receipt-label font-bold text-[12px] uppercase">{t('total')}</span>
          <span className="receipt-value font-bold text-[13px]">{formatPKR(bill.total)}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{t('paid')}</span>
          <span className="receipt-value font-bold">{formatPKR(bill.paidAmount)}</span>
        </div>
        {due > 0 && (
          <div className="receipt-row font-bold text-[12px]">
            <span className="receipt-label">{t('due')}</span>
            <span className="receipt-value">{formatPKR(due)}</span>
          </div>
        )}
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-thanks">
        <p className="text-[12px] font-bold py-2 px-2">شکریہ — Thank You!</p>
        <p className="text-[11px] px-2 pb-2">Please visit again</p>
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-footer px-2 pt-2 pb-4">
        <p className="text-[10px] font-bold tracking-[0.06em] uppercase">
          Software by AS CodeWorks
        </p>
        <p className="text-[10px] mt-0.5">© Provided for Madina Traders</p>
        <p className="text-[10px]">Contact: 0325-9055292</p>
      </div>

      {/* Bottom feed for thermal cutter */}
      <div className="receipt-bottom-spacer" aria-hidden />
    </div>
  );
}
