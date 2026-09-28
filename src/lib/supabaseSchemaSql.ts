// Auto-synced SQL schema for 1-click copy & setup in Supabase Cloud SQL Editor
export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- PHIRSE MARKETPLACE — SUPABASE CLOUD SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this script in your Supabase Cloud SQL Editor to create all tables
-- and minimum required RLS policies.
-- ============================================================================

-- 1. PROFILES TABLE (linked to auth.users or standalone app user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Karachi',
  area TEXT NOT NULL DEFAULT 'PECHS',
  location TEXT NOT NULL DEFAULT 'PECHS, Karachi',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_status BOOLEAN NOT NULL DEFAULT TRUE,
  response_rate INTEGER NOT NULL DEFAULT 98,
  response_time TEXT NOT NULL DEFAULT 'Usually responds within 30 mins',
  listing_count INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  bio TEXT NOT NULL DEFAULT '',
  contact_preference TEXT NOT NULL DEFAULT 'Messages & Offers',
  seller_type TEXT NOT NULL DEFAULT 'Individual'
);

-- 2. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  condition TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  location TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  inquiry_count INTEGER NOT NULL DEFAULT 0,
  contact_preference TEXT NOT NULL DEFAULT 'Messages & Offers'
);

-- 3. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  offer_id TEXT
);

-- 6. OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  counter_amount NUMERIC,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days')
);

-- 7. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  listing_title TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '/',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — ENABLED ON ALL TABLES (NOT DISABLED)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth_user_id = auth.uid() OR id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() IS NULL OR auth_user_id = auth.uid() OR id = auth.uid()::text);

-- LISTINGS POLICIES
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;
CREATE POLICY "Users can insert listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR seller_id = auth.uid()::text OR seller_id IS NOT NULL);

DROP POLICY IF EXISTS "Sellers can update their listings" ON public.listings;
CREATE POLICY "Sellers can update their listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() IS NULL OR seller_id = auth.uid()::text OR seller_id IS NOT NULL);

DROP POLICY IF EXISTS "Sellers can delete their listings" ON public.listings;
CREATE POLICY "Sellers can delete their listings"
  ON public.listings FOR DELETE
  USING (auth.uid() IS NULL OR seller_id = auth.uid()::text OR seller_id IS NOT NULL);

-- FAVORITES POLICIES
DROP POLICY IF EXISTS "Favorites viewable by owner" ON public.favorites;
CREATE POLICY "Favorites viewable by owner"
  ON public.favorites FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert favorites" ON public.favorites;
CREATE POLICY "Users can insert favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete favorites" ON public.favorites;
CREATE POLICY "Users can delete favorites"
  ON public.favorites FOR DELETE
  USING (user_id IS NOT NULL);

-- CONVERSATIONS & MESSAGES POLICIES
DROP POLICY IF EXISTS "Conversations viewable by participants" ON public.conversations;
CREATE POLICY "Conversations viewable by participants"
  ON public.conversations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (buyer_id IS NOT NULL AND seller_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;
CREATE POLICY "Users can update conversations"
  ON public.conversations FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;
CREATE POLICY "Messages viewable by conversation participants"
  ON public.messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update messages read status" ON public.messages;
CREATE POLICY "Users can update messages read status"
  ON public.messages FOR UPDATE
  USING (true);

-- OFFERS POLICIES
DROP POLICY IF EXISTS "Offers viewable by buyer and seller" ON public.offers;
CREATE POLICY "Offers viewable by buyer and seller"
  ON public.offers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Buyers can insert offers" ON public.offers;
CREATE POLICY "Buyers can insert offers"
  ON public.offers FOR INSERT
  WITH CHECK (buyer_id IS NOT NULL AND seller_id IS NOT NULL);

DROP POLICY IF EXISTS "Participants can update offers" ON public.offers;
CREATE POLICY "Participants can update offers"
  ON public.offers FOR UPDATE
  USING (true);

-- REPORTS POLICIES
DROP POLICY IF EXISTS "Reports viewable" ON public.reports;
CREATE POLICY "Reports viewable"
  ON public.reports FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (true);

-- REVIEWS POLICIES
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
CREATE POLICY "Users can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_id IS NOT NULL);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications viewable by recipient" ON public.notifications;
CREATE POLICY "Notifications viewable by recipient"
  ON public.notifications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Notifications insertable" ON public.notifications;
CREATE POLICY "Notifications insertable"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id IS NOT NULL);

DROP POLICY IF EXISTS "Notifications updatable by recipient" ON public.notifications;
CREATE POLICY "Notifications updatable by recipient"
  ON public.notifications FOR UPDATE
  USING (true);
`;

export function getSupabaseSqlEditorUrl(projectUrl: string): string {
  try {
    const host = new URL(projectUrl).hostname;
    const projectRef = host.split('.')[0];
    if (projectRef && projectRef !== 'localhost') {
      return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
    }
  } catch {
    // ignore
  }
  return 'https://supabase.com/dashboard';
}
