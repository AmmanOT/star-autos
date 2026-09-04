import type { Bill } from '../../types';
import { formatDate, formatPKR } from '../../utils/format';
import { useLanguage } from '../../contexts/LanguageContext';

interface ThermalReceiptProps {
  bill: Bill;
}

/**
 * 80mm thermal receipt — high-contrast black/white for ESC/POS printers.
 * Extra top padding avoids cutter / head clipping.
 */
export function ThermalReceipt({ bill }: ThermalReceiptProps) {
  const { t } = useLanguage();
  const due = bill.total - bill.paidAmount;

  return (
    <div
      className="thermal-receipt mx-auto bg-white text-black"
      style={{ width: '80mm', maxWidth: '80mm' }}
    >
      {/* Safe top margin for thermal head / auto-cutter */}
      <div className="receipt-top-spacer" aria-hidden />

      <div className="text-center px-3 pb-2">
        <p className="font-bold tracking-[0.14em] text-[15px] uppercase leading-tight">
          {t('shopInfo')}
        </p>
        <p className="text-[10px] mt-1 tracking-wide">
          Auto Spare Parts
        </p>
        <p className="text-[10px] mt-2 leading-snug">{t('shopAddress')}</p>
        <p className="text-[11px] font-bold mt-1">{t('shopPhone')}</p>
      </div>

      <div className="receipt-rule mx-3" />

      <div className="px-3 py-2 space-y-1 text-[11px]">
        <div className="flex justify-between gap-2">
          <span>{t('billNumber')}</span>
          <span className="font-bold">{bill.billNumber}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>{t('date')}</span>
          <span>{formatDate(bill.createdAt)}</span>
        </div>
        {bill.customerName && (
          <div className="flex justify-between gap-2">
            <span>{t('customer')}</span>
            <span className="font-bold text-end">{bill.customerName}</span>
          </div>
        )}
      </div>

      <div className="receipt-rule mx-3" />

      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>
            <th className="text-start font-bold py-1.5 ps-3 pe-1 border-b border-black">
              {t('items')}
            </th>
            <th className="text-center font-bold py-1.5 w-9 border-b border-black">
              {t('quantity')}
            </th>
            <th className="text-end font-bold py-1.5 pe-3 ps-1 border-b border-black">
              {t('total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, i) => (
            <tr key={i} className="align-top">
              <td className="py-1.5 ps-3 pe-1">
                <div className="font-bold leading-snug">{item.productName}</div>
                {item.partNumber ? (
                  <div className="text-[9px]">#{item.partNumber}</div>
                ) : null}
                <div className="text-[9px]">
                  {item.quantity} x {formatPKR(item.unitPrice)}
                </div>
              </td>
              <td className="text-center py-1.5">{item.quantity}</td>
              <td className="text-end py-1.5 pe-3 font-bold whitespace-nowrap">
                {formatPKR(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-rule mx-3" />

      <div className="px-3 py-2 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>{t('subtotal')}</span>
          <span>{formatPKR(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="flex justify-between">
            <span>{t('discount')}</span>
            <span>-{formatPKR(bill.discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline border-t border-black pt-1.5 mt-1">
          <span className="font-bold text-[12px] uppercase">{t('total')}</span>
          <span className="font-bold text-[13px]">{formatPKR(bill.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('paid')}</span>
          <span className="font-bold">{formatPKR(bill.paidAmount)}</span>
        </div>
        {due > 0 && (
          <div className="flex justify-between font-bold text-[12px]">
            <span>{t('due')}</span>
            <span>{formatPKR(due)}</span>
          </div>
        )}
      </div>

      <div className="receipt-rule mx-3" />

      <p className="text-center text-[11px] font-bold py-2 px-3">شکریہ — Thank You!</p>
      <p className="text-center text-[9px] px-3 pb-2">Please visit again</p>

      <div className="receipt-rule mx-3" />

      <div className="px-3 pt-2 pb-4 text-center">
        <p className="text-[9px] font-bold tracking-[0.08em] uppercase">
          Software by AS CodeWorks
        </p>
        <p className="text-[8px] mt-0.5">© Provided for Madina Traders</p>
        <p className="text-[8px]">Contact: 0325-9055292</p>
      </div>

      {/* Bottom feed for thermal cutter */}
      <div className="receipt-bottom-spacer" aria-hidden />
    </div>
  );
}
