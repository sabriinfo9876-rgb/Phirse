import React, { useMemo, useState } from 'react';
import {
  Armchair,
  ArrowRight,
  ArrowUpRight,
  Bike,
  BookOpen,
  Camera,
  CheckCircle2,
  Dumbbell,
  Eye,
  Gamepad2,
  Heart,
  Laptop,
  MapPin,
  MessageSquare,
  Microwave,
  Package,
  ShieldCheck,
  Smartphone,
  Tag,
  Tv,
  Users,
  Watch,
} from 'lucide-react';
import { ListingCard } from '../components/listing/ListingCard';
import { CATEGORIES } from '../data/categories';
import { getAreasForCity } from '../data/locations';
import { HERO_BANNER_IMAGE } from '../data/seedData';
import { useMarketplace } from '../store/MarketplaceContext';
import { formatPKR, formatRelativeAge } from '../utils/formatters';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  mobiles: Smartphone,
  'laptops-computers': Laptop,
  electronics: Tv,
  gaming: Gamepad2,
  cameras: Camera,
  vehicles: Bike,
  furniture: Armchair,
  'home-appliances': Microwave,
  fashion: Watch,
  books: BookOpen,
  'sports-fitness': Dumbbell,
  other: Package,
};

const FEATURED_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
];

export const HomePage: React.FC = () => {
  const {
    listings,
    navigate,
    isFavorite,
    toggleFavorite,
    getUserById,
  } = useMarketplace();

  const [trendingCity, setTrendingCity] = useState<string>('All');
  const [selectedCityExplorer, setSelectedCityExplorer] = useState<string>('Karachi');
  const [heroImgError, setHeroImgError] = useState(false);

  const activeListings = useMemo(
    () => listings.filter((l) => l.status === 'active'),
    [listings]
  );

  // 1. TRENDING NEAR YOU: 4 high-demand items with realistic photography
  const trendingIds = ['PHR-842731', 'PHR-842733', 'PHR-842734', 'PHR-842743'];
  const trendingListings = useMemo(() => {
    const base = activeListings.filter((l) => trendingIds.includes(l.id));
    if (trendingCity === 'All') {
      return base.length >= 4 ? base.slice(0, 4) : activeListings.slice(0, 4);
    }
    const cityMatches = activeListings.filter((l) => l.city === trendingCity);
    return cityMatches.slice(0, 4);
  }, [activeListings, trendingCity]);

  // 2. RECENTLY LISTED: Distinct set of listings so images do not repeat the Trending row
  const recentlyListed = useMemo(() => {
    const trendingSet = new Set(trendingListings.map((l) => l.id));
    const distinct = activeListings.filter((l) => !trendingSet.has(l.id));
    return distinct.slice(0, 6);
  }, [activeListings, trendingListings]);

  // 3. CURATED FOR YOU: 3 distinct single-owner items that haven't appeared in the first two sections
  const curatedListings = useMemo(() => {
    const usedIds = new Set([
      ...trendingListings.map((l) => l.id),
      ...recentlyListed.map((l) => l.id),
    ]);
    const remaining = activeListings.filter((l) => !usedIds.has(l.id));
    if (remaining.length >= 3) return remaining.slice(0, 3);
    return activeListings.slice(-3);
  }, [activeListings, trendingListings, recentlyListed]);

  // Hero spotlight items for the right-side composition
  const heroPrimaryItem =
    activeListings.find((l) => l.id === 'PHR-842731') || activeListings[0];
  const heroSecondaryItem =
    activeListings.find((l) => l.id === 'PHR-842743') || activeListings[1];
  const heroTertiaryItem =
    activeListings.find((l) => l.id === 'PHR-842744') || activeListings[2];

  // Count active listings per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeListings.forEach((l) => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return counts;
  }, [activeListings]);

  // Count active listings per city
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeListings.forEach((l) => {
      counts[l.city] = (counts[l.city] || 0) + 1;
    });
    return counts;
  }, [activeListings]);

  const explorerAreas = useMemo(
    () => getAreasForCity(selectedCityExplorer),
    [selectedCityExplorer]
  );

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ==================================================
          2. EDITORIAL MARKETPLACE HERO
          ================================================== */}
      <section className="bg-[#FAF8F5] border-b border-gray-900/8 pt-8 pb-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Editorial Headline, Copy, and Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EBF3F1] border border-[#0F5348]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5348]" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#0F5348]">
                  PAKISTAN&apos;S PRE-OWNED MARKETPLACE
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold text-gray-900 tracking-tight leading-[1.06]">
                Find something worth
                <br />
                <span className="text-[#0F5348]">bringing back.</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
                Buy better. Sell what you no longer need.
                <br className="hidden sm:inline" /> Find great products from
                people nearby.
              </p>

              {/* Primary & Secondary Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/browse')}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-xs whitespace-nowrap"
                >
                  <span>Browse listings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/sell')}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 text-sm sm:text-base font-semibold transition-all flex items-center justify-center whitespace-nowrap"
                >
                  Sell something
                </button>
              </div>

              {/* Neighborhood Quick Jump Strip */}
              <div className="pt-4 border-t border-gray-900/8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">
                  Active neighborhoods:
                </span>
                {[
                  { label: 'Clifton, Karachi', city: 'Karachi', area: 'Clifton' },
                  { label: 'Gulberg, Lahore', city: 'Lahore', area: 'Gulberg' },
                  { label: 'F-7, Islamabad', city: 'Islamabad', area: 'F-7' },
                  { label: 'PECHS, Karachi', city: 'Karachi', area: 'PECHS' },
                ].map((loc) => (
                  <button
                    key={loc.label}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/browse?city=${encodeURIComponent(
                          loc.city
                        )}&area=${encodeURIComponent(loc.area)}`
                      )
                    }
                    className="hover:text-[#0F5348] hover:underline transition-colors"
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Premium Multi-Product Editorial Composition */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch">
                {/* Main Feature Card (7 cols) */}
                <div
                  onClick={() =>
                    heroPrimaryItem && navigate(`/listing/${heroPrimaryItem.id}`)
                  }
                  className="col-span-12 sm:col-span-7 group cursor-pointer relative rounded-2xl overflow-hidden bg-white border border-gray-900/10 shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 sm:aspect-auto sm:h-72 w-full bg-[#F3F1EC] overflow-hidden">
                    {!heroImgError ? (
                      <img
                        src={
                          heroPrimaryItem?.images[0] || HERO_BANNER_IMAGE
                        }
                        alt={
                          heroPrimaryItem?.title ||
                          'Curated pre-owned electronics on PHIRSE'
                        }
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImgError(true)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <img
                        src={HERO_BANNER_IMAGE}
                        alt="Curated pre-owned products"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/92 backdrop-blur-xs text-[11px] font-semibold text-gray-800 shadow-2xs">
                      {heroPrimaryItem?.condition || 'Excellent'} ·{' '}
                      {heroPrimaryItem?.city || 'Karachi'}
                    </div>
                  </div>
                  <div className="p-4 bg-white flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0F5348] transition-colors">
                        {heroPrimaryItem?.title ||
                          'Apple iPhone 13 128GB Midnight'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {heroPrimaryItem?.location || 'Clifton, Karachi'}
                      </p>
                    </div>
                    <span className="font-price text-sm sm:text-base font-bold text-[#0F5348] tabular-nums shrink-0">
                      {heroPrimaryItem
                        ? formatPKR(heroPrimaryItem.price)
                        : 'Rs. 168,000'}
                    </span>
                  </div>
                </div>

                {/* Right Stacked Pair (5 cols) */}
                <div className="col-span-12 sm:col-span-5 grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
                  {[heroSecondaryItem, heroTertiaryItem]
                    .filter(Boolean)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/listing/${item.id}`)}
                        className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-900/10 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-4/3 sm:h-32 w-full bg-[#F3F1EC] overflow-hidden">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="p-3 bg-white space-y-0.5">
                          <p className="text-xs sm:text-[13px] font-semibold text-gray-900 truncate group-hover:text-[#0F5348]">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-price text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                              {formatPKR(item.price)}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">
                              {item.city}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. POPULAR CATEGORIES (INTERACTIVE RAIL & PILLS)
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
              Browse by category
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Everyday technology, home furniture, cameras, and personal gear
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/browse')}
            className="text-xs sm:text-sm font-semibold text-[#0F5348] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>All categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal scroll rail on mobile, refined interactive flex/grid on desktop */}
        <div className="flex lg:grid lg:grid-cols-6 gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const IconComponent = CATEGORY_ICON_MAP[cat.slug] || Package;
            const count = categoryCounts[cat.slug] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/categories/${cat.slug}`)}
                className="group shrink-0 w-40 sm:w-44 lg:w-auto p-3.5 rounded-xl bg-white hover:bg-[#EBF3F1]/55 border border-gray-900/8 hover:border-[#0F5348]/40 text-left transition-all duration-150 hover:-translate-y-0.5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] group-hover:bg-white border border-gray-900/6 flex items-center justify-center text-gray-700 group-hover:text-[#0F5348] transition-colors shrink-0">
                  <IconComponent className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-[13px] font-semibold text-gray-900 group-hover:text-[#0F5348] truncate transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-gray-500 tabular-nums">
                    {count} {count === 1 ? 'listing' : 'listings'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Shop by Budget (PKR Price Filter Presets) */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-900/8 p-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#0F5348] shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              Browse by Budget (PKR)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Under Rs. 25,000', min: '', max: '25000' },
              { label: 'Rs. 25,000 – 50,000', min: '25000', max: '50000' },
              { label: 'Rs. 50,000 – 100,000', min: '50000', max: '100000' },
              { label: 'Rs. 100,000 – 250,000', min: '100000', max: '250000' },
              { label: 'Above Rs. 250,000', min: '250000', max: '' },
            ].map((tier) => (
              <button
                key={tier.label}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (tier.min) params.set('minPrice', tier.min);
                  if (tier.max) params.set('maxPrice', tier.max);
                  navigate(`/browse?${params.toString()}`);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#0F5348] hover:text-white border border-gray-200/90 hover:border-[#0F5348] text-xs font-semibold text-gray-800 transition-colors tabular-nums"
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          6. TRENDING NEAR YOU (VISUAL SPOTLIGHT SECTION)
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5348]">
              High local interest
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5">
              Trending near you
            </h2>
          </div>

          {/* City filter pills for Trending */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['All', 'Karachi', 'Lahore', 'Islamabad'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setTrendingCity(city)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  trendingCity === city
                    ? 'bg-[#0F5348] text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {city === 'All' ? 'All Pakistan' : city}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal scroll on mobile, 4-column visual spotlight on desktop */}
        <div className="flex lg:grid lg:grid-cols-4 gap-5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {trendingListings.map((item) => {
            const saved = isFavorite(item.id);
            return (
              <article
                key={item.id}
                onClick={() => navigate(`/listing/${item.id}`)}
                className="group cursor-pointer shrink-0 w-[280px] sm:w-[300px] lg:w-auto bg-white rounded-2xl border border-gray-900/10 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col"
              >
                <div className="relative aspect-4/3 w-full bg-[#F3F1EC] overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    aria-label={
                      saved
                        ? `Remove ${item.title} from saved items`
                        : `Save ${item.title}`
                    }
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/92 hover:bg-white text-gray-800 flex items-center justify-center shadow-xs transition-transform active:scale-90"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        saved ? 'fill-red-600 text-red-600' : 'text-gray-700'
                      }`}
                    />
                  </button>

                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-emerald-300" />
                    <span className="tabular-nums">{item.views} views</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-2 group-hover:text-[#0F5348] transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-price text-lg font-bold text-[#0F5348] tabular-nums">
                      {formatPKR(item.price)}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-gray-900/6 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate font-medium text-gray-600">
                      {item.location}
                    </span>
                    <span className="shrink-0">{item.condition}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          5A. RECENTLY LISTED (STANDARD 3-COLUMN MARKETPLACE GRID)
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Recently listed
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Freshly added pre-owned items from individual sellers across Pakistan
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/browse?sort=newest')}
            className="text-xs sm:text-sm font-semibold text-[#0F5348] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyListed.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ==================================================
          5B. CURATED FOR YOU (EDITORIAL HORIZONTAL FEATURE CARDS)
          ================================================== */}
      <section className="bg-[#F3F1EC]/80 border-y border-gray-900/8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5348]">
                Handpicked Selection
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5">
                Curated for you
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                Well-maintained items with complete specifications, honest
                condition notes, and responsive local sellers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="text-xs sm:text-sm font-semibold text-[#0F5348] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore full catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {curatedListings.map((item) => {
              const seller = getUserById(item.sellerId);
              return (
                <article
                  key={item.id}
                  onClick={() => navigate(`/listing/${item.id}`)}
                  className="group cursor-pointer bg-white rounded-2xl border border-gray-900/10 p-4 sm:p-5 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span className="font-semibold text-[#0F5348]">
                        {item.condition} Condition
                      </span>
                      <span>{formatRelativeAge(item.createdAt)}</span>
                    </div>

                    <div className="aspect-16/10 rounded-xl overflow-hidden bg-[#FAF8F5]">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0F5348] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-900/8 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-price text-lg font-bold text-gray-900 tabular-nums">
                        {formatPKR(item.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.location}
                        {seller ? ` · Listed by ${seller.name.split(' ')[0]}` : ''}
                      </p>
                    </div>
                    <span className="w-9 h-9 rounded-full bg-[#FAF8F5] group-hover:bg-[#0F5348] text-gray-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================
          7. BROWSE BY CITY ("Explore listings near you")
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Explore listings near you
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Select your city and neighborhood to inspect items in person before paying
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(`/browse?city=${encodeURIComponent(selectedCityExplorer)}`)
            }
            className="text-xs sm:text-sm font-semibold text-[#0F5348] hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            <span>View all in {selectedCityExplorer}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-900/10 p-5 sm:p-7 space-y-6">
          {/* Clean Visual City Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {FEATURED_CITIES.map((city) => {
              const active = selectedCityExplorer === city;
              const count = cityCounts[city] || 0;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCityExplorer(city)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-[#0F5348] border-[#0F5348] text-white shadow-xs'
                      : 'bg-[#FAF8F5] hover:bg-white border-gray-200/90 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold truncate">{city}</span>
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active ? 'text-emerald-300' : 'text-[#0F5348]'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 tabular-nums ${
                      active ? 'text-emerald-100' : 'text-gray-500'
                    }`}
                  >
                    {count > 0 ? `${count} active listings` : 'Browse local'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Neighborhood Hubs for Selected City */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Popular neighborhoods in {selectedCityExplorer}
              </p>
              <div className="flex flex-wrap gap-2">
                {explorerAreas.map((areaName) => (
                  <button
                    key={areaName}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/browse?city=${encodeURIComponent(
                          selectedCityExplorer
                        )}&area=${encodeURIComponent(areaName)}`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F1] hover:text-[#0F5348] border border-gray-200/90 text-xs font-medium text-gray-800 transition-colors"
                  >
                    {areaName}, {selectedCityExplorer}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(`/browse?city=${encodeURIComponent(selectedCityExplorer)}`)
              }
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 self-start sm:self-center"
            >
              Browse {selectedCityExplorer}
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          SELL SOMETHING CTA
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#0F5348] text-white p-7 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
              Give it another life
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              Have something sitting unused at home?
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              List your phone, laptop, camera, or furniture in under two minutes.
              Set your price in PKR, receive structured offers, and hand it over
              locally in your city.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/sell')}
              className="min-h-[48px] px-7 py-3 rounded-xl bg-white hover:bg-gray-100 text-[#0F5348] text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>Start a listing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-listings')}
              className="min-h-[48px] px-6 py-3 rounded-xl border border-white/25 hover:bg-white/10 text-white text-sm font-semibold transition-colors text-center"
            >
              Seller dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          14. WHY PHIRSE & HOW IT WORKS
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Why people trust PHIRSE
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Designed for practical, transparent second-hand buying and selling in Pakistan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-900/8 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3F1] text-[#0F5348] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Accountable member profiles
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Every listing is tied to a real member profile showing their city,
                neighborhood, join date, response rate, and active or sold items.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-900/8 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3F1] text-[#0F5348] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Local neighborhood handovers
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Filter by exact neighborhood—from Clifton and PECHS to Gulberg
                and F-7—so you can meet nearby and inspect the item before paying.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-900/8 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3F1] text-[#0F5348] flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Transparent PKR pricing & offers
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Clear asking prices in Pakistani Rupees, upfront condition grades,
                and structured in-app offers instead of endless lowball messages.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works (3 concise steps) */}
        <div className="bg-white rounded-2xl border border-gray-900/8 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="pt-4 first:pt-0 md:pt-0 md:px-4 first:md:pl-0 space-y-1.5">
              <span className="text-xs font-bold text-[#0F5348] uppercase tracking-wider">
                Step 01 · Discover or List
              </span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Search by neighborhood or list in 6 simple steps
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Browse verified categories or publish your own item with clear
                photos, honest condition grading, and PKR pricing.
              </p>
            </div>

            <div className="pt-4 md:pt-0 md:px-6 space-y-1.5">
              <span className="text-xs font-bold text-[#0F5348] uppercase tracking-wider">
                Step 02 · Message or Make an Offer
              </span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Agree on a fair price inside PHIRSE
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ask questions in the listing chat or send a structured PKR offer
                that the seller can accept, counter, or decline.
              </p>
            </div>

            <div className="pt-4 md:pt-0 md:pl-6 space-y-1.5">
              <span className="text-xs font-bold text-[#0F5348] uppercase tracking-wider">
                Step 03 · Inspect & Complete
              </span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Meet locally and inspect before paying
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Meet in a safe public spot, verify the item in person, and complete
                the handover with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          15. SAFETY SECTION
          ================================================== */}
      <section
        id="safety-guidelines"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl bg-[#F3F1EC] border border-gray-900/8 p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0F5348] shrink-0" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-gray-900">
              Practical guidelines for safe local transactions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Meet in a public place.',
                body: 'Choose well-lit cafés, shopping malls, or busy commercial areas in your neighborhood for handovers.',
              },
              {
                title: 'Inspect before paying.',
                body: 'Test electronics, check PTA IMEI status, and verify condition in person before transferring funds.',
              },
              {
                title: 'Never share sensitive financial information.',
                body: 'Keep your banking PINs, OTP codes, and card details private. Only share an IBAN or account number to receive payment.',
              },
              {
                title: 'Avoid suspicious advance-payment requests.',
                body: 'Do not send advance booking fees or courier deposits for items you have not inspected.',
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="bg-white rounded-xl p-4 border border-gray-900/6 space-y-1.5"
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F5348] shrink-0 mt-0.5" />
                  <span>{tip.title}</span>
                </p>
                <p className="text-xs text-gray-600 leading-relaxed pl-5">
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
