import React, { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';
import { Listing } from '../../types/marketplace';
import { formatPKR } from '../../utils/formatters';

interface MakeOfferModalProps {
  isOpen: boolean;
  listing: Listing;
  onClose: () => void;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  isOpen,
  listing,
  onClose,
}) => {
  const { createOffer, navigate } = useMarketplace();
  const suggested95 = Math.round((listing.price * 0.95) / 500) * 500;
  const suggested90 = Math.round((listing.price * 0.9) / 500) * 500;
  const minAllowed = Math.max(200, Math.round(listing.price * 0.5));
  const maxAllowed = Math.round(listing.price * 1.2);

  const [amountInput, setAmountInput] = useState(String(suggested95));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmountInput(String(suggested95));
      setMessage('');
      setError('');
    }
  }, [isOpen, suggested95]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amountInput);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Please enter a valid offer amount in PKR.');
      return;
    }
    if (numeric < minAllowed) {
      setError(
        `Offer is too low. Please enter at least ${formatPKR(minAllowed)} (50% of listed price).`
      );
      return;
    }
    if (numeric > maxAllowed) {
      setError(`Offer cannot exceed ${formatPKR(maxAllowed)}.`);
      return;
    }

    createOffer(listing.id, Math.round(numeric), message);
    onClose();
    navigate('/offers');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="make-offer-title"
        className="w-full max-w-lg bg-white rounded-xl border border-gray-900/10 p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-[#0F5348]" />
            <h2
              id="make-offer-title"
              className="font-display text-lg font-bold text-gray-900"
            >
              Make an Offer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[36px] min-h-[36px] rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Listing summary */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-900/10">
          <img
            src={listing.images[0]}
            alt={listing.title}
            referrerPolicy="no-referrer"
            className="w-14 h-12 rounded object-cover shrink-0 bg-gray-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {listing.title}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Listed price:{' '}
              <span className="font-price font-semibold text-gray-900">
                {formatPKR(listing.price)}
              </span>
            </p>
          </div>
        </div>

        {/* Suggested quick offer buttons */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">Suggested offers:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: `5% off (${formatPKR(suggested95)})`, val: suggested95 },
              { label: `10% off (${formatPKR(suggested90)})`, val: suggested90 },
              { label: `Full Price (${formatPKR(listing.price)})`, val: listing.price },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setAmountInput(String(opt.val));
                  setError('');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap tabular-nums ${
                  Number(amountInput) === opt.val
                    ? 'bg-[#EBF3F1] border-[#0F5348] text-[#0F5348]'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="offer-amount-input"
              className="block text-xs font-semibold text-gray-800 mb-1.5"
            >
              Your offer amount (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                Rs.
              </span>
              <input
                id="offer-amount-input"
                type="number"
                min={minAllowed}
                max={maxAllowed}
                step="100"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (error) setError('');
                }}
                className="w-full rounded-lg border border-gray-300 pl-11 pr-4 py-2.5 font-price text-base font-semibold text-gray-900 focus:border-[#0F5348] focus:outline-none tabular-nums"
              />
            </div>
            {error ? (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1 tabular-nums">
                Valid offer range for this item: {formatPKR(minAllowed)} –{' '}
                {formatPKR(listing.price)}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="offer-note-input"
              className="block text-xs font-semibold text-gray-800 mb-1.5"
            >
              Note to seller (optional)
            </label>
            <textarea
              id="offer-note-input"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Can inspect and pay cash in Clifton tomorrow afternoon."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0F5348] hover:bg-[#0B3F36] rounded-lg transition-colors whitespace-nowrap"
            >
              Submit Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
