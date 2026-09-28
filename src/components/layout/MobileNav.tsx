import React from 'react';
import { Compass, Home, LogIn, MessageSquare, PlusCircle, User } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';

export const MobileNav: React.FC = () => {
  const { pathname, navigate, unreadMessagesCount, isAuthenticated } = useMarketplace();

  const items = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      label: 'Browse',
      href: '/browse',
      icon: Compass,
      active: pathname === '/browse' || pathname.startsWith('/categories/'),
    },
    {
      label: 'Sell',
      href: '/sell',
      icon: PlusCircle,
      active: pathname.startsWith('/sell'),
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badge: unreadMessagesCount,
    },
    {
      label: isAuthenticated ? 'Account' : 'Log In',
      href: isAuthenticated ? '/account' : '/login',
      icon: isAuthenticated ? User : LogIn,
      active:
        pathname === '/account' ||
        pathname === '/settings' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/my-listings' ||
        pathname === '/offers' ||
        pathname === '/favorites',
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white/95 backdrop-blur border-t border-gray-900/10 px-2"
    >
      <div className="grid grid-cols-5 h-full max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors whitespace-nowrap ${
                item.active
                  ? 'text-[#0F5348] font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>
                {item.label}
                {item.badge ? ` (${item.badge})` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
