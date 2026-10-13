import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { billsApi } from '../../api';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import type { Bill } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ThermalReceipt } from './ThermalReceipt';
import { todayPkDateKey } from '../../utils/format';
import { printThermalReceipts } from '../../utils/printReceipt';

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
  const [matches, setMatches] = useState<Bill[]>([]);

  useEffect(() => {
    if (open) setCustomerId(defaultCustomerId);
  }, [open, defaultCustomerId]);

  useEffect(() => {
    if (!open || !customerId || !date) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    void billsApi
      .list({ customerId, from: date, to: date, page: 1, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setMatches(
          [...res.items].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId, date]);

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
          {printQueue.map((bill, i) => (
            <ThermalReceipt
              key={bill.id}
              bill={bill}
              continuation={i > 0}
              showClosing={i === printQueue.length - 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
