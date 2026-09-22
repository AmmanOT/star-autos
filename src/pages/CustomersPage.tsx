import { useState } from 'react';
import { Plus, Pencil, Trash2, Phone } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Customer, CustomerType } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { formatPKR } from '../utils/format';
import { matchesSearch } from '../utils/search';

export function CustomersPage() {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const filtered = state.customers.filter((c) => {
    const matchSearch = matchesSearch(search, c.name, c.nameUrdu, c.phone, c.city);
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

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setModalOpen(true); };

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
      <p className="text-sm text-[var(--color-text-muted)] -mt-2">{t('customerPortalHint')}</p>

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

      <CustomerFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
      />
    </div>
  );
}
