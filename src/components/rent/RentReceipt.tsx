import { formatDateShort, formatPKR } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface RentReceiptProps {
  propertyName: string;
  unitKind: string;
  unitNo: string;
  paidOn: string;
  amount: number;
  remaining: number;
  notes?: string | null;
}

/** 80mm rent slip. It is not a shop bill and does not change the customer ledger. */
export function RentReceipt({ propertyName, unitKind, unitNo, paidOn, amount, remaining, notes }: RentReceiptProps) {
  const { t } = useLanguage();
  const { isDemo } = useAuth();
  const shopAddress = isDemo ? t('demoShopAddress') : t('shopAddress');
  const shopPhone = isDemo ? t('demoShopPhone') : t('shopPhone');

  return (
    <div
      className="thermal-receipt mx-auto bg-white text-black"
      style={{ width: '72.1mm', maxWidth: '72.1mm' }}
    >
      <div className="receipt-top-spacer" aria-hidden />

      <div className="receipt-header">
        <p className="font-bold tracking-[0.12em] text-[15px] uppercase leading-tight">{t('shopInfo')}</p>
        <p className="text-[11px] mt-1 tracking-wide">Auto Spare Parts</p>
        <p className="text-[11px] mt-2 leading-snug">{shopAddress}</p>
        <p className="text-[11px] font-bold mt-1">{shopPhone}</p>
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-meta">
        <div className="receipt-row">
          <span className="receipt-label">{t('rentReceipt')}</span>
          <span className="receipt-value font-bold">{t('rent')}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{t('date')}</span>
          <span className="receipt-value">{formatDateShort(paidOn)}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{t('propertyName')}</span>
          <span className="receipt-value font-bold">{propertyName}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">{unitKind}</span>
          <span className="receipt-value font-bold">{unitNo}</span>
        </div>
        {notes ? (
          <div className="receipt-row">
            <span className="receipt-label">{t('notes')}</span>
            <span className="receipt-value">{notes}</span>
          </div>
        ) : null}
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-totals">
        <div className="receipt-row receipt-total-row">
          <span className="receipt-label font-bold text-[12px] uppercase">{t('amount')}</span>
          <span className="receipt-value font-bold text-[13px]">{formatPKR(amount)}</span>
        </div>
        <div className="receipt-row receipt-total-row">
          <span className="receipt-label font-bold text-[12px] uppercase">{t('totalBalance')}</span>
          <span className="receipt-value font-bold text-[13px]">{formatPKR(remaining)}</span>
        </div>
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-thanks">
        <p className="text-[12px] font-bold py-2 px-2">شکریہ — Thank You!</p>
        <p className="text-[11px] px-2 pb-2">Please visit again</p>
      </div>

      <div className="receipt-rule mx-2" />

      <div className="receipt-footer px-2 pt-2 pb-4">
        <p className="text-[10px] font-bold tracking-[0.06em] uppercase">Software by AS CodeWorks</p>
        <p className="text-[10px] mt-0.5">© Provided for Madina Traders</p>
        <p className="text-[10px]">Contact: 0325-9055292</p>
      </div>

      <div className="receipt-bottom-spacer" aria-hidden />
    </div>
  );
}
