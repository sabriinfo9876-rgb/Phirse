import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMarketplace } from '../store/MarketplaceContext';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useMarketplace();

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
      <p className="font-price text-xs font-semibold text-[#0F5348] tracking-wider uppercase">
        404 · Page Not Found
      </p>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
        Looks like this listing went somewhere else.
      </h1>
      <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
        The page or listing you requested could not be found. Explore active
        listings across Pakistan to find what you need.
      </p>
      <div className="pt-2">
        <button
          type="button"
          onClick={() => navigate('/browse')}
          className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>
      </div>
    </div>
  );
};
