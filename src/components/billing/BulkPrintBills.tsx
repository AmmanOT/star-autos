import { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import type { Bill } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ThermalReceipt } from './ThermalReceipt';
import { pkDateKey, todayPkDateKey } from '../../utils/format';
import { printThermalReceipts } from '../../utils/printReceipt';

function billsForCustomerDate(bills: Bill[], customerId: string, dateKey: string) {
  return bills
    .filter((b) => {
      const matchCustomer =
        customerId === 'walkin' ? !b.customerId : b.customerId === customerId;
      return matchCustomer && pkDateKey(b.createdAt) === dateKey;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function BulkPrintBillsButton({
  defaultCustomerId = '',
}: {
  defaultCustomerId?: string;
}) {
  const { state } = useStore();
  const { t } = useLanguage();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [date, setDate] = useState(todayPkDateKey);
  const [printQueue, setPrintQueue] = useState<Bill[] | null>(null);

  useEffect(() => {
    if (open) setCustomerId(defaultCustomerId);
  }, [open, defaultCustomerId]);

  const matches = useMemo(
    () => (customerId && date ? billsForCustomerDate(state.bills, customerId, date) : []),
    [state.bills, customerId, date],
  );

  useEffect(() => {
    if (!printQueue?.length) return;
    const timer = window.setTimeout(() => {
      const nodes = [...document.querySelectorAll('#bulk-print-root .thermal-receipt')];
      if (nodes.length > 0) printThermalReceipts(nodes);
      else toast.error(t('noBillsToPrint'));
      setPrintQueue(null);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [printQueue, t, toast]);

  const handlePrint = () => {
    if (!customerId || !date) return;
    if (matches.length === 0) {
      toast.error(t('noBillsToPrint'));
      return;
    }
    setPrintQueue(matches);
  };

  return (
    <>
      <Button variant="secondary" icon={<Printer size={16} />} onClick={() => setOpen(true)}>
        {t('printBulk')}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('printBulkTitle')} size="md">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('printBulkHint')}</p>
        <div className="space-y-4">
          <Select
            label={t('customer')}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={[
              { value: '', label: t('customer') },
              { value: 'walkin', label: t('walkIn') },
              ...state.customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
            ]}
          />
          <Input
            label={t('date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="text-sm text-[var(--color-text-muted)]">
            {customerId && date
              ? t('printBulkCount').replace('{n}', String(matches.length))
              : t('printBulkHint')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button
              icon={<Printer size={16} />}
              onClick={handlePrint}
              disabled={!customerId || !date || matches.length === 0}
            >
              {t('printBulkCount').replace('{n}', String(matches.length))}
            </Button>
          </div>
        </div>
      </Modal>

      {printQueue && printQueue.length > 0 && (
        <div id="bulk-print-root" className="fixed left-[-9999px] top-0" aria-hidden>
          {printQueue.map((bill) => (
            <ThermalReceipt key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </>
  );
}
