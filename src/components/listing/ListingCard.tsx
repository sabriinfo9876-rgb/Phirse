import React, { useState } from 'react';
import { Heart, Image as ImageIcon, Tag } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';
import { Listing } from '../../types/marketplace';
import { formatPKR, formatRelativeAge } from '../../utils/formatters';
import { MakeOfferModal } from './MakeOfferModal';

interface ListingCardProps {
  listing: Listing;
  savedDateLabel?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, savedDateLabel }) => {
  const {
    navigate,
    isFavorite,
    toggleFavorite,
    isAuthenticated,
    currentUser,
    pushToast,
  } = useMarketplace();
  const [imgError, setImgError] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const saved = isFavorite(listing.id);
  const isOwnListing = isAuthenticated && listing.sellerId === currentUser.id;
  const primaryImage = listing.images[0] || '';

  const handleQuickMakeOffer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      pushToast({
        title: 'Please log in to make an offer',
        variant: 'default',
      });
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`);
      return;
    }
    setOfferModalOpen(true);
  };

  return (
    <>
      <article
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="group cursor-pointer bg-white rounded-xl border border-gray-900/8 overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-gray-900/15 flex flex-col"
      >
        {/* Image container (4:3 aspect ratio, visual focus, subtle hover scale) */}
        <div className="relative aspect-4/3 w-full bg-[#F3F1EC] overflow-hidden">
          {!imgError && primaryImage ? (
            <img
              src={primaryImage}
              alt={listing.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F3F1EC]">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs font-medium text-gray-600 line-clamp-2">
                {listing.title}
              </span>
            </div>
          )}

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(listing.id);
            }}
            aria-label={
              saved
                ? `Remove ${listing.title} from saved items`
                : `Save ${listing.title}`
            }
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/92 hover:bg-white text-gray-800 flex items-center justify-center shadow-xs transition-transform duration-150 active:scale-90"
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-150 ${
                saved ? 'fill-red-600 text-red-600' : 'text-gray-700 hover:text-gray-900'
              }`}
            />
          </button>

          {/* Optional image count */}
          {listing.images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/65 text-white text-xs tabular-nums font-medium">
              1/{listing.images.length}
            </div>
          )}

          {listing.status !== 'active' && (
            <div className="absolute inset-x-0 bottom-0 bg-gray-900/85 text-white text-xs font-semibold py-1.5 px-3 text-center">
              {listing.status === 'sold'
                ? 'Sold'
                : listing.status === 'paused'
                ? 'Paused'
                : listing.status === 'draft'
                ? 'Draft'
                : 'Unavailable'}
            </div>
          )}
        </div>

        {/* Card Body: TITLE -> PRICE -> LOCATION -> CONDITION & POSTED TIME */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            {/* Title */}
            <h3 className="text-[15px] sm:text-base font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-[#0F5348] transition-colors">
              {listing.title}
            </h3>

            {/* Price & Quick Make Offer */}
            <div className="flex items-center justify-between gap-2">
              <p className="font-price text-lg font-bold text-gray-900 tabular-nums tracking-tight">
                {formatPKR(listing.price)}
              </p>
              {listing.status === 'active' && !isOwnListing && (
                <button
                  type="button"
                  onClick={handleQuickMakeOffer}
                  className="px-2.5 py-1 rounded-md bg-[#FAF8F5] hover:bg-[#EBF3F1] border border-gray-200 hover:border-[#0F5348]/40 text-[11px] font-semibold text-[#0F5348] flex items-center gap-1 transition-colors shrink-0"
                >
                  <Tag className="w-3 h-3" />
                  <span>Make Offer</span>
                </button>
              )}
            </div>
          </div>

          {/* Location + Condition & Posted Time */}
          <div className="pt-2.5 border-t border-gray-900/6 space-y-1">
            <p className="text-[13px] text-gray-600 truncate">
              {listing.location}
            </p>
            <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">
                {listing.condition}
              </span>
              <span className="shrink-0 tabular-nums">
                {savedDateLabel || formatRelativeAge(listing.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </article>

      {offerModalOpen && (
        <MakeOfferModal
          isOpen={offerModalOpen}
          listing={listing}
          onClose={() => setOfferModalOpen(false)}
        />
      )}
    </>
  );
};
