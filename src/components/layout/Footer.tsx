import React from 'react';
import { CATEGORIES } from '../../data/categories';
import { useMarketplace } from '../../store/MarketplaceContext';

export const Footer: React.FC = () => {
  const { navigate } = useMarketplace();

  return (
    <footer className="bg-white border-t border-gray-900/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-gray-900/8">
          {/* Brand Column (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="font-display text-2xl font-bold tracking-tight text-gray-900 hover:text-[#0F5348] transition-colors inline-block"
            >
              PHIRSE
            </a>
            <p className="text-sm font-medium text-gray-800">
              Give it another life.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              A modern Pakistani marketplace for buying and selling pre-owned
              products locally across Karachi, Lahore, Islamabad, Rawalpindi,
              Faisalabad, Multan, and Peshawar.
            </p>
          </div>

          {/* Column 1: Browse (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Browse
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/browse')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  All Listings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/browse?sort=newest')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Recently Listed
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/browse?city=Karachi')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Karachi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/browse?city=Lahore')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Lahore
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/browse?city=Islamabad')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Islamabad
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Sell (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Sell
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/sell')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Sell an Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/my-listings')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  My Listings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/offers')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Offers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/messages')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Messages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/account')}
                  className="hover:text-[#0F5348] transition-colors"
                >
                  Account
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Categories
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/categories/${cat.slug}`)}
                    className="hover:text-[#0F5348] transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Safety (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Safety
            </h3>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <li>Meet in a public place</li>
              <li>Inspect before paying</li>
              <li>Never share sensitive banking PINs or OTPs</li>
              <li>Avoid advance-payment requests</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PHIRSE Pakistan. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="hover:text-gray-900 transition-colors"
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => navigate('/sell')}
              className="hover:text-gray-900 transition-colors"
            >
              Sell
            </button>
            <button
              type="button"
              onClick={() => navigate('/favorites')}
              className="hover:text-gray-900 transition-colors"
            >
              Saved Items
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
