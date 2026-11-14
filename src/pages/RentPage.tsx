import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { ApiError, rentalsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useToast } from '../contexts/ToastContext';
import type { RentBoard, RentBoardRow, RentalProperty, RentalUnit } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { formatPKR, todayPkDateKey } from '../utils/format';
import { matchesSearch } from '../utils/search';

type PlaceForm = {
  id?: string;
  propertyId: string;
  name: string;
  kind: 'room' | 'shop';
  monthlyRent: string;
  dueDay: string;
  tenantName: string;
  tenantPhone: string;
  occupied: boolean;
  openingBalance: string;
  startMonth: string;
  notes: string;
};

type PropertyForm = { id?: string; name: string; address: string; notes: string };

function currentPeriod(): string {
  return todayPkDateKey().slice(0, 7);
}

function shiftMonth(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(period: string, lang: 'en' | 'ur'): string {
  const [year, month] = period.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function prettyDate(iso: string, lang: 'en' | 'ur'): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function shortMonth(period: string, lang: 'en' | 'ur'): string {
  const [year, month] = period.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    month: 'short',
    timeZone: 'UTC',
  });
}

function dayLabel(day: number, lang: 'en' | 'ur'): string {
  if (lang === 'ur') return String(day);
  const teen = day % 100;
  const suffix =
    teen >= 11 && teen <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] || 'th';
  return `${day}${suffix}`;
}

function errorText(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong';
}

const emptyPlace = (propertyId: string): PlaceForm => ({
  propertyId,
  name: '',
  kind: 'room',
  monthlyRent: '',
  dueDay: '5',
  tenantName: '',
  tenantPhone: '',
  occupied: true,
  openingBalance: '',
  startMonth: currentPeriod(),
  notes: '',
});

export function RentPage() {
  const { t, lang } = useLanguage();
  const { isAdmin, isDemo, hasPermission } = useAuth();
  const { hideFinancials } = usePrivacy();
  const toast = useToast();
  const canWrite = !isDemo && hasPermission('rent');
  const canDelete = canWrite && hasPermission('delete');
  const mask = (isAdmin || isDemo) && hideFinancials;
  const money = (amount: number) => (mask ? '••••' : formatPKR(amount));

  const [month, setMonth] = useState(currentPeriod);
  const [tab, setTab] = useState<'collect' | 'places'>('collect');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const [board, setBoard] = useState<RentBoard | null>(null);
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [propertyForm, setPropertyForm] = useState<PropertyForm | null>(null);
  const [placeForm, setPlaceForm] = useState<PlaceForm | null>(null);
  const [collecting, setCollecting] = useState<RentBoardRow | null>(null);
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayPkDateKey);
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [collectNotes, setCollectNotes] = useState('');
  const [chargeFor, setChargeFor] = useState<RentBoardRow | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeOn, setChargeOn] = useState(todayPkDateKey);
  const [chargeNote, setChargeNote] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [nextBoard, nextProperties] = await Promise.all([
        rentalsApi.board(month),
        rentalsApi.properties(),
      ]);
      setBoard(nextBoard);
      setProperties(nextProperties);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const rows = useMemo(() => {
    return (board?.rows ?? []).filter((row) => {
      if (propertyFilter !== 'all' && row.propertyId !== propertyFilter) return false;
      if (statusFilter === 'due' && !(row.remaining > 0)) return false;
      if (statusFilter === 'paid' && row.status !== 'paid') return false;
      return matchesSearch(search, row.propertyName, row.unitName, row.tenantName, row.kind);
    });
  }, [board, propertyFilter, statusFilter, search]);

  const totals = useMemo(() => {
    return rows.reduce(
      (sum, row) => ({
        broughtForward: sum.broughtForward + Math.max(0, row.broughtForward),
        monthRent: sum.monthRent + row.monthRent,
        extras: sum.extras + row.extras,
        collected: sum.collected + row.collected,
        remaining: sum.remaining + row.remaining,
      }),
      { broughtForward: 0, monthRent: 0, extras: 0, collected: 0, remaining: 0 },
    );
  }, [rows]);

  const yearStats = useMemo(() => {
    const map = new Map<string, { collected: number; remaining: number }>();
    for (const row of rows) {
      for (const cell of row.year ?? []) {
        const current = map.get(cell.month) ?? { collected: 0, remaining: 0 };
        current.collected += cell.collected;
        current.remaining += cell.remaining;
        map.set(cell.month, current);
      }
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const openCollect = (row: RentBoardRow) => {
    setCollecting(row);
    setAmount(row.remaining > 0 ? String(row.remaining) : '');
    setPaidOn(todayPkDateKey());
    setMethod('cash');
    setCollectNotes('');
  };

  const openPlace = (propertyId: string, unit?: RentalUnit) => {
    if (!unit) {
      setPlaceForm(emptyPlace(propertyId));
      return;
    }
    setPlaceForm({
      id: unit.id,
      propertyId: unit.propertyId,
      name: unit.name,
      kind: unit.kind,
      monthlyRent: String(unit.monthlyRent),
      dueDay: String(unit.dueDay),
      tenantName: unit.tenantName ?? '',
      tenantPhone: unit.tenantPhone ?? '',
      occupied: unit.occupied,
      openingBalance: unit.openingBalance ? String(unit.openingBalance) : '',
      startMonth: unit.startMonth || currentPeriod(),
      notes: unit.notes ?? '',
    });
  };

  const openCharge = (row: RentBoardRow) => {
    setChargeFor(row);
    setChargeAmount('');
    setChargeOn(todayPkDateKey());
    setChargeNote('');
  };

  const saveProperty = async () => {
    if (!propertyForm) return;
    const name = propertyForm.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      const body = {
        name,
        address: propertyForm.address.trim(),
        notes: propertyForm.notes.trim(),
      };
      if (propertyForm.id) await rentalsApi.updateProperty(propertyForm.id, body);
      else await rentalsApi.createProperty(body);
      setPropertyForm(null);
      toast.success(t('propertySaved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const savePlace = async () => {
    if (!placeForm) return;
    const name = placeForm.name.trim();
    const monthlyRent = Number(placeForm.monthlyRent);
    const dueDay = Number(placeForm.dueDay);
    const openingBalance = placeForm.openingBalance.trim() === '' ? 0 : Number(placeForm.openingBalance);
    if (!name || !placeForm.propertyId || !Number.isFinite(monthlyRent) || monthlyRent < 0) return;
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return;
    if (!Number.isFinite(openingBalance) || openingBalance < 0) return;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(placeForm.startMonth)) return;
    setSaving(true);
    try {
      const body = {
        name,
        kind: placeForm.kind,
        monthlyRent,
        dueDay,
        tenantName: placeForm.tenantName.trim(),
        tenantPhone: placeForm.tenantPhone.trim(),
        occupied: placeForm.occupied,
        openingBalance,
        startMonth: placeForm.startMonth,
        notes: placeForm.notes.trim(),
      };
      if (placeForm.id) await rentalsApi.updateUnit(placeForm.id, body);
      else await rentalsApi.createUnit({ ...body, propertyId: placeForm.propertyId });
      setPlaceForm(null);
      toast.success(t('placeSaved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const saveCollection = async () => {
    if (!collecting) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !paidOn) return;
    setSaving(true);
    try {
      await rentalsApi.collect({
        unitId: collecting.unitId,
        period: month,
        amount: value,
        paidOn,
        method,
        notes: collectNotes.trim(),
      });
      setCollecting(null);
      toast.success(t('rentSaved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const saveCharge = async () => {
    if (!chargeFor) return;
    const value = Number(chargeAmount);
    if (!Number.isFinite(value) || value <= 0 || !chargeOn || !chargeNote.trim()) return;
    setSaving(true);
    try {
      await rentalsApi.addCharge({
        unitId: chargeFor.unitId,
        amount: value,
        chargedOn: chargeOn,
        description: chargeNote.trim(),
      });
      setChargeFor(null);
      toast.success(t('chargeSaved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const removeCharge = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await rentalsApi.removeCharge(id);
      toast.success(t('rentRemoved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const removeProperty = async (property: RentalProperty) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await rentalsApi.removeProperty(property.id);
      if (propertyFilter === property.id) setPropertyFilter('all');
      toast.success(t('rentRemoved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const removePlace = async (unit: RentalUnit) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await rentalsApi.removeUnit(unit.id);
      toast.success(t('rentRemoved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const removePayment = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await rentalsApi.removeCollection(id);
      toast.success(t('rentRemoved'));
      await load();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const statusBadge = (row: RentBoardRow) => (
    <>
      {!row.occupied && <Badge variant="info">{t('rentVacant')}</Badge>}
      {row.occupied && row.status === 'paid' && <Badge variant="success">{t('rentPaidStatus')}</Badge>}
      {row.occupied && row.status === 'partial' && <Badge variant="warning">{t('rentPartial')}</Badge>}
      {row.occupied && row.status === 'unpaid' && !row.overdue && <Badge>{t('rentUnpaid')}</Badge>}
      {row.overdue && <Badge variant="danger">{t('rentOverdue')}</Badge>}
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('rent')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-3xl">{t('rentHint')}</p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setPropertyForm({ name: '', address: '', notes: '' })}>
              {t('addProperty')}
            </Button>
            <Button
              icon={<Plus size={16} />}
              disabled={properties.length === 0}
              onClick={() => openPlace(propertyFilter !== 'all' ? propertyFilter : properties[0]?.id ?? '')}
            >
              {t('addPlace')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<ChevronLeft size={16} />} onClick={() => setMonth((value) => shiftMonth(value, -1))} aria-label="Previous month" />
          <div className="min-w-40 text-center font-semibold">{monthLabel(month, lang)}</div>
          <Button variant="secondary" size="sm" icon={<ChevronRight size={16} />} onClick={() => setMonth((value) => shiftMonth(value, 1))} aria-label="Next month" />
          {month !== currentPeriod() && (
            <Button variant="ghost" size="sm" onClick={() => setMonth(currentPeriod())}>
              {monthLabel(currentPeriod(), lang)}
            </Button>
          )}
        </div>
        <div className="flex rounded-lg border border-[var(--color-border)] p-1 w-fit">
          {(['collect', 'places'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-sm rounded-md ${tab === key ? 'bg-brand-50 text-brand-700 dark:bg-brand-800/50 dark:text-brand-300 font-medium' : 'text-[var(--color-text-muted)]'}`}
            >
              {key === 'collect' ? t('rentCollectTab') : t('rentPlacesTab')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {tab === 'collect' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label={t('broughtForward')} value={money(totals.broughtForward)} icon={<Building2 size={18} />} />
            <StatCard label={t('thisMonthRent')} value={money(totals.monthRent)} icon={<Building2 size={18} />} />
            <StatCard label={t('extraCharges')} value={money(totals.extras)} icon={<Building2 size={18} />} />
            <StatCard label={t('collectedRent')} value={money(totals.collected)} icon={<Building2 size={18} />} />
            <StatCard label={t('rentLeft')} value={money(totals.remaining)} icon={<Building2 size={18} />} className="col-span-2 lg:col-span-1" />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{t('carryHint')}</p>
          {yearStats.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">{t('monthStats')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
                {yearStats.map(([period, cell]) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setMonth(period)}
                    className={`rounded-lg border px-2 py-2 text-start ${
                      period === month
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <p className="text-xs font-medium">{shortMonth(period, lang)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{t('collectedRent')}</p>
                    <p className="text-sm font-semibold">{money(cell.collected)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{t('rentLeft')}</p>
                    <p className="text-sm">{money(cell.remaining)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder={t('rentSearch')} className="flex-1" />
            <Select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              options={[
                { value: 'all', label: t('allProperties') },
                ...properties.map((property) => ({ value: property.id, label: property.name })),
              ]}
              className="lg:w-56"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'due' | 'paid')}
              options={[
                { value: 'all', label: t('all') },
                { value: 'due', label: t('rentLeft') },
                { value: 'paid', label: t('rentPaidStatus') },
              ]}
              className="lg:w-40"
            />
          </div>

          {loading && !board ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('search')}...</p>
          ) : rows.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--color-text-muted)]">
                {properties.length === 0
                  ? t('noProperties')
                  : (board?.rows.length ?? 0) === 0
                    ? t('noPlaces')
                    : t('noRentRows')}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {rows.map((row) => (
                <Card key={row.unitId}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">{row.propertyName}</p>
                        <h3 className="font-semibold text-lg">{row.unitName}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge>{row.kind === 'shop' ? t('rentShop') : t('rentRoom')}</Badge>
                          {statusBadge(row)}
                          {row.extra > 0 && <Badge variant="info">{t('rentExtra')} {money(row.extra)}</Badge>}
                        </div>
                      </div>
                      {canWrite && (
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => openCollect(row)}>{t('collectRent')}</Button>
                          <Button size="sm" variant="secondary" onClick={() => openCharge(row)}>{t('addCharge')}</Button>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                      {row.tenantName && <p>{t('tenant')}: <span className="text-[var(--color-text)]">{row.tenantName}</span></p>}
                      {row.tenantPhone && (
                        <p className="flex items-center gap-1.5"><Phone size={14} />{row.tenantPhone}</p>
                      )}
                      <p>
                        {t('dueEachMonth')}: <span className="text-[var(--color-text)]">{dayLabel(row.dueDay, lang)}</span>
                        {' · '}
                        {prettyDate(row.dueDate, lang)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm border-t border-[var(--color-border)] pt-3">
                      <div>
                        <p className="text-[var(--color-text-muted)]">{row.broughtForward < 0 ? t('creditFromBefore') : t('broughtForward')}</p>
                        <p className="font-semibold">{money(Math.abs(row.broughtForward))}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">{t('thisMonthRent')}</p>
                        <p className="font-semibold">{money(row.monthRent)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">{t('extraCharges')}</p>
                        <p className="font-semibold">{money(row.extras)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">{t('collectedRent')}</p>
                        <p className="font-semibold">{money(row.collected)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">{t('rentLeft')}</p>
                        <p className="font-semibold">{money(row.remaining)}</p>
                      </div>
                    </div>

                    {row.charges.length > 0 && (
                      <ul className="space-y-1.5 text-sm">
                        {row.charges.map((charge) => (
                          <li key={charge.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2">
                            <div>
                              <p className="font-medium">{money(charge.amount)} · {prettyDate(charge.chargedOn, lang)}</p>
                              {charge.description && <p className="text-[var(--color-text-muted)]">{charge.description}</p>}
                            </div>
                            {canDelete && (
                              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void removeCharge(charge.id)} />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {row.payments.length > 0 && (
                      <ul className="space-y-1.5 text-sm">
                        {row.payments.map((payment) => (
                          <li key={payment.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2">
                            <div>
                              <p className="font-medium">{money(payment.amount)} · {prettyDate(payment.paidOn, lang)} · {payment.method === 'bank' ? t('bank') : t('cash')}</p>
                              {payment.notes && <p className="text-[var(--color-text-muted)]">{payment.notes}</p>}
                            </div>
                            {canDelete && (
                              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void removePayment(payment.id)} />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'places' && (
        <div className="space-y-4">
          {properties.length === 0 && !loading && (
            <Card><p className="text-sm text-[var(--color-text-muted)]">{t('noProperties')}</p></Card>
          )}
          {properties.map((property) => (
            <Card key={property.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{property.name}</h3>
                    {property.address && <p className="text-sm text-[var(--color-text-muted)]">{property.address}</p>}
                    {property.notes && <p className="text-sm text-[var(--color-text-muted)]">{property.notes}</p>}
                  </div>
                  {canWrite && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setPropertyForm({ id: property.id, name: property.name, address: property.address ?? '', notes: property.notes ?? '' })} />
                      <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => openPlace(property.id)}>{t('add')}</Button>
                      {canDelete && (
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void removeProperty(property)} />
                      )}
                    </div>
                  )}
                </div>
                {property.units.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">{t('noPlaces')}</p>
                ) : (
                  <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg">
                    {property.units.map((unit) => (
                      <div key={unit.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-3">
                        <div>
                          <p className="font-medium">{unit.name}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {unit.kind === 'shop' ? t('rentShop') : t('rentRoom')}
                            {' · '}
                            {money(unit.monthlyRent)}
                            {' · '}
                            {t('dueDay')} {dayLabel(unit.dueDay, lang)}
                            {unit.openingBalance > 0 ? ` · ${t('alreadyOwed')} ${money(unit.openingBalance)}` : ''}
                            {unit.tenantName ? ` · ${unit.tenantName}` : ''}
                            {!unit.occupied ? ` · ${t('rentVacant')}` : ''}
                          </p>
                        </div>
                        {canWrite && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openPlace(property.id, unit)} />
                            {canDelete && (
                              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void removePlace(unit)} />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!propertyForm} onClose={() => setPropertyForm(null)} title={propertyForm?.id ? t('editProperty') : t('addProperty')}>
        {propertyForm && (
          <div className="space-y-3">
            <Input label={t('propertyName')} value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} />
            <Input label={t('address')} value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} />
            <Input label={t('notes')} value={propertyForm.notes} onChange={(e) => setPropertyForm({ ...propertyForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setPropertyForm(null)}>{t('cancel')}</Button>
              <Button onClick={() => void saveProperty()} disabled={saving || !propertyForm.name.trim()}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!placeForm} onClose={() => setPlaceForm(null)} title={placeForm?.id ? t('editPlace') : t('addPlace')}>
        {placeForm && (
          <div className="space-y-3">
            {!placeForm.id && (
              <Select
                label={t('propertyName')}
                value={placeForm.propertyId}
                onChange={(e) => setPlaceForm({ ...placeForm, propertyId: e.target.value })}
                options={properties.map((property) => ({ value: property.id, label: property.name }))}
              />
            )}
            <Input label={t('placeName')} value={placeForm.name} onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })} placeholder="Room 1" />
            <Select
              label={t('type')}
              value={placeForm.kind}
              onChange={(e) => setPlaceForm({ ...placeForm, kind: e.target.value === 'shop' ? 'shop' : 'room' })}
              options={[
                { value: 'room', label: t('rentRoom') },
                { value: 'shop', label: t('rentShop') },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('monthlyRent')} type="number" min={0} value={placeForm.monthlyRent} onChange={(e) => setPlaceForm({ ...placeForm, monthlyRent: e.target.value })} />
              <Input label={t('dueDay')} type="number" min={1} max={31} value={placeForm.dueDay} onChange={(e) => setPlaceForm({ ...placeForm, dueDay: e.target.value })} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] -mt-1">{t('dueDayHint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('alreadyOwed')} type="number" min={0} value={placeForm.openingBalance} onChange={(e) => setPlaceForm({ ...placeForm, openingBalance: e.target.value })} placeholder="50000" />
              <Input label={t('rentStarts')} type="month" value={placeForm.startMonth} onChange={(e) => setPlaceForm({ ...placeForm, startMonth: e.target.value })} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] -mt-1">{t('alreadyOwedHint')}</p>
            <Input label={t('tenant')} value={placeForm.tenantName} onChange={(e) => setPlaceForm({ ...placeForm, tenantName: e.target.value })} />
            <Input label={t('phone')} value={placeForm.tenantPhone} onChange={(e) => setPlaceForm({ ...placeForm, tenantPhone: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={placeForm.occupied}
                onChange={(e) => setPlaceForm({ ...placeForm, occupied: e.target.checked })}
              />
              {t('occupied')}
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">{t('vacantHint')}</p>
            <Input label={t('notes')} value={placeForm.notes} onChange={(e) => setPlaceForm({ ...placeForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setPlaceForm(null)}>{t('cancel')}</Button>
              <Button onClick={() => void savePlace()} disabled={saving || !placeForm.name.trim() || !placeForm.propertyId}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!collecting}
        onClose={() => setCollecting(null)}
        title={collecting ? `${t('collectRent')} · ${collecting.unitName}` : t('collectRent')}
      >
        {collecting && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {collecting.propertyName} · {monthLabel(month, lang)}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[var(--color-text-muted)]">{t('broughtForward')}</p>
                <p className="font-semibold">{money(collecting.broughtForward)}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">{t('thisMonthRent')}</p>
                <p className="font-semibold">{money(collecting.monthRent)}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">{t('alreadyTaken')}</p>
                <p className="font-semibold">{money(collecting.collected)}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">{t('rentLeft')}</p>
                <p className="font-semibold">{money(collecting.remaining)}</p>
              </div>
            </div>
            <Input label={t('amount')} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
            {collecting.remaining > 0 && (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setAmount(String(collecting.remaining))}>
                  {t('fullAmount')} {mask ? '' : formatPKR(collecting.remaining)}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setAmount(String(Math.round(collecting.remaining / 2)))}>
                  {t('halfAmount')} {mask ? '' : formatPKR(Math.round(collecting.remaining / 2))}
                </Button>
              </div>
            )}
            <Input label={t('receivedOn')} type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            <p className="text-xs text-[var(--color-text-muted)]">{t('openMonthHint')}</p>
            <Select
              label={t('method')}
              value={method}
              onChange={(e) => setMethod(e.target.value === 'bank' ? 'bank' : 'cash')}
              options={[
                { value: 'cash', label: t('cash') },
                { value: 'bank', label: t('bank') },
              ]}
            />
            <Input label={t('notes')} value={collectNotes} placeholder={t('restLater')} onChange={(e) => setCollectNotes(e.target.value)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCollecting(null)}>{t('cancel')}</Button>
              <Button onClick={() => void saveCollection()} disabled={saving || !(Number(amount) > 0)}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!chargeFor}
        onClose={() => setChargeFor(null)}
        title={chargeFor ? `${t('addCharge')} · ${chargeFor.unitName}` : t('addCharge')}
      >
        {chargeFor && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">{chargeFor.propertyName}</p>
            <Input label={t('amount')} type="number" min={1} value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
            <Input label={t('receivedOn')} type="date" value={chargeOn} onChange={(e) => setChargeOn(e.target.value)} />
            <Input label={t('chargeFor')} value={chargeNote} onChange={(e) => setChargeNote(e.target.value)} placeholder="Electricity" />
            <p className="text-xs text-[var(--color-text-muted)]">{t('carryHint')}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setChargeFor(null)}>{t('cancel')}</Button>
              <Button onClick={() => void saveCharge()} disabled={saving || !(Number(chargeAmount) > 0) || !chargeNote.trim()}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
