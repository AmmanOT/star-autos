import { useEffect, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CITIES } from '../../constants/catalog';
import type { Customer, CustomerType } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export const emptyCustomerForm = (): Omit<Customer, 'id' | 'createdAt' | 'balance'> => ({
  name: '',
  nameUrdu: '',
  type: 'workshop',
  phone: '',
  address: '',
  city: 'Rawalpindi',
  creditLimit: 50000,
});

function formFromCustomer(c: Customer) {
  return {
    name: c.name,
    nameUrdu: c.nameUrdu,
    type: c.type,
    phone: c.phone,
    address: c.address,
    city: c.city,
    creditLimit: c.creditLimit,
  };
}

export function CustomerFormModal({
  open,
  onClose,
  editing = null,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Customer | null;
  onSaved?: (customer: Customer) => void;
}) {
  const { dispatch } = useStore();
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyCustomerForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromCustomer(editing) : emptyCustomerForm());
  }, [open, editing]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = (await dispatch({
          type: 'UPDATE_CUSTOMER',
          payload: { id: editing.id, ...form } as Customer,
        })) as Customer;
        onSaved?.(updated);
      } else {
        const created = (await dispatch({ type: 'ADD_CUSTOMER', payload: form })) as Customer;
        onSaved?.(created);
      }
      onClose();
    } catch {
      /* toast handled in store */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? t('editCustomer') : t('addCustomer')} size="lg" zClass="z-[60]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={`${t('name')} (EN)`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={`${t('name')} (UR)`} value={form.nameUrdu} onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })} />
        <Select
          label={t('type')}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as CustomerType })}
          options={[
            { value: 'workshop', label: t('workshop') },
            { value: 'wholesaler', label: t('wholesaler') },
            { value: 'retail', label: t('retail') },
          ]}
        />
        <Input label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" />
        <Input label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
        <Select
          label={t('city')}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          options={CITIES.map((c) => ({ value: c, label: c }))}
        />
        <Input label={t('creditLimit')} type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: +e.target.value })} />
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={() => void handleSave()} disabled={saving || !form.name.trim() || !form.phone.trim()}>
          {t('save')}
        </Button>
      </div>
    </Modal>
  );
}
