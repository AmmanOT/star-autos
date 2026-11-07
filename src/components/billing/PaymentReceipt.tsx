import type { Customer, Payment } from '../../types';
import { formatDate, formatPKR } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface PaymentReceiptProps {
  payment: Payment;
  customer: Customer;
}

/**
 * 80mm thermal payment slip — same width and print path as ThermalReceipt.
 */
export function PaymentReceipt({ payment, customer }: PaymentReceiptProps) {
  const { t, lang } = useLanguage();
  const { isDemo } = useAuth();
  const shopAddress = isDemo ? t('demoShopAddress') : t('shopAddress');
  const shopPhone = isDemo ? t('demoShopPhone') : t('shopPhone');
  const customerName = lang === 'ur' ? customer.nameUrdu || customer.name : customer.name;
  const typeLabel = payment.type === 'received' ? t('paymentReceived') : t('paymentPaid');

  return (
    <div
      className="thermal-receipt mx-auto bg-white text-black"
      style={{ width: '72.1mm', maxWidth: '72.1mm' }}
    >
      <div className="receipt-top-spacer" aria-hidden />

      <div className="receipt-header">
        <p className="font-bold tracking-[0.12em] text-[15px] uppercase leading-tight">
          {t('shopInfo')}
        </p>
        <p className="text-[11px] mt-1 tracking-wide">Auto Spare Parts</p>
        <p className="text-[11px] mt-2 leading-snug">{shopAddress}</p>
        <p className="text-[11px] font-bold mt-1">{shopPhone}</p>
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-meta">
        <div className="receipt-row">
          <span className="receipt-label">{t('paymentReceipt')}</span>
          <span className="receipt-value font-bold">{typeLabel}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{t('date')}</span>
          <span className="receipt-value">{formatDate(payment.createdAt)}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{t('customer')}</span>
          <span className="receipt-value font-bold">{customerName}</span>
        </div>
        {customer.phone ? (
          <div className="receipt-row">
            <span className="receipt-label">{t('phone')}</span>
            <span className="receipt-value">{customer.phone}</span>
          </div>
        ) : null}
        <div className="receipt-row">
          <span className="receipt-label">{t('method')}</span>
          <span className="receipt-value">{payment.method === 'cash' ? t('cash') : t('bank')}</span>
        </div>
        {payment.notes ? (
          <div className="receipt-row">
            <span className="receipt-label">{t('notes')}</span>
            <span className="receipt-value">{payment.notes}</span>
          </div>
        ) : null}
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-totals">
        <div className="receipt-row receipt-total-row">
          <span className="receipt-label font-bold text-[12px] uppercase">{typeLabel}</span>
          <span className="receipt-value font-bold text-[13px]">{formatPKR(payment.amount)}</span>
        </div>
        <div className="receipt-row receipt-total-row">
          <span className="receipt-label font-bold text-[12px] uppercase">{t('totalBalance')}</span>
          <span className="receipt-value font-bold text-[13px]">{formatPKR(customer.balance)}</span>
        </div>
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

      <div className="receipt-bottom-spacer" aria-hidden />
    </div>
  );
}
