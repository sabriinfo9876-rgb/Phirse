import React, { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import { ListingCard } from '../components/listing/ListingCard';
import {
  CONDITION_TOOLTIP_DESCRIPTIONS,
  InfoTooltip,
} from '../components/ui/InfoTooltip';
import { CATEGORIES, getCategoryBySlug, getCategoryName } from '../data/categories';
import { CITIES, getAreasForCity } from '../data/locations';
import { POPULAR_SEARCHES } from '../data/seedData';
import { useMarketplace } from '../store/MarketplaceContext';
import {
  ItemCondition,
  ListingAgeFilter,
  SortOption,
} from '../types/marketplace';
import { formatPKR } from '../utils/formatters';

const CONDITIONS: ItemCondition[] = [
  'Like New',
  'Excellent',
  'Good',
  'Fair',
  'For Parts',
];

const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under Rs. 25,000', min: '', max: '25000' },
  { label: 'Rs. 25k – 50k', min: '25000', max: '50000' },
  { label: 'Rs. 50k – 100k', min: '50000', max: '100000' },
  { label: 'Rs. 100k – 250k', min: '100000', max: '250000' },
  { label: 'Above Rs. 250,000', min: '250000', max: '' },
];

interface BrowsePageProps {
  categorySlugFromRoute?: string;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ categorySlugFromRoute }) => {
  const {
    listings,
    searchParams,
    navigate,
    getUserById,
    addRecentSearch,
  } = useMarketplace();

  // Initialize filter state from URL query parameters or route category
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('q') || ''
  );
  const [debouncedQuery, setDebouncedQuery] = useState(
    () => searchParams.get('q') || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => categorySlugFromRoute || searchParams.get('category') || ''
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    () => searchParams.get('subcategory') || ''
  );
  const [minPrice, setMinPrice] = useState<string>(
    () => searchParams.get('minPrice') || ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    () => searchParams.get('maxPrice') || ''
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    () => searchParams.get('city') || ''
  );
  const [selectedArea, setSelectedArea] = useState<string>(
    () => searchParams.get('area') || ''
  );
  const [selectedConditions, setSelectedConditions] = useState<ItemCondition[]>(
    []
  );
  const [sellerType, setSellerType] = useState<
    'all' | 'Individual' | 'Frequent Seller'
  >('all');
  const [listingAge, setListingAge] = useState<ListingAgeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'sold'>(
    'active'
  );
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  // Sync route category changes
  useEffect(() => {
    if (categorySlugFromRoute !== undefined) {
      setSelectedCategory(categorySlugFromRoute);
      setSelectedSubcategory('');
    }
  }, [categorySlugFromRoute]);

  // Sync URL query param changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const area = searchParams.get('area') || '';
    const minP = searchParams.get('minPrice') || '';
    const maxP = searchParams.get('maxPrice') || '';
    const sortParam = searchParams.get('sort') as SortOption | null;
    const cat = categorySlugFromRoute || searchParams.get('category') || '';
    setSearchInput(q);
    setDebouncedQuery(q);
    setSelectedCity(city);
    setSelectedArea(area);
    setMinPrice(minP);
    setMaxPrice(maxP);
    if (cat) setSelectedCategory(cat);
    if (
      sortParam &&
      ['relevance', 'newest', 'price_asc', 'price_desc'].includes(sortParam)
    ) {
      setSortBy(sortParam);
    }
  }, [searchParams, categorySlugFromRoute]);

  // Debounce search input (180ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      if (searchInput.trim().length >= 3) {
        addRecentSearch(searchInput.trim());
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchInput, addRecentSearch]);

  const activeCategoryObj = useMemo(
    () => (selectedCategory ? getCategoryBySlug(selectedCategory) : undefined),
    [selectedCategory]
  );

  const availableAreas = useMemo(
    () => (selectedCity ? getAreasForCity(selectedCity) : []),
    [selectedCity]
  );

  const toggleCondition = (cond: ItemCondition) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCity('');
    setSelectedArea('');
    setSelectedConditions([]);
    setSellerType('all');
    setListingAge('all');
    setStatusFilter('active');
    setSortBy('relevance');
    navigate('/browse', { replace: true });
  };

  // Filtered and sorted listings
  const filteredListings = useMemo(() => {
    const nowMs = Date.now();
    const minVal = minPrice ? Number(minPrice) : null;
    const maxVal = maxPrice ? Number(maxPrice) : null;
    const qLower = debouncedQuery.toLowerCase();

    const matches = listings.filter((item) => {
      // Never show disabled or draft items in public browse
      if (item.status === 'disabled' || item.status === 'draft' || item.status === 'paused') {
        return false;
      }
      if (statusFilter === 'active' && item.status !== 'active') return false;
      if (statusFilter === 'sold' && item.status !== 'sold') return false;

      if (selectedCategory && item.category !== selectedCategory) return false;
      if (
        selectedSubcategory &&
        item.subcategory.toLowerCase() !== selectedSubcategory.toLowerCase()
      ) {
        return false;
      }

      if (minVal !== null && Number.isFinite(minVal) && item.price < minVal) {
        return false;
      }
      if (maxVal !== null && Number.isFinite(maxVal) && item.price > maxVal) {
        return false;
      }

      if (selectedCity && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedArea && item.area.toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }

      if (
        selectedConditions.length > 0 &&
        !selectedConditions.includes(item.condition)
      ) {
        return false;
      }

      if (sellerType !== 'all') {
        const seller = getUserById(item.sellerId);
        if (seller?.sellerType !== sellerType) return false;
      }

      if (listingAge !== 'all') {
        const createdMs = new Date(item.createdAt).getTime();
        const ageDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
        if (listingAge === '24h' && ageDays > 2) return false;
        if (listingAge === '7d' && ageDays > 7) return false;
        if (listingAge === '30d' && ageDays > 30) return false;
      }

      if (qLower) {
        const catName = getCategoryName(item.category).toLowerCase();
        const haystack = `${item.title} ${item.brand} ${item.model} ${catName} ${item.subcategory} ${item.description} ${item.location}`.toLowerCase();
        const terms = qLower.split(/\s+/).filter(Boolean);
        return terms.every((t) => haystack.includes(t));
      }

      return true;
    });

    return matches.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price_desc') {
        return b.price - a.price;
      }
      // Relevance: prioritize exact title/brand matches, then recency & saves
      if (qLower) {
        const aTitleMatch = a.title.toLowerCase().includes(qLower) ? 1 : 0;
        const bTitleMatch = b.title.toLowerCase().includes(qLower) ? 1 : 0;
        if (aTitleMatch !== bTitleMatch) return bTitleMatch - aTitleMatch;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    listings,
    statusFilter,
    selectedCategory,
    selectedSubcategory,
    minPrice,
    maxPrice,
    selectedCity,
    selectedArea,
    selectedConditions,
    sellerType,
    listingAge,
    debouncedQuery,
    sortBy,
    getUserById,
  ]);

  // Active filter tags for quick removal
  const activeFilterPills = useMemo(() => {
    const items: { key: string; label: string; onRemove: () => void }[] = [];
    if (debouncedQuery) {
      items.push({
        key: 'q',
        label: `Search: "${debouncedQuery}"`,
        onRemove: () => {
          setSearchInput('');
          setDebouncedQuery('');
        },
      });
    }
    if (selectedCategory) {
      items.push({
        key: 'cat',
        label: `Category: ${getCategoryName(selectedCategory)}`,
        onRemove: () => {
          setSelectedCategory('');
          setSelectedSubcategory('');
          if (categorySlugFromRoute) navigate('/browse');
        },
      });
    }
    if (selectedSubcategory) {
      items.push({
        key: 'subcat',
        label: `Subcategory: ${selectedSubcategory}`,
        onRemove: () => setSelectedSubcategory(''),
      });
    }
    if (selectedCity) {
      items.push({
        key: 'city',
        label: `City: ${selectedCity}`,
        onRemove: () => {
          setSelectedCity('');
          setSelectedArea('');
        },
      });
    }
    if (selectedArea) {
      items.push({
        key: 'area',
        label: `Area: ${selectedArea}`,
        onRemove: () => setSelectedArea(''),
      });
    }
    if (minPrice) {
      items.push({
        key: 'minPrice',
        label: `Min: ${formatPKR(Number(minPrice))}`,
        onRemove: () => setMinPrice(''),
      });
    }
    if (maxPrice) {
      items.push({
        key: 'maxPrice',
        label: `Max: ${formatPKR(Number(maxPrice))}`,
        onRemove: () => setMaxPrice(''),
      });
    }
    selectedConditions.forEach((cond) => {
      items.push({
        key: `cond-${cond}`,
        label: `Condition: ${cond}`,
        onRemove: () => toggleCondition(cond),
      });
    });
    if (sellerType !== 'all') {
      items.push({
        key: 'sellerType',
        label: `Seller: ${sellerType}`,
        onRemove: () => setSellerType('all'),
      });
    }
    if (listingAge !== 'all') {
      items.push({
        key: 'age',
        label: `Listed: Last ${listingAge}`,
        onRemove: () => setListingAge('all'),
      });
    }
    if (statusFilter !== 'active') {
      items.push({
        key: 'status',
        label: `Status: ${statusFilter}`,
        onRemove: () => setStatusFilter('active'),
      });
    }
    return items;
  }, [
    debouncedQuery,
    selectedCategory,
    selectedSubcategory,
    selectedCity,
    selectedArea,
    minPrice,
    maxPrice,
    selectedConditions,
    sellerType,
    listingAge,
    statusFilter,
    categorySlugFromRoute,
    navigate,
  ]);

  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <label
          htmlFor="filter-category"
          className="block text-xs font-semibold text-gray-900"
        >
          Category
        </label>
        <select
          id="filter-category"
          value={selectedCategory}
          onChange={(e) => {
            const next = e.target.value;
            setSelectedCategory(next);
            setSelectedSubcategory('');
            if (categorySlugFromRoute && !next) {
              navigate('/browse');
            }
          }}
          className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="filter-subcategory"
            className="block text-xs font-semibold text-gray-900"
          >
            Subcategory
          </label>
          <select
            id="filter-subcategory"
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
          >
            <option value="">All in {activeCategoryObj.name}</option>
            {activeCategoryObj.subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price Range (PKR) with Interactive Slider & Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="block text-xs font-semibold text-gray-900">
            Price Range (PKR)
          </span>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
              }}
              className="text-[11px] font-semibold text-[#0F5348] hover:underline"
            >
              Reset price
            </button>
          )}
        </div>

        {/* Interactive Max Budget Slider */}
        <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-lg border border-gray-200/80">
          <div className="flex items-center justify-between text-[11px] text-gray-600 tabular-nums">
            <span>Max budget cap:</span>
            <strong className="font-price text-gray-900">
              {maxPrice ? formatPKR(Number(maxPrice)) : 'Any price'}
            </strong>
          </div>
          <input
            type="range"
            min="5000"
            max="450000"
            step="5000"
            aria-label="Maximum price slider in PKR"
            value={maxPrice ? Math.min(450000, Number(maxPrice)) : 450000}
            onChange={(e) => {
              const val = Number(e.target.value);
              setMaxPrice(val >= 450000 ? '' : String(val));
            }}
            className="w-full accent-[#0F5348] cursor-pointer h-1.5 bg-gray-200 rounded-lg"
          />
          <div className="flex items-center justify-between text-[10px] text-gray-400 tabular-nums">
            <span>Rs. 5k</span>
            <span>Rs. 150k</span>
            <span>Rs. 300k</span>
            <span>Rs. 450k+</span>
          </div>
        </div>

        {/* Min / Max Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-min-price" className="sr-only">
              Minimum Price
            </label>
            <input
              id="filter-min-price"
              type="number"
              min="0"
              step="1000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min Rs."
              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 tabular-nums focus:border-[#0F5348] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="sr-only">
              Maximum Price
            </label>
            <input
              id="filter-max-price"
              type="number"
              min="0"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max Rs."
              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 tabular-nums focus:border-[#0F5348] focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Price Range Preset Pills */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {PRICE_PRESETS.slice(1).map((preset) => {
            const isSelected =
              minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setMinPrice('');
                    setMaxPrice('');
                  } else {
                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors tabular-nums ${
                  isSelected
                    ? 'bg-[#0F5348] border-[#0F5348] text-white'
                    : 'bg-white hover:bg-[#FAF8F5] border-gray-200 text-gray-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* City & Area */}
      <div className="space-y-2">
        <label
          htmlFor="filter-city"
          className="block text-xs font-semibold text-gray-900"
        >
          City
        </label>
        <select
          id="filter-city"
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setSelectedArea('');
          }}
          className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
        >
          <option value="">All Cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {selectedCity && availableAreas.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="filter-area"
            className="block text-xs font-semibold text-gray-900"
          >
            Neighborhood Area ({selectedCity})
          </label>
          <select
            id="filter-area"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
          >
            <option value="">All Areas in {selectedCity}</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Condition */}
      <fieldset className="space-y-2">
        <div className="flex items-center gap-1.5">
          <legend className="text-xs font-semibold text-gray-900">
            Condition
          </legend>
          <InfoTooltip
            label="Condition Grading Guide"
            content="Hover or tap any condition grade to view PHIRSE's standardized physical & functional criteria."
            align="left"
          />
        </div>
        <div className="space-y-1.5">
          {CONDITIONS.map((cond) => {
            const checked = selectedConditions.includes(cond);
            return (
              <div
                key={cond}
                className="flex items-center justify-between gap-2 text-sm text-gray-700 py-0.5"
              >
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCondition(cond)}
                    className="w-4 h-4 rounded accent-[#0F5348]"
                  />
                  <span>{cond}</span>
                </label>
                <InfoTooltip
                  label={cond}
                  content={CONDITION_TOOLTIP_DESCRIPTIONS[cond] || cond}
                  align="right"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Seller Type */}
      <div className="space-y-2">
        <label
          htmlFor="filter-seller-type"
          className="block text-xs font-semibold text-gray-900"
        >
          Seller Type
        </label>
        <select
          id="filter-seller-type"
          value={sellerType}
          onChange={(e) =>
            setSellerType(e.target.value as 'all' | 'Individual' | 'Frequent Seller')
          }
          className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
        >
          <option value="all">All Sellers</option>
          <option value="Individual">Individual Owners</option>
          <option value="Frequent Seller">Frequent Sellers</option>
        </select>
      </div>

      {/* Listing Age */}
      <div className="space-y-2">
        <label
          htmlFor="filter-listing-age"
          className="block text-xs font-semibold text-gray-900"
        >
          Listing Age
        </label>
        <select
          id="filter-listing-age"
          value={listingAge}
          onChange={(e) => setListingAge(e.target.value as ListingAgeFilter)}
          className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
        >
          <option value="all">Any Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Availability Status */}
      <div className="space-y-2">
        <label
          htmlFor="filter-status"
          className="block text-xs font-semibold text-gray-900"
        >
          Status
        </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'active' | 'all' | 'sold')
          }
          className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
        >
          <option value="active">Available Listings Only</option>
          <option value="all">Available + Sold History</option>
          <option value="sold">Sold Items Only</option>
        </select>
      </div>

      {activeFilterPills.length > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All Filters</span>
        </button>
      )}
    </div>
  );

  const visibleItems = filteredListings.slice(0, visibleCount);

  // Compute live price trend stats across current filtered results
  const resultPriceStats = useMemo(() => {
    if (filteredListings.length === 0) return null;
    const prices = filteredListings.map((l) => l.price).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const mid = Math.floor(prices.length / 2);
    const median =
      prices.length % 2 !== 0
        ? prices[mid]
        : Math.round((prices[mid - 1] + prices[mid]) / 2);
    return { min, median, max };
  }, [filteredListings]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-900/10 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {activeCategoryObj
                ? activeCategoryObj.name
                : 'Browse Pre-Owned Listings'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {activeCategoryObj
                ? activeCategoryObj.description
                : 'Search by keyword, brand, model, or filter by neighborhood across Pakistan.'}
            </p>
          </div>

          {/* Sort and Mobile Filter Trigger */}
          <div className="w-full md:w-auto flex flex-wrap items-center justify-between sm:justify-start gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden min-h-[40px] px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              <span>
                Filters
                {activeFilterPills.length > 0
                  ? ` (${activeFilterPills.length})`
                  : ''}
              </span>
            </button>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <label
                htmlFor="sort-select"
                className="text-xs font-medium text-gray-600 whitespace-nowrap"
              >
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="min-h-[40px] rounded-lg border border-gray-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0F5348] focus:outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search input bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by keyword, title, brand (e.g., Apple, Lenovo, Sony, Canon)..."
            aria-label="Search listings"
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-lg border border-gray-300 bg-[#F8F9FA] focus:bg-white text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedQuery('');
              }}
              aria-label="Clear search input"
              className="absolute right-3 p-1 text-gray-400 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Interactive Price Filter Bar (Desktop & Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-xs font-semibold text-gray-500 shrink-0 mr-1">
            Price filter:
          </span>
          {PRICE_PRESETS.map((preset) => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap tabular-nums shrink-0 ${
                  active
                    ? 'bg-[#0F5348] border-[#0F5348] text-white'
                    : 'bg-[#FAF8F5] hover:bg-[#EBF3F1] border-gray-200/90 text-gray-700 hover:text-[#0F5348]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Active filter buttons & result count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-gray-600 tabular-nums">
            Showing{' '}
            <strong className="font-semibold text-gray-900">
              {filteredListings.length}
            </strong>{' '}
            {filteredListings.length === 1 ? 'listing' : 'listings'}
          </p>

          {activeFilterPills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterPills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={pill.onRemove}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>{pill.label}</span>
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#0F5348] hover:underline px-1 whitespace-nowrap"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main layout: Desktop Filter Sidebar + Listing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside
          aria-label="Filter listings"
          className="hidden lg:block lg:col-span-3 bg-white rounded-xl border border-gray-900/10 p-5 sticky top-20"
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-900/10">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0F5348]" />
              <h2 className="text-sm font-bold text-gray-900">Filters</h2>
            </div>
            {activeFilterPills.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#0F5348] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          {renderFilterControls()}
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-9 space-y-6">
          {/* Live Market Price Trend Snapshot Bar */}
          {resultPriceStats && (
            <div className="bg-white rounded-xl border border-gray-900/10 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0F5348] shrink-0" />
                <span className="font-semibold text-gray-900">
                  Price Range Snapshot
                </span>
                <InfoTooltip
                  label="Live Result Price Trends"
                  content="Shows the lowest, median, and highest asking prices across the listings matching your current filters."
                  detail="Click Median to filter up to the median price."
                  align="left"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600 tabular-nums">
                <button
                  type="button"
                  onClick={() => setSortBy('price_asc')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Lowest:{' '}
                  <strong className="font-price text-gray-900">
                    {formatPKR(resultPriceStats.min)}
                  </strong>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setMaxPrice(String(resultPriceStats.median))}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Median:{' '}
                  <strong className="font-price text-[#0F5348]">
                    {formatPKR(resultPriceStats.median)}
                  </strong>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setSortBy('price_desc')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Highest:{' '}
                  <strong className="font-price text-gray-900">
                    {formatPKR(resultPriceStats.max)}
                  </strong>
                </button>
              </div>
            </div>
          )}

          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-900/10 p-10 text-center space-y-4">
              <p className="font-display text-lg font-bold text-gray-900">
                No matching listings found
              </p>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                We couldn’t find any items matching your current search and filter
                combination. Try broadening your price range or clearing filters.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="min-h-[40px] px-5 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  Clear All Filters
                </button>
                {POPULAR_SEARCHES.slice(0, 3).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      clearAllFilters();
                      setSearchInput(term);
                      setDebouncedQuery(term);
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-colors"
                  >
                    Try "{term}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleItems.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>

              {visibleCount < filteredListings.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 9)}
                    className="min-h-[44px] px-6 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-sm font-semibold transition-colors tabular-nums"
                  >
                    Load More ({filteredListings.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Sheet */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/50 backdrop-blur-xs"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="w-full max-w-sm bg-white h-full flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-900/10 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-gray-900">
                Filter Listings
              </h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
                className="min-w-[40px] min-h-[40px] rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterControls()}
            </div>

            <div className="p-4 border-t border-gray-900/10 flex items-center gap-3 bg-white">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-lg bg-[#0F5348] text-white text-xs font-semibold hover:bg-[#0B3F36] tabular-nums"
              >
                Show {filteredListings.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
