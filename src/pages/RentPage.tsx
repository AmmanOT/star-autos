import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Receipt, Trash2 } from 'lucide-react';
import { ApiError, rentalsApi } from '../api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useToast } from '../contexts/ToastContext';
import type { RentBoard, RentUnitRow } from '../types';
import { formatDateShort, formatPKR, todayPkDateKey } from '../utils/format';

type Dialog = { type: 'property' } | { type: 'unit'; unit?: RentUnitRow } | { type: 'pay'; unit: RentUnitRow };

function currentMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date()).slice(0, 7);
}

function shiftMonth(month: string, delta: number) {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, mon - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string, lang: 'en' | 'ur') {
  const [year, mon] = month.split('-').map(Number);
  return new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const emptyUnit = (propertyId: string, month: string) => ({
  propertyId,
  kind: 'shop' as 'shop' | 'room',
  unitNo: '',
  monthlyRent: '5000',
  dueDay: '10',
  openingBalance: '0',
  startMonth: month,
});

export function RentPage() {
  const { t, lang } = useLanguage();
  const { isAdmin, isDemo, hasPermission } = useAuth();
  const { hideFinancials } = usePrivacy();
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth);
  const [board, setBoard] = useState<RentBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('all');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState('');
  const [unitForm, setUnitForm] = useState(emptyUnit('', currentMonth()));
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayPkDateKey());
  const [payNote, setPayNote] = useState('');
  const [saving, setSaving] = useState(false);

  const money = (value: number) => (hideFinancials ? '••••' : formatPKR(value));
  const canPay = !isDemo && (isAdmin || hasPermission('rent'));
  const canManage = isAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await rentalsApi.board(month));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not load rent');
    } finally {
      setLoading(false);
    }
  }, [month, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const units = useMemo(() => {
    const rows = board?.units ?? [];
    return propertyId === 'all' ? rows : rows.filter((unit) => unit.propertyId === propertyId);
  }, [board, propertyId]);

  const totals = useMemo(() => {
    return units.reduce(
      (sum, unit) => ({
        collected: sum.collected + unit.collected,
        remaining: sum.remaining + unit.remaining,
        monthRent: sum.monthRent + unit.monthRent,
      }),
      { collected: 0, remaining: 0, monthRent: 0 },
    );
  }, [units]);

  const historyUnit = board?.units.find((unit) => unit.id === historyId) ?? null;

  const openUnit = (unit?: RentUnitRow) => {
    const fallbackProperty = propertyId !== 'all' ? propertyId : board?.properties[0]?.id ?? '';
    setUnitForm(
      unit
        ? {
            propertyId: unit.propertyId,
            kind: unit.kind,
            unitNo: unit.unitNo,
            monthlyRent: String(unit.monthlyRent),
            dueDay: String(unit.dueDay),
            openingBalance: String(unit.openingBalance),
            startMonth: unit.startMonth,
          }
        : emptyUnit(fallbackProperty, month),
    );
    setDialog({ type: 'unit', unit });
  };

  const openPay = (unit: RentUnitRow) => {
    setPayAmount(unit.remaining > 0 ? String(unit.remaining) : '');
    setPayDate(todayPkDateKey());
    setPayNote('');
    setDialog({ type: 'pay', unit });
  };

  const saveProperty = async () => {
    const name = propertyName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await rentalsApi.addProperty(name);
      setPropertyName('');
      setDialog(null);
      toast.success(t('addProperty'));
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const saveUnit = async () => {
    if (dialog?.type !== 'unit') return;
    if (!unitForm.propertyId || !unitForm.unitNo.trim()) return;
    const body = {
      kind: unitForm.kind,
      unitNo: unitForm.unitNo.trim(),
      monthlyRent: Number(unitForm.monthlyRent) || 0,
      dueDay: Math.min(31, Math.max(1, Number(unitForm.dueDay) || 1)),
      openingBalance: Number(unitForm.openingBalance) || 0,
      startMonth: unitForm.startMonth || month,
    };
    setSaving(true);
    try {
      if (dialog.unit) await rentalsApi.updateUnit(dialog.unit.id, body);
      else await rentalsApi.addUnit({ ...body, propertyId: unitForm.propertyId });
      setDialog(null);
      toast.success(dialog.unit ? t('editUnit') : t('addShopOrRoom'));
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async () => {
    if (dialog?.type !== 'pay') return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0 || !payDate) return;
    setSaving(true);
    try {
      await rentalsApi.addPayment({
        unitId: dialog.unit.id,
        amount,
        paidOn: payDate,
        notes: payNote.trim() || undefined,
      });
      setDialog(null);
      toast.success(t('takePayment'));
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const removePayment = async (id: string, label: string) => {
    if (!window.confirm(`${t('delete')} ${label}?`)) return;
    try {
      await rentalsApi.removePayment(id);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete');
    }
  };

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-[var(--color-brand-600)] text-white'
        : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('rent')}</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">{t('rentHint')}</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => { setPropertyName(''); setDialog({ type: 'property' }); }}>
              {t('addProperty')}
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => openUnit()} disabled={!board?.properties.length}>
              {t('addShopOrRoom')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          <Button variant="ghost" size="sm" onClick={() => setMonth((value) => shiftMonth(value, -1))} icon={<ChevronLeft size={16} />} />
          <span className="min-w-40 px-2 text-center text-sm font-semibold">{monthLabel(month, lang)}</span>
          <Button variant="ghost" size="sm" onClick={() => setMonth((value) => shiftMonth(value, 1))} icon={<ChevronRight size={16} />} />
        </div>
        {month !== currentMonth() && (
          <Button variant="secondary" size="sm" onClick={() => setMonth(currentMonth())}>{t('thisMonth')}</Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">{t('collected')}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-950 dark:text-emerald-50">{money(totals.collected)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-amber-800 dark:text-amber-200">{t('stillLeft')}</p>
          <p className="mt-1 text-2xl font-bold text-amber-950 dark:text-amber-50">{money(totals.remaining)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-text-muted)]">{t('thisMonthRent')}</p>
          <p className="mt-1 text-2xl font-bold">{money(totals.monthRent)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPropertyId('all')} className={chip(propertyId === 'all')}>
          {t('allProperties')}
        </button>
        {(board?.properties ?? []).map((property) => (
          <button key={property.id} type="button" onClick={() => setPropertyId(property.id)} className={chip(propertyId === property.id)}>
            {property.name}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-[var(--color-text-muted)]">...</p>}
      {!loading && !board?.properties.length && (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
          {t('noPropertyYet')}
        </div>
      )}
      {!loading && !!board?.properties.length && !units.length && (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
          {t('noUnitsYet')}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {units.map((unit) => {
          const title = `${unit.kind === 'shop' ? t('rentShop') : t('rentRoom')} ${unit.unitNo}`;
          const settled = unit.remaining === 0 && unit.monthRent + Math.max(0, unit.broughtForward) > 0;
          return (
            <article key={unit.id} className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <Badge variant={unit.kind === 'shop' ? 'info' : 'default'}>
                      {unit.kind === 'shop' ? t('rentShop') : t('rentRoom')}
                    </Badge>
                    {unit.overdue && <Badge variant="warning">{t('dueNow')}</Badge>}
                    {settled && <Badge variant="success">{t('paidUp')}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {unit.propertyName} · {money(unit.monthlyRent)} · {t('payableOn')} {unit.dueDay}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-[var(--color-text-muted)]">{t('stillLeft')}</p>
                  <p className={`text-xl font-bold ${unit.remaining > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {money(unit.remaining)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[var(--color-surface-elevated)] p-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('broughtForward')}</p>
                  <p className="font-semibold">{money(unit.broughtForward)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('thisMonthRent')}</p>
                  <p className="font-semibold">{money(unit.monthRent)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('collected')}</p>
                  <p className="font-semibold">{money(unit.collected)}</p>
                </div>
              </div>
              {unit.credit > 0 && (
                <p className="mt-2 text-xs text-emerald-600">{t('extraPaid')} {money(unit.credit)}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {canPay && (
                  <Button size="sm" onClick={() => openPay(unit)}>{t('takePayment')}</Button>
                )}
                <Button size="sm" variant="secondary" icon={<Receipt size={14} />} onClick={() => setHistoryId(unit.id)}>
                  {t('viewPayments')} ({unit.payments.length})
                </Button>
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => openUnit(unit)}>{t('editUnit')}</Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={!!historyUnit}
        onClose={() => setHistoryId(null)}
        title={historyUnit ? `${historyUnit.kind === 'shop' ? t('rentShop') : t('rentRoom')} ${historyUnit.unitNo}` : t('viewPayments')}
      >
        {historyUnit && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {historyUnit.propertyName} · {monthLabel(month, lang)} · {t('collected')} {money(historyUnit.collected)}
            </p>
            {historyUnit.payments.length === 0 && (
              <p className="rounded-xl bg-[var(--color-surface-elevated)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
                {t('noPaymentsYet')}
              </p>
            )}
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {historyUnit.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5">
                  <div>
                    <p className="font-semibold">{money(payment.amount)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDateShort(payment.paidOn)}
                      {payment.notes ? ` · ${payment.notes}` : ''}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 size={14} />}
                      onClick={() => void removePayment(payment.id, money(payment.amount))}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal open={dialog?.type === 'property'} onClose={() => setDialog(null)} title={t('addProperty')}>
        <div className="space-y-3">
          <Input label={t('propertyName')} value={propertyName} onChange={(event) => setPropertyName(event.target.value)} placeholder="Amman Manzil" />
          <Button onClick={() => void saveProperty()} disabled={saving || !propertyName.trim()}>{t('save')}</Button>
        </div>
      </Modal>

      <Modal open={dialog?.type === 'unit'} onClose={() => setDialog(null)} title={dialog?.type === 'unit' && dialog.unit ? t('editUnit') : t('addShopOrRoom')}>
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--color-text-muted)]">{t('propertyName')}</span>
            <select
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
              value={unitForm.propertyId}
              onChange={(event) => setUnitForm((form) => ({ ...form, propertyId: event.target.value }))}
              disabled={dialog?.type === 'unit' && !!dialog.unit}
            >
              {(board?.properties ?? []).map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            {(['shop', 'room'] as const).map((kind) => (
              <Button key={kind} type="button" variant={unitForm.kind === kind ? 'primary' : 'secondary'} onClick={() => setUnitForm((form) => ({ ...form, kind }))}>
                {t(kind === 'shop' ? 'rentShop' : 'rentRoom')}
              </Button>
            ))}
          </div>
          <Input label={t('unitNumber')} value={unitForm.unitNo} onChange={(event) => setUnitForm((form) => ({ ...form, unitNo: event.target.value }))} />
          <Input label={t('monthlyRent')} type="number" min={0} value={unitForm.monthlyRent} onChange={(event) => setUnitForm((form) => ({ ...form, monthlyRent: event.target.value }))} />
          <Input label={t('payableOn')} type="number" min={1} max={31} value={unitForm.dueDay} onChange={(event) => setUnitForm((form) => ({ ...form, dueDay: event.target.value }))} />
          <Input label={t('alreadyOwed')} type="number" min={0} value={unitForm.openingBalance} onChange={(event) => setUnitForm((form) => ({ ...form, openingBalance: event.target.value }))} />
          <p className="text-xs text-[var(--color-text-muted)]">{t('alreadyOwedHint')}</p>
          <Input label={t('rentStarts')} type="month" value={unitForm.startMonth} onChange={(event) => setUnitForm((form) => ({ ...form, startMonth: event.target.value }))} />
          <Button onClick={() => void saveUnit()} disabled={saving || !unitForm.unitNo.trim() || !unitForm.propertyId}>{t('save')}</Button>
        </div>
      </Modal>

      <Modal open={dialog?.type === 'pay'} onClose={() => setDialog(null)} title={t('takePayment')}>
        {dialog?.type === 'pay' && (
          <div className="space-y-3">
            <p className="text-sm">
              {dialog.unit.kind === 'shop' ? t('rentShop') : t('rentRoom')} {dialog.unit.unitNo}
              {' · '}
              {t('stillLeft')} {money(dialog.unit.remaining)}
            </p>
            <Input label={t('amount')} type="number" min={1} value={payAmount} onChange={(event) => setPayAmount(event.target.value)} />
            <Input label={t('receivedOn')} type="date" value={payDate} onChange={(event) => setPayDate(event.target.value)} />
            <Input label={t('notes')} value={payNote} onChange={(event) => setPayNote(event.target.value)} />
            <Button onClick={() => void savePayment()} disabled={saving || Number(payAmount) <= 0}>{t('save')}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
