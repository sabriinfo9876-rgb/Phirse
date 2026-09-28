import React, { useEffect, useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';
import { Listing, ReportReason } from '../../types/marketplace';

interface ReportListingModalProps {
  isOpen: boolean;
  listing: Listing;
  onClose: () => void;
}

const REPORT_REASONS: ReportReason[] = [
  'Scam',
  'Misleading information',
  'Prohibited item',
  'Duplicate',
  'Wrong category',
  'Other',
];

export const ReportListingModal: React.FC<ReportListingModalProps> = ({
  isOpen,
  listing,
  onClose,
}) => {
  const { submitReport } = useMarketplace();
  const [reason, setReason] = useState<ReportReason>('Misleading information');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('Misleading information');
      setDescription('');
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
    submitReport(listing.id, reason, description);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-listing-title"
        className="w-full max-w-md bg-white rounded-xl border border-gray-900/10 p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Flag className="w-5 h-5 text-red-600" />
            <div>
              <h2
                id="report-listing-title"
                className="font-display text-lg font-bold text-gray-900"
              >
                Report Listing
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                {listing.id} · {listing.title}
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-gray-800 mb-1.5">
              Reason for reporting
            </legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  reason === r
                    ? 'border-[#0F5348] bg-[#EBF3F1]/50 font-medium text-gray-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-[#0F5348]"
                />
                <span>{r}</span>
              </label>
            ))}
          </fieldset>

          <div>
            <label
              htmlFor="report-description"
              className="block text-xs font-semibold text-gray-800 mb-1.5"
            >
              Additional details (optional)
            </label>
            <textarea
              id="report-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what looks inaccurate or suspicious..."
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
              className="min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
