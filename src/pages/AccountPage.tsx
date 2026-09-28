import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Edit3,
  Heart,
  LogOut,
  MessageSquare,
  Package,
  RotateCcw,
  Star,
  Tag,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { ListingCard } from '../components/listing/ListingCard';
import { CITIES, getAreasForCity } from '../data/locations';
import { useMarketplace } from '../store/MarketplaceContext';
import { ContactPreference } from '../types/marketplace';
import { formatPKR, formatRelativeAge, formatShortDate } from '../utils/formatters';
import { createAvatarSvg } from '../utils/studioVisuals';

interface AccountPageProps {
  initialSection?: 'overview' | 'settings';
  sellerProfileId?: string;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  initialSection = 'overview',
  sellerProfileId,
}) => {
  const {
    users,
    currentUser,
    listings,
    favorites,
    offers,
    conversations,
    recentlyViewed,
    reviews,
    getUserById,
    getListingById,
    updateProfile,
    addReview,
    clearRecentlyViewed,
    switchDemoUser,
    resetDemoData,
    logout,
    navigate,
    supabaseStatus,
    setSupabaseModalOpen,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'recently_viewed' | 'settings'
  >(initialSection === 'settings' ? 'settings' : 'profile');

  useEffect(() => {
    if (initialSection === 'settings') {
      setActiveTab('settings');
    }
  }, [initialSection]);

  // Profile edit state
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [city, setCity] = useState(currentUser.city);
  const [area, setArea] = useState(currentUser.area);
  const [bio, setBio] = useState(currentUser.bio);
  const [contactPreference, setContactPreference] = useState<ContactPreference>(
    currentUser.contactPreference
  );
  const [avatarColor, setAvatarColor] = useState('#0F5348');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setCity(currentUser.city);
    setArea(currentUser.area);
    setBio(currentUser.bio);
    setContactPreference(currentUser.contactPreference);
  }, [currentUser]);

  // Review form state (on Seller Profile)
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Determine if viewing another seller's public profile (/seller/:id)
  const inspectedSeller = sellerProfileId
    ? getUserById(sellerProfileId)
    : currentUser;

  const sellerListings = useMemo(
    () =>
      inspectedSeller
        ? listings.filter(
            (l) => l.sellerId === inspectedSeller.id && l.status === 'active'
          )
        : [],
    [listings, inspectedSeller]
  );

  const sellerSoldListings = useMemo(
    () =>
      inspectedSeller
        ? listings.filter(
            (l) => l.sellerId === inspectedSeller.id && l.status === 'sold'
          )
        : [],
    [listings, inspectedSeller]
  );

  const sellerReviews = useMemo(
    () =>
      inspectedSeller
        ? reviews.filter((r) => r.sellerId === inspectedSeller.id)
        : [],
    [reviews, inspectedSeller]
  );

  const recentViewedListings = useMemo(() => {
    return recentlyViewed
      .map((rv) => {
        const item = getListingById(rv.listingId);
        return item ? { item, viewedAt: rv.viewedAt } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [recentlyViewed, getListingById]);

  if (!inspectedSeller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Seller profile not found
        </h1>
        <button
          type="button"
          onClick={() => navigate('/browse')}
          className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] text-white text-sm font-semibold"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  // PUBLIC SELLER PROFILE VIEW (/seller/:id)
  if (sellerProfileId) {
    const avgRating =
      sellerReviews.length >= 1
        ? (
            sellerReviews.reduce((acc, r) => acc + r.rating, 0) /
            sellerReviews.length
          ).toFixed(1)
        : null;

    const handleAddReview = (e: React.FormEvent) => {
      e.preventDefault();
      if (reviewComment.trim().length < 8) {
        setReviewError('Please write a brief, honest comment (at least 8 characters).');
        return;
      }
      const refListingId =
        sellerSoldListings[0]?.id || sellerListings[0]?.id || 'PHR-842731';
      addReview(
        inspectedSeller.id,
        refListingId,
        reviewRating,
        reviewComment
      );
      setReviewComment('');
      setReviewError('');
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="bg-white rounded-xl border border-gray-900/10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={inspectedSeller.avatar}
              alt={inspectedSeller.name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-gray-900">
                  {inspectedSeller.name}
                </h1>
                {inspectedSeller.verifiedStatus && (
                  <span className="text-xs font-semibold text-[#0F5348]">
                    · Verified Member
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                {inspectedSeller.location} · Joined{' '}
                {formatShortDate(inspectedSeller.joinedAt)} ·{' '}
                {inspectedSeller.sellerType}
              </p>
              <p className="text-xs sm:text-sm text-gray-700 max-w-2xl pt-1">
                {inspectedSeller.bio}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600 tabular-nums border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
            <div>
              <p className="text-base font-bold text-gray-900">
                {sellerListings.length}
              </p>
              <p>Active Listings</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {inspectedSeller.soldCount}
              </p>
              <p>Sold Items</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {inspectedSeller.responseRate}%
              </p>
              <p>Response Rate</p>
            </div>
            {avgRating && (
              <div>
                <p className="text-base font-bold text-gray-900">
                  {avgRating} / 5.0
                </p>
                <p>{sellerReviews.length} Reviews</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Listings by Seller */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-gray-900">
            Active Listings by {inspectedSeller.name} ({sellerListings.length})
          </h2>
          {sellerListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-900/10 p-8 text-center text-sm text-gray-600">
              No active listings at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellerListings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}
        </div>

        {/* Seller Reviews Section (Section 33) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t border-gray-900/10">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900">
              Completed Interaction Reviews ({sellerReviews.length})
            </h2>
            {sellerReviews.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-900/10 p-6 text-sm text-gray-600">
                No buyer reviews recorded yet for this seller.
              </div>
            ) : (
              <div className="space-y-3">
                {sellerReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-xl border border-gray-900/10 p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold text-gray-900">
                        {rev.reviewerName} · {rev.rating} / 5 stars
                      </span>
                      <span className="tabular-nums">
                        {formatShortDate(rev.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <p className="text-xs text-gray-400">
                      Item: {rev.listingTitle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave a review after a completed interaction */}
          {inspectedSeller.id !== currentUser.id && (
            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-900/10 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#0F5348]" />
                <h3 className="font-display text-base font-bold text-gray-900">
                  Leave a Seller Review
                </h3>
              </div>
              <p className="text-xs text-gray-600">
                Completed a local purchase with {inspectedSeller.name}? Share
                concise feedback to help future buyers.
              </p>

              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label
                    htmlFor="review-rating"
                    className="block text-xs font-semibold text-gray-800 mb-1"
                  >
                    Rating
                  </label>
                  <select
                    id="review-rating"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    <option value={5}>5 — Excellent communication & item as described</option>
                    <option value={4}>4 — Good overall experience</option>
                    <option value={3}>3 — Fair / Acceptable</option>
                    <option value={2}>2 — Below expectations</option>
                    <option value={1}>1 — Poor experience</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs font-semibold text-gray-800 mb-1"
                  >
                    Short Review *
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => {
                      setReviewComment(e.target.value);
                      if (reviewError) setReviewError('');
                    }}
                    placeholder="e.g., Met at Clifton Block 5, item condition matched photos."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                  {reviewError && (
                    <p className="text-xs text-red-600 mt-1">{reviewError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold transition-colors"
                >
                  Publish Review
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PERSONAL ACCOUNT HUB (/account and /settings)
  const myListingsCount = listings.filter(
    (l) => l.sellerId === currentUser.id
  ).length;
  const myFavoritesCount = favorites.filter(
    (f) => f.userId === currentUser.id
  ).length;
  const myOffersCount = offers.filter(
    (o) => o.buyerId === currentUser.id || o.sellerId === currentUser.id
  ).length;
  const myConversationsCount = conversations.filter(
    (c) => c.buyerId === currentUser.id || c.sellerId === currentUser.id
  ).length;

  const availableAreas = getAreasForCity(city);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!city || !area) {
      setFormError('Please select both your city and neighborhood area.');
      return;
    }
    setFormError('');
    const initials = name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2);

    updateProfile({
      name,
      email,
      phone,
      city,
      area,
      bio,
      contactPreference,
      avatar: createAvatarSvg(initials || 'PH', avatarColor),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Banner */}
      <div className="bg-white rounded-xl border border-gray-900/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {currentUser.name}
              </h1>
              {currentUser.verifiedStatus && (
                <span className="text-xs font-semibold text-[#0F5348]">
                  · Verified
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {currentUser.location} · {currentUser.responseTime}
            </p>
            {(currentUser.email || currentUser.phone) && (
              <p className="text-xs text-gray-500 font-mono">
                {currentUser.email || 'zainab@phirse.pk'}
                {currentUser.phone ? ` · ${currentUser.phone}` : ''}
              </p>
            )}
            <p className="text-xs text-gray-500 max-w-xl">{currentUser.bio}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => navigate(`/seller/${currentUser.id}`)}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 transition-colors whitespace-nowrap"
          >
            View Public Seller Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Account Navigation Sections (Section 39) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => navigate('/my-listings')}
          className="p-4 rounded-xl bg-white border border-gray-900/10 hover:border-[#0F5348] text-left transition-colors space-y-1"
        >
          <Package className="w-4 h-4 text-[#0F5348]" />
          <p className="text-sm font-bold text-gray-900">My Listings</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {myListingsCount} items
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/favorites')}
          className="p-4 rounded-xl bg-white border border-gray-900/10 hover:border-[#0F5348] text-left transition-colors space-y-1"
        >
          <Heart className="w-4 h-4 text-[#0F5348]" />
          <p className="text-sm font-bold text-gray-900">Favorites</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {myFavoritesCount} saved
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/messages')}
          className="p-4 rounded-xl bg-white border border-gray-900/10 hover:border-[#0F5348] text-left transition-colors space-y-1"
        >
          <MessageSquare className="w-4 h-4 text-[#0F5348]" />
          <p className="text-sm font-bold text-gray-900">Messages</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {myConversationsCount} threads
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/offers')}
          className="p-4 rounded-xl bg-white border border-gray-900/10 hover:border-[#0F5348] text-left transition-colors space-y-1"
        >
          <Tag className="w-4 h-4 text-[#0F5348]" />
          <p className="text-sm font-bold text-gray-900">Offers</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {myOffersCount} total
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recently_viewed')}
          className={`p-4 rounded-xl border text-left transition-colors space-y-1 ${
            activeTab === 'recently_viewed'
              ? 'border-[#0F5348] bg-[#EBF3F1]/40'
              : 'bg-white border-gray-900/10 hover:border-[#0F5348]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#0F5348]" />
          <p className="text-sm font-bold text-gray-900">Recently Viewed</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {recentViewedListings.length} items
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`p-4 rounded-xl border text-left transition-colors space-y-1 ${
            activeTab === 'settings'
              ? 'border-[#0F5348] bg-[#EBF3F1]/40'
              : 'bg-white border-gray-900/10 hover:border-[#0F5348]'
          }`}
        >
          <Edit3 className="w-4 h-4 text-[#0F5348]" />
          <p className="text-sm font-bold text-gray-900">Settings</p>
          <p className="text-xs text-gray-500">Profile & Demo</p>
        </button>
      </div>

      {/* Sub-view: Recently Viewed (Section 27) */}
      {(activeTab === 'profile' || activeTab === 'recently_viewed') && (
        <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">
                Recently Viewed Listings
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Bounded history of the last 10 items you inspected.
              </p>
            </div>
            {recentViewedListings.length > 0 && (
              <button
                type="button"
                onClick={clearRecentlyViewed}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {recentViewedListings.length === 0 ? (
            <div className="p-8 text-center space-y-3 border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm font-semibold text-gray-900">
                No recently viewed items yet
              </p>
              <p className="text-xs text-gray-500">
                Open any product listing to inspect its specifications and it
                will appear here for quick access.
              </p>
              <button
                type="button"
                onClick={() => navigate('/browse')}
                className="px-4 py-2 rounded-lg bg-[#0F5348] text-white text-xs font-semibold"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentViewedListings.map(({ item, viewedAt }) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/listing/${item.id}`)}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-[#0F5348] cursor-pointer flex items-center gap-3.5 transition-colors"
                >
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-16 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="font-price text-xs font-bold text-[#0F5348] tabular-nums">
                      {formatPKR(item.price)}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate tabular-nums">
                      {item.location} · Viewed {formatRelativeAge(viewedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-view: Profile Editing & Settings (Section 40) */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-xl border border-gray-900/10 p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900">
                Edit Profile
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update your name, avatar badge, default Pakistani city/area, and
                contact preference.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[42px] rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Avatar Theme Color
                </span>
                <div className="flex items-center gap-2.5">
                  {[
                    '#0F5348',
                    '#1E3A8A',
                    '#7C2D12',
                    '#4C1D95',
                    '#14532D',
                    '#831843',
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setAvatarColor(hex)}
                      aria-label={`Select avatar color ${hex}`}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        avatarColor === hex
                          ? 'border-gray-900 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-city"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    City *
                  </label>
                  <select
                    id="profile-city"
                    value={city}
                    onChange={(e) => {
                      const nextCity = e.target.value;
                      setCity(nextCity);
                      const areas = getAreasForCity(nextCity);
                      setArea(areas[0] || '');
                    }}
                    className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="profile-area"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Neighborhood Area *
                  </label>
                  <select
                    id="profile-area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {availableAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-contact-pref"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Default Contact Preference
                </label>
                <select
                  id="profile-contact-pref"
                  value={contactPreference}
                  onChange={(e) =>
                    setContactPreference(e.target.value as ContactPreference)
                  }
                  className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="Messages & Offers">
                    In-App Messages & Structured Offers
                  </option>
                  <option value="In-App Messages">In-App Messages Only</option>
                  <option value="Flexible Meetup">
                    Flexible Local Inspection & Meetup
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="profile-bio"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Short Bio
                </label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
                />
              </div>

              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Demo Persona Switcher & Reset Data Card */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-gray-900/10 p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0F5348]" />
                <h3 className="font-display text-base font-bold text-gray-900">
                  Interactive Demo Session Controls
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Switch active demo persona to test buyer and seller perspectives
                (sending offers, countering, and replying to messages), or
                restore factory demo data.
              </p>
            </div>

            <div className="space-y-2">
              {users.slice(0, 4).map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => switchDemoUser(u.id)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'border-[#0F5348] bg-[#EBF3F1]/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {u.location}
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-semibold text-[#0F5348] shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-900/10 space-y-2.5">
              <button
                type="button"
                onClick={() => setSupabaseModalOpen(true)}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#EBF3F1] hover:bg-[#0F5348] text-[#0F5348] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>
                  Supabase Cloud Setup & Live CRUD Test ({supabaseStatus})
                </span>
              </button>
              <button
                type="button"
                onClick={resetDemoData}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Dataset to Default</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
