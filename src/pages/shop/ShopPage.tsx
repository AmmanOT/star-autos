import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { categoryLabel } from '../../i18n/translations';
import { PART_CATEGORIES, VEHICLE_MODELS } from '../../data/mockData';
import { ProductCard } from '../../components/shop/ProductCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { useState } from 'react';

export function ShopPage() {
  const { state } = useStore();
  const { t, lang } = useLanguage();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.get('category') ?? 'all');
  const [vehicle, setVehicle] = useState(params.get('vehicle') ?? 'all');
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    let list = [...state.products];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || p.nameUrdu.includes(q) ||
        p.partNumber.toLowerCase().includes(q) || p.companyNumber.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q),
      );
    }
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (vehicle !== 'all') list = list.filter((p) => p.vehicleModels.includes(vehicle));

    list.sort((a, b) => {
      if (sort === 'price-low') return a.salePrice - b.salePrice;
      if (sort === 'price-high') return b.salePrice - a.salePrice;
      if (sort === 'stock') return b.quantity - a.quantity;
      return (lang === 'ur' ? a.nameUrdu : a.name).localeCompare(lang === 'ur' ? b.nameUrdu : b.name);
    });
    return list;
  }, [state.products, search, category, vehicle, sort, lang]);

  const inStock = filtered.filter((p) => p.quantity > 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('shop')}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">{t('shopPageDesc')}</p>
        <p className="text-sm text-brand-600 mt-2">{t('liveInventory')} — {inStock}/{filtered.length} {t('inStockNow')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <SearchInput value={search} onChange={setSearch} placeholder={`${t('search')} part no, name, brand...`} className="flex-1" />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[{ value: 'all', label: t('all') + ' ' + t('categories') }, ...PART_CATEGORIES.map((c) => ({ value: c, label: categoryLabel(lang, c) }))]}
          className="lg:w-44"
        />
        <Select
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          options={[{ value: 'all', label: t('all') + ' ' + t('vehicle') }, ...VEHICLE_MODELS.map((v) => ({ value: v, label: v }))]}
          className="lg:w-40"
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          options={[
            { value: 'name', label: t('sortName') },
            { value: 'price-low', label: t('sortPriceLow') },
            { value: 'price-high', label: t('sortPriceHigh') },
            { value: 'stock', label: t('sortStock') },
          ]}
          className="lg:w-40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          <p className="text-lg">{t('noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
