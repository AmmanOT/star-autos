import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { catalogApi, type Brand, type Category, type Vehicle } from '../api/catalog';
import type { Product } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { CreatableSelect, VehicleMultiSelect } from '../components/ui/CreatableSelect';
import { formatPKR, isLowStock } from '../utils/format';

const emptyProduct = (): Omit<Product, 'id' | 'createdAt'> => ({
  name: '',
  nameUrdu: '',
  partNumber: '',
  companyNumber: '',
  brand: '',
  category: '',
  vehicleModels: [],
  purchasePrice: 0,
  salePrice: 0,
  quantity: 0,
  minStock: 5,
  location: '',
});

export function InventoryPage() {
  const { state, dispatch } = useStore();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct());

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const loadCatalog = useCallback(async () => {
    try {
      const [b, c, v] = await Promise.all([
        catalogApi.brands.list(),
        catalogApi.categories.list(),
        catalogApi.vehicles.list(),
      ]);
      setBrands(b);
      setCategories(c);
      setVehicles(v);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load catalog');
    }
  }, [toast]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const catLabel = (name: string) => {
    const found = categories.find((c) => c.name === name);
    if (lang === 'ur' && found?.nameUrdu) return found.nameUrdu;
    return name;
  };

  const filtered = state.products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.nameUrdu.includes(q) ||
      p.partNumber.toLowerCase().includes(q) ||
      p.companyNumber.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    const matchCat = catFilter === 'all' || p.category === catFilter;
    const matchVehicle = vehicleFilter === 'all' || p.vehicleModels.includes(vehicleFilter);
    return matchSearch && matchCat && matchVehicle;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyProduct());
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.brand || !form.category) {
      toast.error('Please select brand and category');
      return;
    }
    try {
      if (editing) {
        await dispatch({ type: 'UPDATE_PRODUCT', payload: { ...editing, ...form } as Product });
      } else {
        await dispatch({ type: 'ADD_PRODUCT', payload: form });
      }
      setModalOpen(false);
    } catch {
      /* toast in store */
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch {
      /* toast in store */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('inventory')}</h1>
        <Button icon={<Plus size={16} />} onClick={openAdd}>
          {t('addProduct')}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('search')} className="flex-1" />
        <Select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          options={[
            { value: 'all', label: t('all') },
            ...categories.map((c) => ({
              value: c.name,
              label: lang === 'ur' && c.nameUrdu ? c.nameUrdu : c.name,
            })),
          ]}
          className="lg:w-48"
        />
        <Select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          options={[
            { value: 'all', label: t('all') },
            ...vehicles.map((v) => ({ value: v.name, label: v.name })),
          ]}
          className="lg:w-40"
        />
      </div>

      <Card>
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-start px-5 py-2">{t('name')}</th>
                <th className="text-start px-3 py-2">{t('partNumber')}</th>
                <th className="text-start px-3 py-2">{t('companyNumber')}</th>
                <th className="text-start px-3 py-2">{t('category')}</th>
                <th className="text-start px-3 py-2">{t('vehicle')}</th>
                <th className="text-end px-3 py-2">{t('purchasePrice')}</th>
                <th className="text-end px-3 py-2">{t('salePrice')}</th>
                <th className="text-end px-3 py-2">{t('stock')}</th>
                <th className="text-end px-5 py-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-elevated)]"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{lang === 'ur' ? p.nameUrdu || p.name : p.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{p.brand}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{p.partNumber}</td>
                  <td className="px-3 py-3 font-mono text-xs">{p.companyNumber}</td>
                  <td className="px-3 py-3">
                    <Badge>{catLabel(p.category)}</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs">{p.vehicleModels.join(', ')}</td>
                  <td className="px-3 py-3 text-end">{formatPKR(p.purchasePrice)}</td>
                  <td className="px-3 py-3 text-end font-medium">{formatPKR(p.salePrice)}</td>
                  <td className="px-3 py-3 text-end">
                    <Badge variant={isLowStock(p.quantity, p.minStock) ? 'danger' : 'success'}>
                      {p.quantity}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(p)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => void handleDelete(p.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-[var(--color-text-muted)]">{t('noResults')}</p>
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('editProduct') : t('addProduct')}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('name')} (EN)`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label={`${t('name')} (UR)`}
            value={form.nameUrdu}
            onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })}
            className="font-urdu"
          />
          <Input
            label={t('partNumber')}
            value={form.partNumber}
            onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
          />
          <Input
            label={t('companyNumber')}
            value={form.companyNumber}
            onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
          />
          <CreatableSelect
            label={t('brand')}
            value={form.brand}
            options={brands.map((b) => ({ value: b.name, label: b.name }))}
            onChange={(brand) => setForm({ ...form, brand })}
            onCreate={async (name) => {
              const created = await catalogApi.brands.create(name);
              toast.success('Brand added');
              await loadCatalog();
              return created.name;
            }}
          />
          <CreatableSelect
            label={t('category')}
            value={form.category}
            options={categories.map((c) => ({
              value: c.name,
              label: lang === 'ur' && c.nameUrdu ? c.nameUrdu : c.name,
            }))}
            onChange={(category) => setForm({ ...form, category })}
            onCreate={async (name) => {
              const created = await catalogApi.categories.create(name);
              toast.success('Category added');
              await loadCatalog();
              return created.name;
            }}
          />
          <Input
            label={t('purchasePrice')}
            type="number"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: +e.target.value })}
          />
          <Input
            label={t('salePrice')}
            type="number"
            value={form.salePrice}
            onChange={(e) => setForm({ ...form, salePrice: +e.target.value })}
          />
          <Input
            label={t('quantity')}
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
          />
          <Input
            label={t('minStock')}
            type="number"
            value={form.minStock}
            onChange={(e) => setForm({ ...form, minStock: +e.target.value })}
          />
          <Input
            label={t('location')}
            value={form.location ?? ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <VehicleMultiSelect
            label={t('vehicle')}
            value={form.vehicleModels}
            options={vehicles.map((v) => v.name)}
            onChange={(vehicleModels) => setForm({ ...form, vehicleModels })}
            onCreate={async (name) => {
              const created = await catalogApi.vehicles.create(name);
              toast.success('Vehicle added');
              await loadCatalog();
              return created.name;
            }}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={() => void handleSave()}>{t('save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
