import { useState } from 'react';
import { Plus, Pencil, Trash2, Phone } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CITIES } from '../constants/catalog';
import type { Customer, CustomerType } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { formatPKR } from '../utils/format';

const emptyCustomer = (): Omit<Customer, 'id' | 'createdAt' | 'balance'> => ({
  name: '', nameUrdu: '', type: 'workshop', phone: '', address: '', city: 'Lahore', creditLimit: 50000,
});

export function CustomersPage() {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer());

  const filtered = state.customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.nameUrdu.includes(q) || c.phone.includes(q) || c.city.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const typeLabel = (type: CustomerType) => {
    if (type === 'workshop') return t('workshop');
    if (type === 'wholesaler') return t('wholesaler');
    return t('retail');
  };

  const balanceLabel = (balance: number) => {
    if (balance > 0) return { text: t('theyOweUs'), variant: 'warning' as const };
    if (balance < 0) return { text: t('weOweThem'), variant: 'info' as const };
    return { text: t('settled'), variant: 'success' as const };
  };

  const openAdd = () => { setEditing(null); setForm(emptyCustomer()); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ ...c }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...editing, ...form } as Customer });
      } else {
        await dispatch({ type: 'ADD_CUSTOMER', payload: form });
      }
      setModalOpen(false);
    } catch {
      /* toast handled in store */
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    } catch {
      /* toast handled in store */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('customers')}</h1>
        <Button icon={<Plus size={16} />} onClick={openAdd}>{t('addCustomer')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('search')} className="flex-1" />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'all', label: t('all') },
            { value: 'workshop', label: t('workshop') },
            { value: 'wholesaler', label: t('wholesaler') },
            { value: 'retail', label: t('retail') },
          ]}
          className="sm:w-48"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const bal = balanceLabel(c.balance);
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{lang === 'ur' ? c.nameUrdu : c.name}</h3>
                  <span className="mt-1 inline-block"><Badge variant="default">{typeLabel(c.type)}</Badge></span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(c)} />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void handleDelete(c.id)} />
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]"><Phone size={14} />{c.phone}</div>
                <p className="text-[var(--color-text-muted)]">{c.address}, {c.city}</p>
                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                  <Badge variant={bal.variant}>{bal.text}</Badge>
                  <span className="font-bold text-lg">{formatPKR(Math.abs(c.balance))}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{t('creditLimit')}: {formatPKR(c.creditLimit)}</p>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-[var(--color-text-muted)]">{t('noResults')}</p>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('editCustomer') : t('addCustomer')} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`${t('name')} (EN)`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label={`${t('name')} (UR)`} value={form.nameUrdu} onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })} />
          <Select label={t('type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CustomerType })} options={[
            { value: 'workshop', label: t('workshop') }, { value: 'wholesaler', label: t('wholesaler') }, { value: 'retail', label: t('retail') },
          ]} />
          <Input label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" />
          <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
          <Select label={t('city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} options={CITIES.map((c) => ({ value: c, label: c }))} />
          <Input label={t('creditLimit')} type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: +e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleSave}>{t('save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
