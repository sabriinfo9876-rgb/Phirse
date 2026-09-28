import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  Clock,
  Compass,
  Heart,
  Home,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Tag,
  TrendingUp,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { CITIES } from '../../data/locations';
import { useMarketplace } from '../../store/MarketplaceContext';

interface HeaderProps {
  onOpenNotifications: () => void;
}

const POPULAR_SEARCHES = [
  'iPhone 13 PTA',
  'ThinkPad T14',
  'PlayStation 5',
  'Canon 200D II',
  'Sheesham Desk',
  'Sony WH-1000XM5',
];

const NEARBY_SUGGESTIONS = [
  { label: 'Clifton, Karachi', city: 'Karachi', area: 'Clifton' },
  { label: 'Gulshan-e-Iqbal, Karachi', city: 'Karachi', area: 'Gulshan-e-Iqbal' },
  { label: 'DHA, Lahore', city: 'Lahore', area: 'DHA' },
  { label: 'Gulberg, Lahore', city: 'Lahore', area: 'Gulberg' },
  { label: 'F-7, Islamabad', city: 'Islamabad', area: 'F-7' },
];

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    pathname,
    searchParams,
    navigate,
    unreadMessagesCount,
    unreadNotificationsCount,
    pendingOffersCount,
    favorites,
    currentUser,
    isAuthenticated,
    logout,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    listings,
  } = useMarketplace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [isScrolled, setIsScrolled] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setSearchFocused(false);
    setCategoriesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const myFavoritesCount = isAuthenticated
    ? favorites.filter((f) => f.userId === currentUser.id).length
    : 0;

  const isActive = (target: string) => {
    if (target === '/browse') {
      return pathname === '/browse';
    }
    if (target === '/categories') {
      return pathname.startsWith('/categories/');
    }
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const executeSearch = (term: string, extraParams?: Record<string, string>) => {
    const clean = term.trim();
    if (clean) {
      addRecentSearch(clean);
    }
    const params = new URLSearchParams();
    if (clean) params.set('q', clean);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }
    const qs = params.toString();
    setSearchFocused(false);
    setMobileSearchOpen(false);
    navigate(qs ? `/browse?${qs}` : '/browse');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchValue);
  };

  // Matching live suggestions when typing
  const matchingListings = searchValue.trim()
    ? listings
        .filter(
          (l) =>
            l.status === 'active' &&
            (l.title.toLowerCase().includes(searchValue.toLowerCase()) ||
              l.brand.toLowerCase().includes(searchValue.toLowerCase()) ||
              l.location.toLowerCase().includes(searchValue.toLowerCase()))
        )
        .slice(0, 4)
    : [];

  const renderSearchPopoverContent = () => (
    <div className="p-4 sm:p-5 space-y-5 text-left">
      {/* Live matching items when typing */}
      {searchValue.trim().length > 0 && matchingListings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Matching Listings
          </p>
          <div className="divide-y divide-gray-100">
            {matchingListings.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSearchFocused(false);
                  setMobileSearchOpen(false);
                  navigate(`/listing/${item.id}`);
                }}
                className="w-full py-2 px-2 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between gap-3 text-left transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-md object-cover bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.location} · {item.condition}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#0F5348] tabular-nums shrink-0">
                  Rs. {item.price.toLocaleString('en-PK')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent Searches
            </span>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-xs text-gray-500 hover:text-gray-900 font-medium"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearchValue(term);
                  executeSearch(term);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F1] hover:text-[#0F5348] border border-gray-200/80 text-xs font-medium text-gray-700 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Searches */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#0F5348]" />
          Popular Searches
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setSearchValue(term);
                executeSearch(term);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EBF3F1] hover:border-[#0F5348]/30 hover:text-[#0F5348] border border-gray-200 text-xs font-medium text-gray-800 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Price Range Presets */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#0F5348]" />
          Filter by Price (PKR)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Under Rs. 25,000', minPrice: '', maxPrice: '25000' },
            { label: 'Rs. 25k – 50k', minPrice: '25000', maxPrice: '50000' },
            { label: 'Rs. 50k – 100k', minPrice: '50000', maxPrice: '100000' },
            { label: 'Rs. 100k – 250k', minPrice: '100000', maxPrice: '250000' },
            { label: 'Above Rs. 250k', minPrice: '250000', maxPrice: '' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                executeSearch(searchValue, {
                  minPrice: preset.minPrice,
                  maxPrice: preset.maxPrice,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F1] hover:border-[#0F5348]/30 hover:text-[#0F5348] border border-gray-200/80 text-xs font-medium text-gray-800 transition-colors tabular-nums"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories & Nearby Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Categories
          </span>
          <div className="grid grid-cols-2 gap-1">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSearchFocused(false);
                  setMobileSearchOpen(false);
                  navigate(`/categories/${cat.slug}`);
                }}
                className="px-2.5 py-1.5 rounded-md hover:bg-[#FAF8F5] text-xs font-medium text-gray-700 hover:text-[#0F5348] text-left flex items-center justify-between transition-colors"
              >
                <span className="truncate">{cat.name}</span>
                <ArrowUpRight className="w-3 h-3 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#0F5348]" />
            Nearby Neighborhoods
          </span>
          <div className="space-y-1">
            {NEARBY_SUGGESTIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() =>
                  executeSearch(searchValue, {
                    city: loc.city,
                    area: loc.area,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-md hover:bg-[#FAF8F5] text-xs font-medium text-gray-700 hover:text-[#0F5348] text-left flex items-center justify-between transition-colors"
              >
                <span>{loc.label}</span>
                <span className="text-[11px] text-gray-400">Explore →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-900/10'
          : 'bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-gray-900/8'
      }`}
    >
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-6">
        {/* Left: PHIRSE Brand + Primary Navigation Links */}
        <div className="flex items-center gap-6 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-gray-900 hover:text-[#0F5348] transition-colors whitespace-nowrap shrink-0"
          >
            PHIRSE
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-5 text-sm font-medium text-gray-600"
          >
            <a
              href="/browse"
              onClick={(e) => {
                e.preventDefault();
                navigate('/browse');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
                isActive('/browse')
                  ? 'border-[#0F5348] text-gray-900 font-semibold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Browse
            </a>

            {/* Categories Dropdown */}
            <div ref={categoryMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                aria-expanded={categoriesOpen}
                className={`py-1 border-b-2 transition-colors flex items-center gap-1 whitespace-nowrap ${
                  isActive('/categories') || categoriesOpen
                    ? 'border-[#0F5348] text-gray-900 font-semibold'
                    : 'border-transparent hover:text-gray-900'
                }`}
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    categoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-white border border-gray-900/10 shadow-lg p-3 z-40">
                  <div className="grid grid-cols-1 gap-0.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoriesOpen(false);
                          navigate(`/categories/${cat.slug}`);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[#FAF8F5] text-left flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-[#0F5348]">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            {cat.subcategories.slice(0, 3).join(' · ')}
                          </p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0F5348] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href="/favorites"
              onClick={(e) => {
                e.preventDefault();
                navigate('/favorites');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
                isActive('/favorites')
                  ? 'border-[#0F5348] text-gray-900 font-semibold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Favorites{myFavoritesCount > 0 ? ` (${myFavoritesCount})` : ''}
            </a>

            <a
              href="/messages"
              onClick={(e) => {
                e.preventDefault();
                navigate('/messages');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
                isActive('/messages')
                  ? 'border-[#0F5348] text-gray-900 font-semibold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Messages{unreadMessagesCount > 0 ? ` (${unreadMessagesCount})` : ''}
            </a>

            <a
              href="/offers"
              onClick={(e) => {
                e.preventDefault();
                navigate('/offers');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
                isActive('/offers')
                  ? 'border-[#0F5348] text-gray-900 font-semibold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              Offers{pendingOffersCount > 0 ? ` (${pendingOffersCount})` : ''}
            </a>
          </nav>
        </div>

        {/* Center: Large Central Marketplace Search Experience (Desktop & Tablet) */}
        <div
          ref={searchContainerRef}
          className="hidden md:block flex-1 max-w-xl relative"
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search mobiles, laptops, furniture..."
              aria-label="Search mobiles, laptops, furniture"
              className="w-full h-10 pl-10 pr-20 rounded-xl bg-white border border-gray-300/90 hover:border-gray-400 focus:border-[#0F5348] text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none shadow-2xs"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                aria-label="Clear search query"
                className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F1] text-xs font-semibold text-[#0F5348] border border-gray-200/80 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Interactive Search Popover */}
          {searchFocused && (
            <div className="absolute inset-x-0 top-full mt-2 rounded-xl bg-white border border-gray-900/10 shadow-xl z-40 overflow-hidden">
              {renderSearchPopoverContent()}
            </div>
          )}
        </div>

        {/* Right Side: Sell + Account (Desktop) / Search + Menu (Mobile) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((prev) => !prev);
              setMobileMenuOpen(false);
            }}
            aria-label="Search marketplace"
            className="md:hidden min-w-[40px] min-h-[40px] p-2 rounded-lg border border-gray-200/90 bg-white text-gray-700 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`Notifications${
                unreadNotificationsCount > 0
                  ? `, ${unreadNotificationsCount} unread`
                  : ''
              }`}
              className="relative min-w-[40px] min-h-[40px] px-2.5 py-2 rounded-lg text-gray-700 hover:bg-white/80 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="tabular-nums font-bold text-[#0F5348]">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Sell Action */}
          <button
            type="button"
            onClick={() => navigate('/sell')}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Sell</span>
          </button>

          {/* Account / Auth Control */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate('/account')}
              title={`Account (${currentUser.name})`}
              className={`hidden sm:flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive('/account') || isActive('/settings')
                  ? 'border-[#0F5348] bg-[#EBF3F1] text-[#0F5348]'
                  : 'border-gray-200/90 bg-white hover:border-gray-300 text-gray-800'
              }`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
              <span className="max-w-[92px] truncate">Account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`hidden sm:flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive('/login') || isActive('/signup')
                  ? 'border-[#0F5348] bg-[#EBF3F1] text-[#0F5348]'
                  : 'border-gray-300 bg-white hover:border-gray-900 text-gray-800'
              }`}
            >
              <User className="w-4 h-4 text-[#0F5348]" />
              <span>Account</span>
            </button>
          )}

          {/* Mobile / Tablet Menu Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
              setMobileSearchOpen(false);
            }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden min-w-[40px] min-h-[40px] p-2 rounded-lg border border-gray-200/90 bg-white text-gray-700 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Expandable Search Sheet */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search mobiles, laptops, furniture..."
                className="w-full h-11 pl-10 pr-20 rounded-xl bg-[#FAF8F5] border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F5348] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0F5348] text-white text-xs font-semibold"
              >
                Search
              </button>
            </form>
          </div>
          {renderSearchPopoverContent()}
        </div>
      )}

      {/* Mobile & Tablet Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-white border-b border-gray-900/15 shadow-xl z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
            {isAuthenticated ? (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-between gap-3">
                <div
                  onClick={() => navigate('/account')}
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser.location}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:text-red-700 text-xs font-semibold text-gray-700 flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-200 space-y-3">
                <p className="text-xs text-gray-600">
                  Sign in or create an account to list items, save favorites, and message sellers.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#0F5348] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-[#0F5348]" />
                    <span>Sign Up</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {[
                { label: 'Home', href: '/', icon: Home },
                { label: 'Browse Listings', href: '/browse', icon: Compass },
                { label: 'Sell an Item', href: '/sell', icon: Plus },
                { label: 'My Listings', href: '/my-listings', icon: Package },
                {
                  label: `Saved Items${myFavoritesCount > 0 ? ` (${myFavoritesCount})` : ''}`,
                  href: '/favorites',
                  icon: Heart,
                },
                {
                  label: `Messages${unreadMessagesCount > 0 ? ` (${unreadMessagesCount})` : ''}`,
                  href: '/messages',
                  icon: MessageSquare,
                },
                {
                  label: `Offers${pendingOffersCount > 0 ? ` (${pendingOffersCount})` : ''}`,
                  href: '/offers',
                  icon: Tag,
                },
                { label: 'Account & Profile', href: '/account', icon: User },
                { label: 'Moderation', href: '/admin', icon: ShieldAlert },
              ].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                      active
                        ? 'bg-[#EBF3F1] text-[#0F5348] font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#0F5348]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Cities inside Mobile Menu */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Browse by City
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CITIES.slice(0, 7).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => navigate(`/browse?city=${encodeURIComponent(city)}`)}
                    className="px-2.5 py-1 rounded-md bg-[#FAF8F5] hover:bg-[#EBF3F1] text-xs font-medium text-gray-700"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
