import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCategoryName } from '../data/categories';
import {
  SEED_CONVERSATIONS,
  SEED_FAVORITES,
  SEED_LISTINGS,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_OFFERS,
  SEED_REPORTS,
  SEED_REVIEWS,
  SEED_USERS,
} from '../data/seedData';
import {
  ContactPreference,
  Conversation,
  Favorite,
  Listing,
  ListingStatus,
  Message,
  NotificationItem,
  Offer,
  RecentlyViewedItem,
  Report,
  ReportReason,
  Review,
  ToastMessage,
  User,
} from '../types/marketplace';
import { formatPKR, generateListingId } from '../utils/formatters';
import { createAvatarSvg } from '../utils/studioVisuals';
import {
  isSupabaseConfigured,
  mapConversationToRow,
  mapFavoriteToRow,
  mapListingToRow,
  mapMessageToRow,
  mapNotificationToRow,
  mapOfferToRow,
  mapReportToRow,
  mapReviewToRow,
  mapRowToConversation,
  mapRowToFavorite,
  mapRowToListing,
  mapRowToMessage,
  mapRowToNotification,
  mapRowToOffer,
  mapRowToReport,
  mapRowToReview,
  mapRowToUser,
  mapUserToRow,
  supabase,
} from '../lib/supabase';

const STORAGE_KEY = 'phirse_mvp_state_v1';

interface PersistedState {
  users: User[];
  currentUserId: string;
  isAuthenticated: boolean;
  listings: Listing[];
  favorites: Favorite[];
  recentlyViewed: RecentlyViewedItem[];
  offers: Offer[];
  conversations: Conversation[];
  messages: Message[];
  reports: Report[];
  reviews: Review[];
  notifications: NotificationItem[];
  recentSearches: string[];
}

const DEFAULT_STATE: PersistedState = {
  users: SEED_USERS,
  currentUserId: 'u-current',
  isAuthenticated: false,
  listings: SEED_LISTINGS,
  favorites: SEED_FAVORITES,
  recentlyViewed: [
    { listingId: 'PHR-842731', viewedAt: '2026-09-26T16:05:00Z' },
    { listingId: 'PHR-842733', viewedAt: '2026-09-26T15:10:00Z' },
    { listingId: 'PHR-842734', viewedAt: '2026-09-25T19:25:00Z' },
  ],
  offers: SEED_OFFERS,
  conversations: SEED_CONVERSATIONS,
  messages: SEED_MESSAGES,
  reports: SEED_REPORTS,
  reviews: SEED_REVIEWS,
  notifications: SEED_NOTIFICATIONS,
  recentSearches: ['iPhone 13 PTA', 'ThinkPad T14', 'Sheesham Desk'],
};

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.listings || !Array.isArray(parsed.listings) || parsed.listings.length === 0) {
      return DEFAULT_STATE;
    }
    const mergedUsers = (parsed.users || DEFAULT_STATE.users).map((u) => {
      const seedMatch = SEED_USERS.find((s) => s.id === u.id);
      return {
        ...seedMatch,
        ...u,
        email: u.email || seedMatch?.email || `${u.id.replace('u-', '')}@phirse.pk`,
        phone: u.phone || seedMatch?.phone || '0300-1234567',
        password: u.password || seedMatch?.password || 'phirse123',
      };
    });
    const mergedListings = parsed.listings.map((l) => {
      const seedListing = SEED_LISTINGS.find((s) => s.id === l.id);
      if (seedListing) {
        return {
          ...l,
          images: seedListing.images,
        };
      }
      return l;
    });
    return {
      users: mergedUsers,
      currentUserId: parsed.currentUserId || DEFAULT_STATE.currentUserId,
      isAuthenticated: typeof parsed.isAuthenticated === 'boolean' ? parsed.isAuthenticated : false,
      listings: mergedListings,
      favorites: parsed.favorites || DEFAULT_STATE.favorites,
      recentlyViewed: parsed.recentlyViewed || DEFAULT_STATE.recentlyViewed,
      offers: parsed.offers || DEFAULT_STATE.offers,
      conversations: parsed.conversations || DEFAULT_STATE.conversations,
      messages: parsed.messages || DEFAULT_STATE.messages,
      reports: parsed.reports || DEFAULT_STATE.reports,
      reviews: parsed.reviews || DEFAULT_STATE.reviews,
      notifications: parsed.notifications || DEFAULT_STATE.notifications,
      recentSearches: parsed.recentSearches || DEFAULT_STATE.recentSearches,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

interface MarketplaceContextValue extends PersistedState {
  currentUser: User;
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  login: (
    identifier: string,
    password: string
  ) => { success: boolean; error?: string; user?: User };
  registerUser: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    city: string;
    area: string;
    sellerType: 'Individual' | 'Frequent Seller';
  }) => { success: boolean; error?: string; user?: User };
  resetUserPassword: (
    identifier: string,
    newPassword: string
  ) => { success: boolean; error?: string };
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  getListingById: (id: string) => Listing | undefined;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
  recordView: (listingId: string) => void;
  clearRecentlyViewed: () => void;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  createListing: (
    data: Omit<
      Listing,
      'id' | 'sellerId' | 'createdAt' | 'updatedAt' | 'views' | 'saves' | 'inquiryCount'
    >
  ) => Listing;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  setListingStatus: (id: string, status: ListingStatus) => void;
  deleteListing: (id: string) => void;
  duplicateListing: (id: string) => Listing | null;
  sendMessage: (listingId: string, recipientId: string, body: string, offerId?: string) => Conversation;
  markConversationRead: (conversationId: string) => void;
  createOffer: (listingId: string, amount: number, message: string) => Offer | null;
  respondToOffer: (
    offerId: string,
    action: 'accept' | 'decline' | 'counter' | 'accept_counter' | 'decline_counter',
    counterAmount?: number
  ) => void;
  submitReport: (listingId: string, reason: ReportReason, description: string) => void;
  resolveReport: (reportId: string, disableListing?: boolean) => void;
  updateProfile: (updates: {
    name: string;
    email?: string;
    phone?: string;
    city: string;
    area: string;
    bio: string;
    contactPreference: ContactPreference;
    avatar?: string;
  }) => void;
  addReview: (sellerId: string, listingId: string, rating: number, comment: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  switchDemoUser: (userId: string) => void;
  resetDemoData: () => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  pendingOffersCount: number;
  supabaseStatus: 'unconfigured' | 'checking' | 'schema_missing' | 'connected' | 'error';
  supabaseError: string | null;
  supabaseModalOpen: boolean;
  setSupabaseModalOpen: (open: boolean) => void;
  refreshSupabaseData: () => Promise<{ ok: boolean; message: string }>;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [locationState, setLocationState] = useState<{ pathname: string; search: string }>(() => ({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
  }));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<
    'unconfigured' | 'checking' | 'schema_missing' | 'connected' | 'error'
  >(isSupabaseConfigured ? 'checking' : 'unconfigured');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Persist state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in constrained environments
    }
  }, [state]);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setLocationState({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    if (options?.replace) {
      window.history.replaceState({}, '', url.pathname + url.search);
    } else {
      window.history.pushState({}, '', url.pathname + url.search);
    }
    setLocationState({
      pathname: url.pathname,
      search: url.search,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Dynamic SEO document title per route
  useEffect(() => {
    const { pathname } = locationState;
    if (pathname === '/') {
      document.title = 'PHIRSE — Give It Another Life | Pre-Owned Marketplace Pakistan';
    } else if (pathname === '/browse') {
      document.title = 'Browse Listings — PHIRSE Marketplace';
    } else if (pathname.startsWith('/categories/')) {
      const slug = pathname.replace('/categories/', '');
      document.title = `${getCategoryName(slug)} — PHIRSE Pakistan`;
    } else if (pathname.startsWith('/listing/')) {
      const id = pathname.replace('/listing/', '');
      const item = state.listings.find((l) => l.id === id);
      document.title = item
        ? `${item.title} (${formatPKR(item.price)}) — PHIRSE`
        : 'Listing Details — PHIRSE';
    } else if (pathname.startsWith('/sell')) {
      document.title = 'Sell an Item — PHIRSE';
    } else if (pathname === '/favorites') {
      document.title = 'Saved Listings — PHIRSE';
    } else if (pathname.startsWith('/messages')) {
      document.title = 'Messages — PHIRSE';
    } else if (pathname === '/offers') {
      document.title = 'Offers — PHIRSE';
    } else if (pathname === '/my-listings') {
      document.title = 'Seller Dashboard — PHIRSE';
    } else if (pathname === '/account' || pathname === '/settings') {
      document.title = 'Account & Settings — PHIRSE';
    } else if (pathname === '/login') {
      document.title = 'Log In — PHIRSE Marketplace';
    } else if (pathname === '/signup' || pathname === '/register') {
      document.title = 'Create Account — PHIRSE Marketplace';
    } else if (pathname === '/admin') {
      document.title = 'Moderation Console (Demo) — PHIRSE';
    } else {
      document.title = 'PHIRSE — Give It Another Life';
    }
  }, [locationState, state.listings]);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Hydrate from Supabase Cloud when VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY are configured
  const refreshSupabaseData = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      setSupabaseStatus('unconfigured');
      return {
        ok: false,
        message: 'Supabase URL and Anon Key are not configured.',
      };
    }

    setSupabaseStatus('checking');
    const client = supabase;

    const [
      profilesRes,
      listingsRes,
      favoritesRes,
      conversationsRes,
      messagesRes,
      offersRes,
      reportsRes,
      reviewsRes,
      notificationsRes,
      authRes,
    ] = await Promise.all([
      client.from('profiles').select('*'),
      client.from('listings').select('*').order('created_at', { ascending: false }),
      client.from('favorites').select('*'),
      client.from('conversations').select('*').order('updated_at', { ascending: false }),
      client.from('messages').select('*').order('created_at', { ascending: true }),
      client.from('offers').select('*').order('created_at', { ascending: false }),
      client.from('reports').select('*').order('created_at', { ascending: false }),
      client.from('reviews').select('*').order('created_at', { ascending: false }),
      client.from('notifications').select('*').order('created_at', { ascending: false }),
      client.auth.getUser(),
    ]);

    if (listingsRes.error) {
      console.warn('[Supabase SELECT listings notice]:', listingsRes.error);
      setSupabaseError(`${listingsRes.error.code || 'ERROR'}: ${listingsRes.error.message}`);
      if (listingsRes.error.code === 'PGRST205') {
        setSupabaseStatus('schema_missing');
        return {
          ok: false,
          message:
            'Connected to Supabase Cloud, but public.listings table is not created yet. Run supabase/schema.sql in your Supabase SQL Editor.',
        };
      }
      setSupabaseStatus('error');
      return {
        ok: false,
        message: listingsRes.error.message,
      };
    }

    // Seed initial marketplace rows into Supabase Cloud if listings table is empty
    let seededListings: Listing[] | null = null;
    if (Array.isArray(listingsRes.data) && listingsRes.data.length === 0) {
      const { error: seedUsersErr } = await client
        .from('profiles')
        .upsert(SEED_USERS.map((u) => mapUserToRow(u)));
      if (seedUsersErr) console.warn('[Supabase seed profiles notice]:', seedUsersErr);

      const { data: upsertedListings, error: seedListingsErr } = await client
        .from('listings')
        .upsert(SEED_LISTINGS.map((l) => mapListingToRow(l)))
        .select();
      if (seedListingsErr) {
        console.warn('[Supabase seed listings notice]:', seedListingsErr);
      } else if (upsertedListings && upsertedListings.length > 0) {
        seededListings = upsertedListings.map((r) =>
          mapRowToListing(r as Record<string, unknown>)
        );
      }

      const { error: seedOffersErr } = await client
        .from('offers')
        .upsert(SEED_OFFERS.map((o) => mapOfferToRow(o)));
      if (seedOffersErr) console.warn('[Supabase seed offers notice]:', seedOffersErr);
    }

    setSupabaseStatus('connected');
    setSupabaseError(null);

    setState((prev) => {
      const remoteUsers =
        profilesRes.data && profilesRes.data.length > 0
          ? profilesRes.data.map((r) => mapRowToUser(r as Record<string, unknown>))
          : prev.users;
      const remoteListings =
        seededListings && seededListings.length > 0
          ? seededListings
          : listingsRes.data && listingsRes.data.length > 0
          ? listingsRes.data.map((r) => mapRowToListing(r as Record<string, unknown>))
          : prev.listings;
      const remoteFavorites =
        favoritesRes.data && !favoritesRes.error && favoritesRes.data.length > 0
          ? favoritesRes.data.map((r) => mapRowToFavorite(r as Record<string, unknown>))
          : prev.favorites;
      const remoteConvs =
        conversationsRes.data && !conversationsRes.error && conversationsRes.data.length > 0
          ? conversationsRes.data.map((r) => mapRowToConversation(r as Record<string, unknown>))
          : prev.conversations;
      const remoteMsgs =
        messagesRes.data && !messagesRes.error && messagesRes.data.length > 0
          ? messagesRes.data.map((r) => mapRowToMessage(r as Record<string, unknown>))
          : prev.messages;
      const remoteOffers =
        offersRes.data && !offersRes.error && offersRes.data.length > 0
          ? offersRes.data.map((r) => mapRowToOffer(r as Record<string, unknown>))
          : prev.offers;
      const remoteReports =
        reportsRes.data && !reportsRes.error && reportsRes.data.length > 0
          ? reportsRes.data.map((r) => mapRowToReport(r as Record<string, unknown>))
          : prev.reports;
      const remoteReviews =
        reviewsRes.data && !reviewsRes.error && reviewsRes.data.length > 0
          ? reviewsRes.data.map((r) => mapRowToReview(r as Record<string, unknown>))
          : prev.reviews;
      const remoteNotifs =
        notificationsRes.data && !notificationsRes.error && notificationsRes.data.length > 0
          ? notificationsRes.data.map((r) => mapRowToNotification(r as Record<string, unknown>))
          : prev.notifications;

      const authUser = authRes.data?.user;
      const matchedProfile = authUser
        ? remoteUsers.find(
            (u) =>
              u.id === authUser.id ||
              (u.email && authUser.email && u.email.toLowerCase() === authUser.email.toLowerCase())
          )
        : undefined;

      return {
        ...prev,
        users: remoteUsers,
        listings: remoteListings,
        favorites: remoteFavorites,
        conversations: remoteConvs,
        messages: remoteMsgs,
        offers: remoteOffers,
        reports: remoteReports,
        reviews: remoteReviews,
        notifications: remoteNotifs,
        currentUserId: matchedProfile ? matchedProfile.id : prev.currentUserId,
        isAuthenticated: Boolean(authUser) || prev.isAuthenticated,
      };
    });

    return {
      ok: true,
      message: 'Supabase Cloud tables verified and synchronized.',
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    void refreshSupabaseData();
  }, [refreshSupabaseData]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentUser = useMemo(() => {
    return state.users.find((u) => u.id === state.currentUserId) || state.users[0];
  }, [state.users, state.currentUserId]);

  const getUserById = useCallback(
    (id: string) => state.users.find((u) => u.id === id),
    [state.users]
  );

  const getListingById = useCallback(
    (id: string) => state.listings.find((l) => l.id === id),
    [state.listings]
  );

  const isFavorite = useCallback(
    (listingId: string) =>
      state.favorites.some(
        (f) => f.userId === state.currentUserId && f.listingId === listingId
      ),
    [state.favorites, state.currentUserId]
  );

  const toggleFavorite = useCallback(
    (listingId: string) => {
      const existingFav = state.favorites.find(
        (f) => f.userId === state.currentUserId && f.listingId === listingId
      );
      const exists = Boolean(existingFav);
      const newFav: Favorite = {
        id: `fav-${Date.now()}`,
        userId: state.currentUserId,
        listingId,
        createdAt: new Date().toISOString(),
      };
      const targetListing = state.listings.find((l) => l.id === listingId);
      const nextSaves = targetListing
        ? Math.max(0, targetListing.saves + (exists ? -1 : 1))
        : 0;

      setState((prev) => {
        const nextFavorites = exists
          ? prev.favorites.filter(
              (f) => !(f.userId === prev.currentUserId && f.listingId === listingId)
            )
          : [newFav, ...prev.favorites];

        const nextListings = prev.listings.map((l) =>
          l.id === listingId
            ? { ...l, saves: Math.max(0, l.saves + (exists ? -1 : 1)) }
            : l
        );

        return {
          ...prev,
          favorites: nextFavorites,
          listings: nextListings,
        };
      });

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          if (exists && existingFav) {
            const { error } = await supabase
              .from('favorites')
              .delete()
              .eq('id', existingFav.id);
            if (error) console.warn('[Supabase DELETE favorite error]:', error);
          } else {
            const { error } = await supabase
              .from('favorites')
              .insert(mapFavoriteToRow(newFav))
              .select()
              .single();
            if (error) console.warn('[Supabase INSERT favorite error]:', error);
          }
          if (targetListing) {
            const { error: updateErr } = await supabase
              .from('listings')
              .update({ saves: nextSaves })
              .eq('id', listingId);
            if (updateErr) console.warn('[Supabase UPDATE listing saves error]:', updateErr);
          }
        })();
      }

      pushToast({
        title: exists ? 'Removed from saved listings' : 'Saved to Favorites',
        variant: exists ? 'default' : 'success',
      });
    },
    [state.favorites, state.listings, state.currentUserId, pushToast]
  );

  const recordView = useCallback((listingId: string) => {
    setState((prev) => {
      const filtered = prev.recentlyViewed.filter((item) => item.listingId !== listingId);
      const nextRecentlyViewed = [
        { listingId, viewedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, 10); // Bounded history (Section 27)

      const nextListings = prev.listings.map((l) =>
        l.id === listingId ? { ...l, views: l.views + 1 } : l
      );

      return {
        ...prev,
        recentlyViewed: nextRecentlyViewed,
        listings: nextListings,
      };
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setState((prev) => ({ ...prev, recentlyViewed: [] }));
    pushToast({ title: 'Recently viewed history cleared' });
  }, [pushToast]);

  const addRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setState((prev) => {
      const next = [
        clean,
        ...prev.recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 6);
      return { ...prev, recentSearches: next };
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setState((prev) => ({ ...prev, recentSearches: [] }));
  }, []);

  const createListing = useCallback(
    (
      data: Omit<
        Listing,
        'id' | 'sellerId' | 'createdAt' | 'updatedAt' | 'views' | 'saves' | 'inquiryCount'
      >
    ): Listing => {
      const now = new Date().toISOString();
      const newListing: Listing = {
        ...data,
        id: generateListingId(),
        sellerId: state.currentUserId,
        createdAt: now,
        updatedAt: now,
        views: 1,
        saves: 0,
        inquiryCount: 0,
      };

      setState((prev) => ({
        ...prev,
        listings: [newListing, ...prev.listings],
        users: prev.users.map((u) =>
          u.id === prev.currentUserId ? { ...u, listingCount: u.listingCount + 1 } : u
        ),
      }));

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { data: inserted, error } = await supabase
            .from('listings')
            .insert(mapListingToRow(newListing))
            .select()
            .single();
          if (error || !inserted) {
            console.warn('[Supabase INSERT listing failed]:', error);
            pushToast({
              title: 'Supabase Cloud INSERT error',
              description: error?.message || 'Listing could not be stored in Supabase.',
              variant: 'warning',
            });
          }
        })();
      }

      pushToast({
        title:
          newListing.status === 'draft'
            ? 'Draft saved to your dashboard'
            : `Listing ${newListing.id} published`,
        variant: 'success',
      });

      return newListing;
    },
    [state.currentUserId, pushToast]
  );

  const updateListing = useCallback(
    (id: string, updates: Partial<Listing>) => {
      const updatedAt = new Date().toISOString();
      const existing = state.listings.find((l) => l.id === id);
      setState((prev) => ({
        ...prev,
        listings: prev.listings.map((l) =>
          l.id === id ? { ...l, ...updates, updatedAt } : l
        ),
      }));

      if (isSupabaseConfigured && supabase && existing) {
        const merged: Listing = { ...existing, ...updates, updatedAt };
        void (async () => {
          const { data: updatedRow, error } = await supabase
            .from('listings')
            .update(mapListingToRow(merged))
            .eq('id', id)
            .select()
            .single();
          if (error || !updatedRow) {
            console.warn('[Supabase UPDATE listing failed]:', error);
            pushToast({
              title: 'Supabase Cloud UPDATE error',
              description: error?.message || 'Listing update failed in Supabase.',
              variant: 'warning',
            });
          }
        })();
      }

      pushToast({ title: 'Listing updated', variant: 'success' });
    },
    [state.listings, pushToast]
  );

  const setListingStatus = useCallback(
    (id: string, status: ListingStatus) => {
      const target = state.listings.find((l) => l.id === id);
      const updatedAt = new Date().toISOString();
      setState((prev) => {
        const nextListings = prev.listings.map((l) =>
          l.id === id ? { ...l, status, updatedAt } : l
        );
        const nextNotifications =
          status === 'sold' && target
            ? [
                {
                  id: `notif-${Date.now()}`,
                  userId: prev.currentUserId,
                  type: 'listing_sold' as const,
                  title: `Marked Sold: ${target.title}`,
                  body: `Listing ${target.id} has been moved to your completed sales history.`,
                  link: '/my-listings',
                  read: false,
                  createdAt: updatedAt,
                },
                ...prev.notifications,
              ]
            : prev.notifications;

        return {
          ...prev,
          listings: nextListings,
          notifications: nextNotifications,
        };
      });

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { error } = await supabase
            .from('listings')
            .update({ status, updated_at: updatedAt })
            .eq('id', id)
            .select()
            .single();
          if (error) console.warn('[Supabase UPDATE listing status failed]:', error);
        })();
      }

      const statusMessages: Record<ListingStatus, string> = {
        active: 'Listing is now live in discovery',
        paused: 'Listing paused and hidden from active search',
        draft: 'Listing moved to drafts',
        sold: 'Listing marked as sold',
        disabled: 'Listing disabled by moderation',
      };
      pushToast({ title: statusMessages[status], variant: 'success' });
    },
    [state.listings, pushToast]
  );

  const deleteListing = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        listings: prev.listings.filter((l) => l.id !== id),
        favorites: prev.favorites.filter((f) => f.listingId !== id),
      }));

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { error } = await supabase.from('listings').delete().eq('id', id);
          if (error) {
            console.warn('[Supabase DELETE listing failed]:', error);
            pushToast({
              title: 'Supabase Cloud DELETE error',
              description: error.message,
              variant: 'warning',
            });
          }
        })();
      }

      pushToast({ title: 'Listing permanently deleted' });
    },
    [pushToast]
  );

  const duplicateListing = useCallback(
    (id: string): Listing | null => {
      const source = state.listings.find((l) => l.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: Listing = {
        ...source,
        id: generateListingId(),
        title: `${source.title} (Copy)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        views: 0,
        saves: 0,
        inquiryCount: 0,
      };
      setState((prev) => ({
        ...prev,
        listings: [copy, ...prev.listings],
      }));
      pushToast({
        title: `Created draft copy (${copy.id})`,
        variant: 'success',
      });
      return copy;
    },
    [state.listings, pushToast]
  );

  const sendMessage = useCallback(
    (listingId: string, recipientId: string, body: string, offerId?: string): Conversation => {
      const now = new Date().toISOString();
      const listing = state.listings.find((l) => l.id === listingId);
      const sellerId = listing ? listing.sellerId : recipientId;
      const buyerId =
        state.currentUserId === sellerId ? recipientId : state.currentUserId;

      let existingConv = state.conversations.find(
        (c) =>
          c.listingId === listingId &&
          ((c.buyerId === buyerId && c.sellerId === sellerId) ||
            (c.buyerId === sellerId && c.sellerId === buyerId))
      );

      const convId = existingConv ? existingConv.id : `conv-${Date.now()}`;
      const newConv: Conversation = existingConv
        ? { ...existingConv, updatedAt: now }
        : {
            id: convId,
            listingId,
            buyerId,
            sellerId,
            createdAt: now,
            updatedAt: now,
          };

      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        conversationId: convId,
        senderId: state.currentUserId,
        body: body.trim(),
        createdAt: now,
        read: false,
        offerId,
      };

      setState((prev) => {
        const nextConvs = existingConv
          ? prev.conversations.map((c) => (c.id === convId ? newConv : c))
          : [newConv, ...prev.conversations];

        const nextListings = !existingConv
          ? prev.listings.map((l) =>
              l.id === listingId ? { ...l, inquiryCount: l.inquiryCount + 1 } : l
            )
          : prev.listings;

        const nextNotifications: NotificationItem[] = [
          {
            id: `notif-${Date.now()}`,
            userId: recipientId,
            type: 'new_message',
            title: `Message from ${currentUser.name}`,
            body: body.trim().slice(0, 80),
            link: `/messages/${convId}`,
            read: false,
            createdAt: now,
          },
          ...prev.notifications,
        ];

        return {
          ...prev,
          conversations: nextConvs,
          messages: [...prev.messages, newMessage],
          listings: nextListings,
          notifications: nextNotifications,
        };
      });

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { error: convErr } = await supabase
            .from('conversations')
            .upsert(mapConversationToRow(newConv))
            .select()
            .single();
          if (convErr) console.warn('[Supabase UPSERT conversation failed]:', convErr);

          const { error: msgErr } = await supabase
            .from('messages')
            .insert(mapMessageToRow(newMessage))
            .select()
            .single();
          if (msgErr) console.warn('[Supabase INSERT message failed]:', msgErr);
        })();
      }

      if (!offerId) {
        pushToast({ title: 'Message sent', variant: 'success' });
      }
      return newConv;
    },
    [state.listings, state.conversations, state.currentUserId, currentUser.name, pushToast]
  );

  const markConversationRead = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.conversationId === conversationId && m.senderId !== prev.currentUserId
          ? { ...m, read: true }
          : m
      ),
    }));
  }, []);

  const createOffer = useCallback(
    (listingId: string, amount: number, message: string): Offer | null => {
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing) return null;

      const now = new Date();
      const expires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const newOffer: Offer = {
        id: `off-${Date.now()}`,
        listingId,
        buyerId: state.currentUserId,
        sellerId: listing.sellerId,
        amount,
        message:
          message.trim() ||
          `Offering ${formatPKR(amount)} for ${listing.title}.`,
        status: 'pending',
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      setState((prev) => ({
        ...prev,
        offers: [newOffer, ...prev.offers],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            userId: listing.sellerId,
            type: 'offer_received',
            title: `New offer on ${listing.title}`,
            body: `${currentUser.name} offered ${formatPKR(amount)} (listed at ${formatPKR(listing.price)}).`,
            link: '/offers',
            read: false,
            createdAt: now.toISOString(),
          },
          ...prev.notifications,
        ],
      }));

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { error } = await supabase
            .from('offers')
            .insert(mapOfferToRow(newOffer))
            .select()
            .single();
          if (error) console.warn('[Supabase INSERT offer failed]:', error);
        })();
      }

      // Also attach to conversation thread so buyer & seller see offer context
      sendMessage(
        listingId,
        listing.sellerId,
        `Sent an offer of ${formatPKR(amount)}: "${newOffer.message}"`,
        newOffer.id
      );

      pushToast({
        title: `Offer of ${formatPKR(amount)} sent to seller`,
        variant: 'success',
      });
      return newOffer;
    },
    [state.listings, state.currentUserId, currentUser.name, sendMessage, pushToast]
  );

  const respondToOffer = useCallback(
    (
      offerId: string,
      action: 'accept' | 'decline' | 'counter' | 'accept_counter' | 'decline_counter',
      counterAmount?: number
    ) => {
      const target = state.offers.find((o) => o.id === offerId);
      if (!target) return;
      const listing = state.listings.find((l) => l.id === target.listingId);
      const now = new Date().toISOString();

      let nextStatus: Offer['status'] = target.status;
      let nextCounter = target.counterAmount;
      let toastTitle = 'Offer updated';
      let notifType: NotificationItem['type'] = 'offer_accepted';
      let notifTitle = 'Offer update';
      let notifBody = '';
      const recipientId =
        state.currentUserId === target.sellerId ? target.buyerId : target.sellerId;

      if (action === 'accept') {
        nextStatus = 'accepted';
        toastTitle = `Offer of ${formatPKR(target.amount)} accepted`;
        notifType = 'offer_accepted';
        notifTitle = `Offer accepted on ${listing?.title || 'Listing'}`;
        notifBody = `Seller accepted your offer of ${formatPKR(target.amount)}. Coordinate pickup in Messages.`;
      } else if (action === 'decline') {
        nextStatus = 'declined';
        toastTitle = 'Offer declined';
        notifType = 'offer_declined';
        notifTitle = `Offer declined on ${listing?.title || 'Listing'}`;
        notifBody = `Your offer of ${formatPKR(target.amount)} was declined.`;
      } else if (action === 'counter' && counterAmount) {
        nextStatus = 'countered';
        nextCounter = counterAmount;
        toastTitle = `Counter-offer of ${formatPKR(counterAmount)} sent`;
        notifType = 'offer_countered';
        notifTitle = `Counter-offer on ${listing?.title || 'Listing'}`;
        notifBody = `Seller countered with ${formatPKR(counterAmount)}.`;
      } else if (action === 'accept_counter') {
        nextStatus = 'accepted';
        toastTitle = `Counter-offer of ${formatPKR(target.counterAmount || target.amount)} accepted`;
        notifType = 'offer_accepted';
        notifTitle = `Counter-offer accepted on ${listing?.title || 'Listing'}`;
        notifBody = `Buyer accepted your counter-offer of ${formatPKR(target.counterAmount || target.amount)}.`;
      } else if (action === 'decline_counter') {
        nextStatus = 'declined';
        toastTitle = 'Counter-offer declined';
        notifType = 'offer_declined';
        notifTitle = `Counter-offer declined on ${listing?.title || 'Listing'}`;
        notifBody = 'Buyer declined the counter-offer.';
      }

      setState((prev) => ({
        ...prev,
        offers: prev.offers.map((o) =>
          o.id === offerId
            ? {
                ...o,
                status: nextStatus,
                counterAmount: nextCounter,
                amount:
                  action === 'accept_counter' && o.counterAmount
                    ? o.counterAmount
                    : o.amount,
              }
            : o
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            userId: recipientId,
            type: notifType,
            title: notifTitle,
            body: notifBody,
            link: '/offers',
            read: false,
            createdAt: now,
          },
          ...prev.notifications,
        ],
      }));

      if (isSupabaseConfigured && supabase) {
        const finalAmount =
          action === 'accept_counter' && target.counterAmount
            ? target.counterAmount
            : target.amount;
        void (async () => {
          const { error } = await supabase
            .from('offers')
            .update({
              status: nextStatus,
              counter_amount: nextCounter !== undefined ? nextCounter : null,
              amount: finalAmount,
            })
            .eq('id', offerId)
            .select()
            .single();
          if (error) console.warn('[Supabase UPDATE offer failed]:', error);
        })();
      }

      pushToast({ title: toastTitle, variant: 'success' });
    },
    [state.offers, state.listings, state.currentUserId, pushToast]
  );

  const submitReport = useCallback(
    (listingId: string, reason: ReportReason, description: string) => {
      const now = new Date().toISOString();
      const newReport: Report = {
        id: `rep-${Date.now()}`,
        listingId,
        reporterId: state.currentUserId,
        reason,
        description: description.trim(),
        status: 'open',
        createdAt: now,
      };
      const listing = state.listings.find((l) => l.id === listingId);
      setState((prev) => ({
        ...prev,
        reports: [newReport, ...prev.reports],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            userId: prev.currentUserId,
            type: 'listing_report',
            title: 'Report received',
            body: `We recorded your report (${reason}) for ${listing?.title || listingId}.`,
            link: '/admin',
            read: false,
            createdAt: now,
          },
          ...prev.notifications,
        ],
      }));

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { error } = await supabase
            .from('reports')
            .insert(mapReportToRow(newReport))
            .select()
            .single();
          if (error) console.warn('[Supabase INSERT report failed]:', error);
        })();
      }
      pushToast({
        title: 'Report submitted for moderation review',
        variant: 'success',
      });
    },
    [state.currentUserId, state.listings, pushToast]
  );

  const resolveReport = useCallback(
    (reportId: string, disableListing?: boolean) => {
      const report = state.reports.find((r) => r.id === reportId);
      if (!report) return;
      setState((prev) => ({
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === reportId ? { ...r, status: 'resolved' } : r
        ),
        listings: disableListing
          ? prev.listings.map((l) =>
              l.id === report.listingId ? { ...l, status: 'disabled' } : l
            )
          : prev.listings,
      }));
      pushToast({
        title: disableListing
          ? 'Report resolved and listing disabled'
          : 'Report marked as resolved',
        variant: 'success',
      });
    },
    [state.reports, pushToast]
  );

  const updateProfile = useCallback(
    (updates: {
      name: string;
      email?: string;
      phone?: string;
      city: string;
      area: string;
      bio: string;
      contactPreference: ContactPreference;
      avatar?: string;
    }) => {
      const location = `${updates.area}, ${updates.city}`;
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === prev.currentUserId
            ? {
                ...u,
                name: updates.name.trim(),
                email: updates.email !== undefined ? updates.email.trim() : u.email,
                phone: updates.phone !== undefined ? updates.phone.trim() : u.phone,
                city: updates.city,
                area: updates.area,
                location,
                bio: updates.bio.trim(),
                contactPreference: updates.contactPreference,
                avatar: updates.avatar || u.avatar,
              }
            : u
        ),
      }));

      if (isSupabaseConfigured && supabase) {
        const updatedUser: User = {
          ...currentUser,
          name: updates.name.trim(),
          email: updates.email !== undefined ? updates.email.trim() : currentUser.email,
          phone: updates.phone !== undefined ? updates.phone.trim() : currentUser.phone,
          city: updates.city,
          area: updates.area,
          location,
          bio: updates.bio.trim(),
          contactPreference: updates.contactPreference,
          avatar: updates.avatar || currentUser.avatar,
        };
        void (async () => {
          const { error } = await supabase
            .from('profiles')
            .upsert(mapUserToRow(updatedUser))
            .select()
            .single();
          if (error) console.warn('[Supabase UPSERT profile failed]:', error);
        })();
      }
      pushToast({ title: 'Profile changes saved', variant: 'success' });
    },
    [pushToast]
  );

  const login = useCallback(
    (identifier: string, password: string) => {
      const cleanId = identifier.trim().toLowerCase();
      const normalizedPhone = cleanId.replace(/[\s-]/g, '');
      const matchedUser = state.users.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/[\s-]/g, '');
        const uName = u.name.toLowerCase();
        return (
          uEmail === cleanId ||
          (normalizedPhone.length >= 7 && uPhone === normalizedPhone) ||
          uName === cleanId
        );
      });

      if (!matchedUser) {
        return {
          success: false,
          error:
            'No account found with that email or phone number. You can create a new account or choose a demo account.',
        };
      }

      const expectedPassword = matchedUser.password || 'phirse123';
      if (password !== expectedPassword) {
        return {
          success: false,
          error: 'Incorrect password. (Demo accounts use password: phirse123)',
        };
      }

      setState((prev) => ({
        ...prev,
        currentUserId: matchedUser.id,
        isAuthenticated: true,
      }));

      if (isSupabaseConfigured && supabase && matchedUser.email) {
        void (async () => {
          const { error } = await supabase.auth.signInWithPassword({
            email: matchedUser.email!,
            password,
          });
          if (error) {
            console.warn('[Supabase Auth signInWithPassword note]:', error.message);
          }
        })();
      }

      pushToast({
        title: `Welcome back, ${matchedUser.name}!`,
        description: `Signed in to your ${matchedUser.location} account.`,
        variant: 'success',
      });

      return { success: true, user: matchedUser };
    },
    [state.users, pushToast]
  );

  const registerUser = useCallback(
    (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
      city: string;
      area: string;
      sellerType: 'Individual' | 'Frequent Seller';
    }) => {
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanPhone = input.phone.trim();
      const normalizedPhone = cleanPhone.replace(/[\s-]/g, '');

      const duplicate = state.users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanEmail) ||
          (u.phone && u.phone.replace(/[\s-]/g, '') === normalizedPhone)
      );

      if (duplicate) {
        return {
          success: false,
          error: 'An account with this email or mobile number already exists. Please log in instead.',
        };
      }

      const initials =
        input.name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'PK';

      const newUser: User = {
        id: `u-${Date.now()}`,
        name: input.name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: input.password,
        avatar: createAvatarSvg(initials, '#0F5348'),
        city: input.city,
        area: input.area,
        location: `${input.area}, ${input.city}`,
        joinedAt: new Date().toISOString(),
        verifiedStatus: true,
        responseRate: 100,
        responseTime: 'Usually responds within 30 mins',
        listingCount: 0,
        soldCount: 0,
        bio: `Verified PHIRSE member based in ${input.area}, ${input.city}.`,
        contactPreference: 'Messages & Offers',
        sellerType: input.sellerType,
      };

      setState((prev) => ({
        ...prev,
        users: [newUser, ...prev.users],
        currentUserId: newUser.id,
        isAuthenticated: true,
      }));

      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: input.password,
          });
          if (authErr) {
            console.warn('[Supabase Auth signUp error]:', authErr);
          }
          const { error: profileErr } = await supabase
            .from('profiles')
            .upsert(mapUserToRow(newUser, authData?.user?.id || null))
            .select()
            .single();
          if (profileErr) {
            console.warn('[Supabase INSERT profile error]:', profileErr);
          }
        })();
      }

      pushToast({
        title: `Account created! Welcome, ${newUser.name}`,
        description: `Your ${newUser.location} profile is now active.`,
        variant: 'success',
      });

      return { success: true, user: newUser };
    },
    [state.users, pushToast]
  );

  const resetUserPassword = useCallback(
    (identifier: string, newPassword: string) => {
      const cleanId = identifier.trim().toLowerCase();
      const normalizedPhone = cleanId.replace(/[\s-]/g, '');
      const matchedUser = state.users.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/[\s-]/g, '');
        return (
          uEmail === cleanId ||
          (normalizedPhone.length >= 7 && uPhone === normalizedPhone)
        );
      });

      if (!matchedUser) {
        return {
          success: false,
          error: 'No registered account found with that email or mobile number.',
        };
      }

      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === matchedUser.id ? { ...u, password: newPassword } : u
        ),
        currentUserId: matchedUser.id,
        isAuthenticated: true,
      }));

      pushToast({
        title: 'Password updated & signed in',
        description: `Welcome back, ${matchedUser.name}.`,
        variant: 'success',
      });

      return { success: true };
    },
    [state.users, pushToast]
  );

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
    }));
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signOut();
    }
    pushToast({
      title: 'Signed out of your account',
      variant: 'default',
    });
  }, [pushToast]);

  const addReview = useCallback(
    (sellerId: string, listingId: string, rating: number, comment: string) => {
      const listing = state.listings.find((l) => l.id === listingId);
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        sellerId,
        reviewerId: state.currentUserId,
        reviewerName: currentUser.name,
        listingId,
        listingTitle: listing?.title || 'Completed Item',
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        reviews: [newReview, ...prev.reviews],
      }));
      if (isSupabaseConfigured && supabase) {
        void (async () => {
          const { error } = await supabase
            .from('reviews')
            .insert(mapReviewToRow(newReview))
            .select()
            .single();
          if (error) console.warn('[Supabase INSERT review failed]:', error);
        })();
      }
      pushToast({ title: 'Seller review published', variant: 'success' });
    },
    [state.listings, state.currentUserId, currentUser.name, pushToast]
  );

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === prev.currentUserId ? { ...n, read: true } : n
      ),
    }));
    pushToast({ title: 'All notifications marked as read' });
  }, [pushToast]);

  const switchDemoUser = useCallback(
    (userId: string) => {
      const target = state.users.find((u) => u.id === userId);
      if (!target) return;
      setState((prev) => ({
        ...prev,
        currentUserId: userId,
        isAuthenticated: true,
      }));
      pushToast({
        title: `Signed in as ${target.name} (${target.location})`,
        variant: 'success',
      });
    },
    [state.users, pushToast]
  );

  const resetDemoData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({ ...DEFAULT_STATE, isAuthenticated: true });
    pushToast({
      title: 'Demo dataset restored to initial state',
      variant: 'success',
    });
  }, [pushToast]);

  const unreadMessagesCount = useMemo(() => {
    if (!state.isAuthenticated) return 0;
    const myConvIds = new Set(
      state.conversations
        .filter(
          (c) => c.buyerId === state.currentUserId || c.sellerId === state.currentUserId
        )
        .map((c) => c.id)
    );
    return state.messages.filter(
      (m) =>
        myConvIds.has(m.conversationId) &&
        m.senderId !== state.currentUserId &&
        !m.read
    ).length;
  }, [state.conversations, state.messages, state.currentUserId, state.isAuthenticated]);

  const unreadNotificationsCount = useMemo(() => {
    if (!state.isAuthenticated) return 0;
    return state.notifications.filter(
      (n) => n.userId === state.currentUserId && !n.read
    ).length;
  }, [state.notifications, state.currentUserId, state.isAuthenticated]);

  const pendingOffersCount = useMemo(() => {
    if (!state.isAuthenticated) return 0;
    return state.offers.filter(
      (o) =>
        (o.sellerId === state.currentUserId && o.status === 'pending') ||
        (o.buyerId === state.currentUserId && o.status === 'countered')
    ).length;
  }, [state.offers, state.currentUserId, state.isAuthenticated]);

  const searchParams = useMemo(
    () => new URLSearchParams(locationState.search),
    [locationState.search]
  );

  const value: MarketplaceContextValue = {
    ...state,
    currentUser,
    pathname: locationState.pathname,
    searchParams,
    navigate,
    toasts,
    pushToast,
    dismissToast,
    login,
    registerUser,
    resetUserPassword,
    logout,
    getUserById,
    getListingById,
    isFavorite,
    toggleFavorite,
    recordView,
    clearRecentlyViewed,
    addRecentSearch,
    clearRecentSearches,
    createListing,
    updateListing,
    setListingStatus,
    deleteListing,
    duplicateListing,
    sendMessage,
    markConversationRead,
    createOffer,
    respondToOffer,
    submitReport,
    resolveReport,
    updateProfile,
    addReview,
    markNotificationRead,
    markAllNotificationsRead,
    switchDemoUser,
    resetDemoData,
    unreadMessagesCount,
    unreadNotificationsCount,
    pendingOffersCount,
    supabaseStatus,
    supabaseError,
    supabaseModalOpen,
    setSupabaseModalOpen,
    refreshSupabaseData,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export function useMarketplace(): MarketplaceContextValue {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error('useMarketplace must be used inside MarketplaceProvider');
  }
  return ctx;
}
