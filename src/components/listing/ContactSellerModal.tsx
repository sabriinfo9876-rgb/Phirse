import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';
import { Listing, User } from '../../types/marketplace';
import { formatPKR } from '../../utils/formatters';

interface ContactSellerModalProps {
  isOpen: boolean;
  listing: Listing;
  seller: User;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Is this still available?',
  'Is the price negotiable?',
  'Can I inspect it?',
  'Where can we meet?',
];

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  listing,
  seller,
  onClose,
}) => {
  const { sendMessage, navigate } = useMarketplace();
  const [messageText, setMessageText] = useState('Is this still available?');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessageText('Is this still available?');
      setError('');
    }
  }, [isOpen]);

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
    if (messageText.trim().length < 3) {
      setError('Please enter a message before sending.');
      return;
    }
    const conv = sendMessage(listing.id, seller.id, messageText);
    onClose();
    navigate(`/messages/${conv.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-seller-title"
        className="w-full max-w-lg bg-white rounded-xl border border-gray-900/10 p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#0F5348]" />
            <h2
              id="contact-seller-title"
              className="font-display text-lg font-bold text-gray-900"
            >
              Contact {seller.name}
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

        {/* Listing context */}
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
              <span className="font-price font-semibold text-gray-900">
                {formatPKR(listing.price)}
              </span>{' '}
              · {listing.location}
            </p>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setMessageText(prompt);
                  setError('');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  messageText === prompt
                    ? 'bg-[#EBF3F1] border-[#0F5348] text-[#0F5348]'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="inquiry-message"
              className="block text-xs font-semibold text-gray-800 mb-1.5"
            >
              Your message
            </label>
            <textarea
              id="inquiry-message"
              rows={4}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ask about condition details, battery health, or a convenient public spot to inspect..."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            <p className="text-[11px] text-gray-500 mt-1">
              {seller.responseTime} · Keep communication inside PHIRSE for your safety.
            </p>
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
              className="min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0F5348] hover:bg-[#0B3F36] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
