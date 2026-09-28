import React, { useMemo } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { ListingCard } from '../components/listing/ListingCard';
import { useMarketplace } from '../store/MarketplaceContext';
import { formatRelativeAge } from '../utils/formatters';

export const FavoritesPage: React.FC = () => {
  const { favorites, currentUser, getListingById, navigate } = useMarketplace();

  const savedEntries = useMemo(() => {
    return favorites
      .filter((f) => f.userId === currentUser.id)
      .map((f) => {
        const listing = getListingById(f.listingId);
        return listing ? { favorite: f, listing } : null;
      })
      .filter(
        (entry): entry is NonNullable<typeof entry> => entry !== null
      );
  }, [favorites, currentUser.id, getListingById]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-900/8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
            Saved items
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Products you have bookmarked to compare, inspect, or make an offer on.
          </p>
        </div>
        <span className="text-xs sm:text-sm font-semibold text-gray-600 tabular-nums">
          {savedEntries.length} saved {savedEntries.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {savedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-900/8 p-12 sm:p-16 text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-gray-200 text-gray-500 flex items-center justify-center mx-auto">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900">
            Nothing saved yet.
          </h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            Save something you like and come back to it later.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold transition-colors inline-flex items-center gap-2"
            >
              <span>Browse listings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedEntries.map(({ favorite, listing }) => (
            <ListingCard
              key={favorite.id}
              listing={listing}
              savedDateLabel={`Saved ${formatRelativeAge(favorite.createdAt)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
