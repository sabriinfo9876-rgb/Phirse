import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Expand,
  Flag,
  Heart,
  MessageSquare,
  Share2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { ContactSellerModal } from '../components/listing/ContactSellerModal';
import { ImageViewerModal } from '../components/listing/ImageViewerModal';
import { ListingCard } from '../components/listing/ListingCard';
import { MakeOfferModal } from '../components/listing/MakeOfferModal';
import { PriceTrendsModule } from '../components/listing/PriceTrendsModule';
import { ReportListingModal } from '../components/listing/ReportListingModal';
import {
  CONDITION_TOOLTIP_DESCRIPTIONS,
  InfoTooltip,
} from '../components/ui/InfoTooltip';
import { getCategoryName } from '../data/categories';
import { useMarketplace } from '../store/MarketplaceContext';
import {
  formatPKR,
  formatRelativeAge,
  formatShortDate,
} from '../utils/formatters';

interface ListingDetailPageProps {
  listingId: string;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listingId,
}) => {
  const {
    listings,
    getListingById,
    getUserById,
    currentUser,
    isAuthenticated,
    isFavorite,
    toggleFavorite,
    recordView,
    navigate,
    pushToast,
    reviews,
    offers,
    createOffer,
  } = useMarketplace();

  const listing = getListingById(listingId);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    if (listingId) {
      recordView(listingId);
    }
  }, [listingId, recordView]);

  const seller = useMemo(
    () => (listing ? getUserById(listing.sellerId) : undefined),
    [listing, getUserById]
  );

  const sellerReviews = useMemo(
    () => (seller ? reviews.filter((r) => r.sellerId === seller.id) : []),
    [seller, reviews]
  );

  const sellerActiveListingsCount = useMemo(
    () =>
      seller
        ? listings.filter((l) => l.sellerId === seller.id && l.status === 'active')
            .length
        : 0,
    [seller, listings]
  );

  // Related listings: same category, similar price, or nearby location (excluding current item)
  const relatedListings = useMemo(() => {
    if (!listing) return [];
    const others = listings.filter(
      (l) => l.id !== listing.id && l.status === 'active'
    );
    return others
      .map((item) => {
        let score = 0;
        if (item.category === listing.category) score += 4;
        if (item.city === listing.city) score += 2;
        const priceRatio =
          Math.abs(item.price - listing.price) / Math.max(1, listing.price);
        if (priceRatio <= 0.35) score += 2;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.item);
  }, [listing, listings]);

  if (!listing || !seller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Looks like this listing went somewhere else.
        </h1>
        <p className="text-sm text-gray-600">
          The listing ID ({listingId}) could not be found or may have been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/browse')}
          className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold transition-colors"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  const saved = isAuthenticated && isFavorite(listing.id);
  const isOwnListing = isAuthenticated && listing.sellerId === currentUser.id;
  const images = listing.images.length > 0 ? listing.images : [''];

  const requireAuth = (actionLabel: string, callback: () => void) => {
    if (!isAuthenticated) {
      pushToast({
        title: `Please log in to ${actionLabel}`,
        variant: 'default',
      });
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`);
      return;
    }
    callback();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${listing.title} — PHIRSE`,
          text: `${listing.title} (${formatPKR(listing.price)}) in ${listing.location}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy if user cancels or share fails
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushToast({ title: 'Link copied', variant: 'success' });
    } catch {
      pushToast({ title: 'Link copied', variant: 'success' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
      {/* Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/browse')}
            className="inline-flex items-center gap-1.5 font-semibold text-gray-900 hover:text-[#0F5348] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Browse</span>
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => navigate(`/categories/${listing.category}`)}
            className="hover:text-gray-900 hover:underline"
          >
            {getCategoryName(listing.category)}
          </button>
          {listing.subcategory && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-gray-500">{listing.subcategory}</span>
            </>
          )}
        </div>
        <span className="font-price text-xs text-gray-500 tabular-nums">
          Listing ID: {listing.id}
        </span>
      </div>

      {/* Main 2-column layout: Left Gallery + Details, Right Contiguous Action & Seller Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 columns: Gallery + Description + Specifications */}
        <div className="lg:col-span-7 space-y-8">
          {/* Gallery */}
          <div className="bg-white rounded-xl border border-gray-900/10 overflow-hidden p-3 sm:p-4 space-y-3">
            <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-[#F3F4F6] group">
              <img
                src={images[activeImageIdx]}
                alt={`${listing.title} — photo ${activeImageIdx + 1}`}
                referrerPolicy="no-referrer"
                onClick={() => setViewerOpen(true)}
                className="w-full h-full object-cover cursor-zoom-in"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx(
                        (prev) => (prev - 1 + images.length) % images.length
                      )
                    }
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) => (prev + 1) % images.length)
                    }
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                aria-label="Open fullscreen image viewer"
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white text-xs font-medium flex items-center gap-1.5 transition-colors tabular-nums"
              >
                <Expand className="w-3.5 h-3.5" />
                <span>
                  {activeImageIdx + 1} / {images.length} · Fullscreen
                </span>
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pt-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    aria-label={`Select photo ${idx + 1}`}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      idx === activeImageIdx
                        ? 'border-[#0F5348] opacity-100'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Description & Specifications */}
          <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-6">
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold text-gray-900">
                Item Description
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Key Specifications Table */}
            <div className="pt-6 border-t border-gray-900/10 space-y-3">
              <h3 className="font-display text-base font-bold text-gray-900">
                Item Details & Specifications
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-900/5">
                  <dt className="text-gray-500">Brand</dt>
                  <dd className="font-medium text-gray-900">
                    {listing.brand || 'Unbranded'}
                  </dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-900/5">
                  <dt className="text-gray-500">Model</dt>
                  <dd className="font-medium text-gray-900">
                    {listing.model || 'Standard'}
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-900/5">
                  <dt className="text-gray-500 flex items-center gap-1.5">
                    <span>Condition</span>
                    <InfoTooltip
                      label={`Condition: ${listing.condition}`}
                      content={
                        CONDITION_TOOLTIP_DESCRIPTIONS[listing.condition] ||
                        listing.condition
                      }
                      align="left"
                    />
                  </dt>
                  <dd className="font-medium text-gray-900">{listing.condition}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-900/5">
                  <dt className="text-gray-500">Location</dt>
                  <dd className="font-medium text-gray-900">{listing.location}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-900/5">
                  <dt className="text-gray-500">Listed Date</dt>
                  <dd className="font-medium text-gray-900 tabular-nums">
                    {formatShortDate(listing.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-900/5">
                  <dt className="text-gray-500 flex items-center gap-1.5">
                    <span>Preferred Contact</span>
                    <InfoTooltip
                      label="Contact Preference"
                      content="Indicates whether the seller welcomes structured price negotiations or prefers direct messages only."
                      align="left"
                    />
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {listing.contactPreference}
                  </dd>
                </div>
                {listing.specs?.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between items-center py-2 border-b border-gray-900/5"
                  >
                    <dt className="text-gray-500 flex items-center gap-1.5">
                      <span>{spec.label}</span>
                      {spec.label.toLowerCase().includes('pta') && (
                        <InfoTooltip
                          label="PTA Approval Status"
                          content="Official PTA-approved devices are registered with the Pakistan Telecommunication Authority and work on all local SIM networks without restriction."
                          align="left"
                        />
                      )}
                    </dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Interactive Price Trends & Market Range Module */}
            <div className="pt-4 border-t border-gray-900/10">
              <PriceTrendsModule
                categorySlug={listing.category}
                subcategory={listing.subcategory}
                currentPrice={listing.price}
                currentCondition={listing.condition}
                allListings={listings}
              />
            </div>
          </div>
        </div>

        {/* Right 5 columns: Sticky Contiguous Purchase/Inquiry Module + Seller Card + Safety */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {/* Primary Product & Action Module */}
          <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-5">
            {/* Unboxed metadata line */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              <span>{getCategoryName(listing.category)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-gray-800">{listing.condition}</span>
              <span aria-hidden="true">·</span>
              <span>Listed {formatRelativeAge(listing.createdAt)}</span>
            </div>

            <div className="space-y-2">
              <p className="font-price text-3xl sm:text-4xl font-bold text-[#0F5348] tabular-nums tracking-tight">
                {formatPKR(listing.price)}
              </p>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                {listing.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 pt-0.5">
                Condition:{' '}
                <strong className="font-semibold text-gray-900">
                  {listing.condition}
                </strong>{' '}
                · Location:{' '}
                <strong className="font-semibold text-gray-900">
                  {listing.location}
                </strong>
              </p>
            </div>

            {listing.status !== 'active' ? (
              <div className="p-3.5 rounded-lg bg-gray-100 border border-gray-300 text-xs sm:text-sm font-semibold text-gray-800">
                This item is currently marked as{' '}
                <span className="uppercase">{listing.status}</span>.
              </div>
            ) : isOwnListing ? (
              <div className="space-y-2.5 pt-2">
                <p className="text-xs text-gray-500">
                  You are the seller of this listing.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/sell/edit/${listing.id}`)}
                    className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Listing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/my-listings')}
                    className="min-h-[44px] px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Manage Status
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    requireAuth('message the seller', () => setContactOpen(true))
                  }
                  className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message seller</span>
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      requireAuth('make an offer', () => setOfferOpen(true))
                    }
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Tag className="w-4 h-4 text-[#0F5348]" />
                    <span>Make offer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(listing.id)}
                    className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                      saved
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        saved ? 'fill-red-600 text-red-600' : 'text-gray-600'
                      }`}
                    />
                    <span>{saved ? 'Saved' : 'Favorite'}</span>
                  </button>
                </div>

                {/* Quick 1-Tap Offer Presets */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-700">
                      Quick offer presets:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        requireAuth('make a custom offer', () =>
                          setOfferOpen(true)
                        )
                      }
                      className="text-[#0F5348] font-semibold hover:underline"
                    >
                      Custom amount →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: '5% Off',
                        amount:
                          Math.round((listing.price * 0.95) / 500) * 500,
                      },
                      {
                        label: '10% Off',
                        amount:
                          Math.round((listing.price * 0.9) / 500) * 500,
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          requireAuth('send a quick offer', () => {
                            createOffer(
                              listing.id,
                              preset.amount,
                              `Quick offer (${preset.label}): ${formatPKR(preset.amount)}`
                            );
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EBF3F1] border border-gray-200 hover:border-[#0F5348]/40 text-xs font-medium text-gray-800 hover:text-[#0F5348] flex items-center justify-between transition-colors tabular-nums"
                      >
                        <span className="text-gray-500">{preset.label}</span>
                        <strong className="font-price font-bold text-gray-900">
                          {formatPKR(preset.amount)}
                        </strong>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active offer status for current buyer if exists */}
                {isAuthenticated &&
                  (() => {
                    const myOffer = offers.find(
                      (o) =>
                        o.listingId === listing.id &&
                        o.buyerId === currentUser.id
                    );
                    if (!myOffer) return null;
                    return (
                      <div className="p-3 rounded-lg bg-[#EBF3F1]/70 border border-[#0F5348]/20 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-gray-900">
                            Your offer:{' '}
                          </span>
                          <strong className="font-price text-[#0F5348] tabular-nums">
                            {formatPKR(
                              myOffer.counterAmount || myOffer.amount
                            )}
                          </strong>{' '}
                          <span className="uppercase text-[11px] font-bold text-gray-600">
                            ({myOffer.status})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/offers')}
                          className="font-semibold text-[#0F5348] underline whitespace-nowrap"
                        >
                          Manage →
                        </button>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Secondary Utility Actions: Save, Share, Report */}
            <div className="pt-4 border-t border-gray-900/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(listing.id)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Heart
                  className={`w-4 h-4 ${
                    saved ? 'fill-red-600 text-red-600' : 'text-gray-600'
                  }`}
                />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="min-h-[40px] px-3 py-1.5 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg hover:bg-red-50 text-xs font-semibold text-gray-600 hover:text-red-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Seller Profile Summary Card */}
          <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-gray-900">
                      {seller.name}
                    </h2>
                    {seller.verifiedStatus && (
                      <span className="text-xs font-semibold text-[#0F5348]">
                        · Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {seller.location} · Member since{' '}
                    {new Date(seller.joinedAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">{seller.bio}</p>

            {/* Unboxed seller activity metrics */}
            <div className="pt-3 border-t border-gray-900/10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 tabular-nums">
              <span>
                <strong className="text-gray-900">{sellerActiveListingsCount}</strong>{' '}
                active listings
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-gray-900">{seller.soldCount}</strong> sold
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-gray-900">{seller.responseRate}%</strong>{' '}
                response rate
              </span>
            </div>

            <p className="text-xs text-gray-500">{seller.responseTime}</p>

            {sellerReviews.length > 0 && (
              <div className="pt-3 border-t border-gray-900/10 space-y-2">
                <p className="text-xs font-semibold text-gray-900">
                  Recent buyer note ({sellerReviews.length}{' '}
                  {sellerReviews.length === 1 ? 'review' : 'reviews'})
                </p>
                <blockquote className="text-xs text-gray-600 italic">
                  "{sellerReviews[0].comment}" — {sellerReviews[0].reviewerName}
                </blockquote>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate(`/seller/${seller.id}`)}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-800 transition-colors"
            >
              View Seller Profile & All Listings
            </button>
          </div>

          {/* Concise Safety Box */}
          <div className="bg-white rounded-xl border border-gray-900/10 p-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0F5348]" />
              <h3 className="text-xs font-bold text-gray-900">
                Safe Local Meetup Checklist
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-600 list-disc list-inside leading-relaxed">
              <li>Meet in a busy public place during daylight hours.</li>
              <li>Inspect the item, ports, and serial numbers before paying.</li>
              <li>Avoid sending advance deposits to unknown accounts.</li>
              <li>Keep messages and offers on PHIRSE for clear records.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION: Related Listings ("You may also like") */}
      {relatedListings.length > 0 && (
        <section className="pt-8 border-t border-gray-900/10 space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
                Similar listings
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Other pre-owned items in {getCategoryName(listing.category)} and nearby cities.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/categories/${listing.category}`)}
              className="text-xs sm:text-sm font-semibold text-[#0F5348] hover:underline whitespace-nowrap"
            >
              More in {getCategoryName(listing.category)} →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedListings.map((rel) => (
              <ListingCard key={rel.id} listing={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Primary Action Bar (kept concise so total sticky < 15% viewport) */}
      {!isOwnListing && listing.status === 'active' && (
        <div className="md:hidden fixed bottom-14 inset-x-0 z-20 bg-white border-t border-gray-900/10 px-4 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-price text-sm font-bold text-gray-900 tabular-nums truncate">
              {formatPKR(listing.price)}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{listing.location}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                requireAuth('make an offer', () => setOfferOpen(true))
              }
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-900 bg-white"
            >
              Make offer
            </button>
            <button
              type="button"
              onClick={() =>
                requireAuth('message the seller', () => setContactOpen(true))
              }
              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F5348] text-white text-xs font-semibold"
            >
              Message seller
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ImageViewerModal
        isOpen={viewerOpen}
        images={images}
        initialIndex={activeImageIdx}
        title={listing.title}
        onClose={() => setViewerOpen(false)}
      />
      <ContactSellerModal
        isOpen={contactOpen}
        listing={listing}
        seller={seller}
        onClose={() => setContactOpen(false)}
      />
      <MakeOfferModal
        isOpen={offerOpen}
        listing={listing}
        onClose={() => setOfferOpen(false)}
      />
      <ReportListingModal
        isOpen={reportOpen}
        listing={listing}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
};
