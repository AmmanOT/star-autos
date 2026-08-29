import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Truck, MessageCircle, Package, Wrench, Star, Phone, MapPin,
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { categoryLabel } from '../../i18n/translations';
import { PART_CATEGORIES } from '../../data/mockData';
import { ProductCard } from '../../components/shop/ProductCard';
import { Button } from '../../components/ui/Button';

export function LandingPage() {
  const { state } = useStore();
  const { t, lang } = useLanguage();

  const featured = state.products.filter((p) => p.quantity > 0).slice(0, 4);
  const totalParts = state.products.length;
  const inStockCount = state.products.filter((p) => p.quantity > 0).length;

  const features = [
    { icon: Shield, title: t('featGenuine'), desc: t('featGenuineDesc') },
    { icon: Truck, title: t('featDelivery'), desc: t('featDeliveryDesc') },
    { icon: MessageCircle, title: t('featWhatsApp'), desc: t('featWhatsAppDesc') },
    { icon: Package, title: t('featStock'), desc: t('featStockDesc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 start-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 end-20 w-96 h-96 rounded-full bg-brand-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm mb-6 backdrop-blur">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              {t('trustedSince')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 text-lg text-brand-100 leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/shop">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50" icon={<ArrowRight size={18} />}>
                  {t('shopNow')}
                </Button>
              </Link>
              <a href={`https://wa.me/92${t('shopPhoneRaw').replace(/^0/, '')}`} target="_blank" rel="noreferrer">
                <Button size="lg" variant="secondary" className="border-white/30 text-white hover:bg-white/10" icon={<MessageCircle size={18} />}>
                  {t('chatWhatsApp')}
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-brand-200">
              <span className="flex items-center gap-2"><Package size={16} /> {totalParts}+ {t('partsListed')}</span>
              <span className="flex items-center gap-2"><Wrench size={16} /> {inStockCount} {t('inStockNow')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">{t('shopByCategory')}</h2>
          <p className="text-[var(--color-text-muted)] mt-2">{t('shopByCategoryDesc')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {PART_CATEGORIES.map((cat) => {
            const count = state.products.filter((p) => p.category === cat).length;
            return (
              <Link
                key={cat}
                to={`/shop?category=${cat}`}
                className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center hover:border-brand-400 hover:shadow-md transition-all"
              >
                <p className="font-semibold text-sm">{categoryLabel(lang, cat)}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{count} {t('items')}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl bg-[var(--color-surface-elevated)]">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products — live from inventory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">{t('featuredParts')}</h2>
            <p className="text-[var(--color-text-muted)] mt-1">{t('featuredPartsDesc')}</p>
          </div>
          <Link to="/shop" className="text-brand-600 font-medium text-sm hover:underline flex items-center gap-1 shrink-0">
            {t('viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Vehicles */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-2xl font-bold">{t('allSuzukiModels')}</h2>
          <p className="text-brand-100 mt-2 max-w-xl mx-auto">{t('allSuzukiModelsDesc')}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Mehran', 'Alto', 'Cultus', 'Swift', 'Wagon R', 'Bolan', 'Ravi', 'Jimny'].map((m) => (
              <Link key={m} to={`/shop?vehicle=${m}`} className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors">
                {m}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold">{t('visitShop')}</h2>
            <p className="text-[var(--color-text-muted)] mt-2 flex items-center gap-2"><MapPin size={16} /> {t('shopAddress')}</p>
            <p className="text-[var(--color-text-muted)] mt-1 flex items-center gap-2"><Phone size={16} /> {t('shopPhone')}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/shop"><Button size="lg">{t('shopNow')}</Button></Link>
            <a href={`tel:${t('shopPhoneRaw')}`}><Button size="lg" variant="secondary">{t('callNow')}</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
