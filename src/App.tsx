import React, { useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { SupabaseSetupModal } from './components/layout/SupabaseSetupModal';
import { ToastContainer } from './components/layout/ToastContainer';
import { AccountPage } from './pages/AccountPage';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { AuthPage } from './pages/AuthPage';
import { BrowsePage } from './pages/BrowsePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OffersPage } from './pages/OffersPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SellWizardPage } from './pages/SellWizardPage';
import { MarketplaceProvider, useMarketplace } from './store/MarketplaceContext';

const MarketplaceShell: React.FC = () => {
  const { pathname, isAuthenticated } = useMarketplace();
  const [notifOpen, setNotifOpen] = useState(false);

  const renderPage = () => {
    if (pathname === '/') {
      return <HomePage />;
    }
    if (pathname === '/login') {
      return <AuthPage initialMode="login" />;
    }
    if (pathname === '/signup' || pathname === '/register') {
      return <AuthPage initialMode="signup" />;
    }
    if (pathname === '/browse') {
      return <BrowsePage />;
    }
    if (pathname.startsWith('/categories/')) {
      const slug = decodeURIComponent(pathname.replace('/categories/', ''));
      return <BrowsePage categorySlugFromRoute={slug} />;
    }
    if (pathname.startsWith('/listing/')) {
      const id = decodeURIComponent(pathname.replace('/listing/', ''));
      return <ListingDetailPage listingId={id} />;
    }
    if (pathname.startsWith('/seller/')) {
      const sellerId = decodeURIComponent(pathname.replace('/seller/', ''));
      return <AccountPage sellerProfileId={sellerId} />;
    }
    if (pathname === '/admin') {
      return <AdminModerationPage />;
    }

    // Protected member routes require authentication
    if (!isAuthenticated) {
      if (
        pathname === '/sell' ||
        pathname.startsWith('/sell/edit/') ||
        pathname === '/favorites' ||
        pathname === '/messages' ||
        pathname.startsWith('/messages/') ||
        pathname === '/offers' ||
        pathname === '/my-listings' ||
        pathname === '/account' ||
        pathname === '/settings'
      ) {
        return <AuthPage initialMode="login" redirectTo={pathname} />;
      }
    }

    if (pathname === '/sell') {
      return <SellWizardPage />;
    }
    if (pathname.startsWith('/sell/edit/')) {
      const editId = decodeURIComponent(pathname.replace('/sell/edit/', ''));
      return <SellWizardPage editListingId={editId} />;
    }
    if (pathname === '/favorites') {
      return <FavoritesPage />;
    }
    if (pathname === '/messages') {
      return <MessagesPage />;
    }
    if (pathname.startsWith('/messages/')) {
      const convId = decodeURIComponent(pathname.replace('/messages/', ''));
      return <MessagesPage activeConversationId={convId} />;
    }
    if (pathname === '/offers') {
      return <OffersPage />;
    }
    if (pathname === '/my-listings') {
      return <SellerDashboardPage />;
    }
    if (pathname === '/account') {
      return <AccountPage initialSection="overview" />;
    }
    if (pathname === '/settings') {
      return <AccountPage initialSection="settings" />;
    }
    return <NotFoundPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#111827] overflow-x-hidden pb-16 md:pb-0">
      <SupabaseSetupModal />
      <Header onOpenNotifications={() => setNotifOpen(true)} />
      <main id="main-content" className="flex-1 w-full">
        {renderPage()}
      </main>
      <Footer />
      <MobileNav />
      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MarketplaceProvider>
      <MarketplaceShell />
    </MarketplaceProvider>
  );
}
