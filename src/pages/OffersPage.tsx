import React, { useMemo, useState } from 'react';
import { Check, MessageSquare, Tag, X } from 'lucide-react';
import { useMarketplace } from '../store/MarketplaceContext';
import { Offer } from '../types/marketplace';
import { formatPKR, formatRelativeAge } from '../utils/formatters';

export const OffersPage: React.FC = () => {
  const {
    offers,
    currentUser,
    getListingById,
    getUserById,
    respondToOffer,
    navigate,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(
    null
  );
  const [counterInput, setCounterInput] = useState<string>('');
  const [counterError, setCounterError] = useState<string>('');

  const receivedOffers = useMemo(
    () =>
      offers
        .filter((o) => o.sellerId === currentUser.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [offers, currentUser.id]
  );

  const sentOffers = useMemo(
    () =>
      offers
        .filter((o) => o.buyerId === currentUser.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [offers, currentUser.id]
  );

  const displayedOffers =
    activeTab === 'received' ? receivedOffers : sentOffers;

  const handleOpenCounter = (offer: Offer, listedPrice: number) => {
    setCounteringOfferId(offer.id);
    const midpoint = Math.round(((offer.amount + listedPrice) / 2) / 500) * 500;
    setCounterInput(String(midpoint));
    setCounterError('');
  };

  const handleSubmitCounter = (offer: Offer, listedPrice: number) => {
    const val = Number(counterInput);
    if (!Number.isFinite(val) || val <= offer.amount) {
      setCounterError(
        `Counter-offer must be greater than the buyer's offer (${formatPKR(offer.amount)}).`
      );
      return;
    }
    if (val > listedPrice * 1.1) {
      setCounterError(
        `Counter-offer cannot exceed ${formatPKR(Math.round(listedPrice * 1.1))}.`
      );
      return;
    }
    respondToOffer(offer.id, 'counter', Math.round(val));
    setCounteringOfferId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-xl border border-gray-900/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Offers
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Review incoming offers on your listings or track offers you have sent
            to sellers.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Offers tabs"
          className="inline-flex items-center gap-1 p-1 bg-gray-200/75 rounded-lg self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'received'}
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'received'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Received ({receivedOffers.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sent'}
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'sent'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sent ({sentOffers.length})
          </button>
        </div>
      </div>

      {displayedOffers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-900/10 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-gray-900">
            {activeTab === 'received'
              ? 'No incoming offers yet'
              : 'You haven’t sent any offers yet'}
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            {activeTab === 'received'
              ? 'When prospective buyers submit an offer on your active listings, you can accept, decline, or counter here.'
              : 'Open any listing and click "Make Offer" to propose a price to the seller.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/browse')}
            className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold transition-colors"
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOffers.map((offer) => {
            const listing = getListingById(offer.listingId);
            const buyer = getUserById(offer.buyerId);
            const seller = getUserById(offer.sellerId);
            const otherParty = activeTab === 'received' ? buyer : seller;
            if (!listing) return null;

            const statusLabelMap: Record<Offer['status'], string> = {
              pending: 'Pending Seller Response',
              accepted: 'Accepted',
              declined: 'Declined',
              countered: `Countered at ${formatPKR(offer.counterAmount || offer.amount)}`,
              expired: 'Expired',
            };

            return (
              <div
                key={offer.id}
                className="bg-white rounded-xl border border-gray-900/10 p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      onClick={() => navigate(`/listing/${listing.id}`)}
                      className="w-20 h-16 rounded-lg object-cover bg-gray-100 shrink-0 cursor-pointer"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <span>
                          {activeTab === 'received' ? 'From buyer' : 'To seller'}:{' '}
                          <strong className="text-gray-900">
                            {otherParty?.name || 'User'}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeAge(offer.createdAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            offer.status === 'accepted'
                              ? 'text-emerald-700'
                              : offer.status === 'declined'
                              ? 'text-red-700'
                              : offer.status === 'countered'
                              ? 'text-amber-700'
                              : 'text-[#0F5348]'
                          }`}
                        >
                          {statusLabelMap[offer.status]}
                        </span>
                      </div>

                      <h3
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className="text-base font-bold text-gray-900 hover:text-[#0F5348] cursor-pointer truncate"
                      >
                        {listing.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm tabular-nums pt-0.5">
                        <span>
                          Offered:{' '}
                          <strong className="font-price text-gray-900">
                            {formatPKR(offer.amount)}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-gray-500">
                          Listed price:{' '}
                          <span className="font-price">
                            {formatPKR(listing.price)}
                          </span>
                        </span>
                        {offer.counterAmount && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-800 font-semibold">
                              Counter-offer:{' '}
                              <span className="font-price">
                                {formatPKR(offer.counterAmount)}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      {offer.message && (
                        <p className="text-xs text-gray-600 italic pt-1">
                          "{offer.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Seller actions when offer is pending */}
                    {activeTab === 'received' && offer.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => respondToOffer(offer.id, 'accept')}
                          className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCounter(offer, listing.price)}
                          className="min-h-[38px] px-4 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 text-xs font-semibold whitespace-nowrap"
                        >
                          Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToOffer(offer.id, 'decline')}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {/* Buyer actions when seller has countered */}
                    {activeTab === 'sent' && offer.status === 'countered' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            respondToOffer(offer.id, 'accept_counter')
                          }
                          className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap tabular-nums"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            Accept Counter (
                            {formatPKR(offer.counterAmount || offer.amount)})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            respondToOffer(offer.id, 'decline_counter')
                          }
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold whitespace-nowrap"
                        >
                          Decline Counter
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate('/messages')}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Messages</span>
                    </button>
                  </div>
                </div>

                {/* Inline counter-offer input panel */}
                {counteringOfferId === offer.id && (
                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-lg">
                    <div className="space-y-1">
                      <label
                        htmlFor={`counter-input-${offer.id}`}
                        className="block text-xs font-semibold text-gray-900"
                      >
                        Propose counter-offer amount (PKR)
                      </label>
                      {counterError && (
                        <p className="text-xs text-red-600">{counterError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`counter-input-${offer.id}`}
                        type="number"
                        step="500"
                        value={counterInput}
                        onChange={(e) => {
                          setCounterInput(e.target.value);
                          if (counterError) setCounterError('');
                        }}
                        className="w-36 min-h-[38px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-price text-sm font-bold text-gray-900 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitCounter(offer, listing.price)}
                        className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F5348] text-white text-xs font-semibold hover:bg-[#0B3F36] whitespace-nowrap"
                      >
                        Send Counter
                      </button>
                      <button
                        type="button"
                        onClick={() => setCounteringOfferId(null)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
