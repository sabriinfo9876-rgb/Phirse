import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Conversation,
  Favorite,
  Listing,
  Message,
  NotificationItem,
  Offer,
  Report,
  Review,
  User,
} from '../types/marketplace';

function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/(rest|auth|storage|realtime)\/v1\/?.*$/i, '')
      .replace(/\/+$/, '');
  }
}

const rawSupabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    rawSupabaseUrl.startsWith('http') &&
    !rawSupabaseUrl.includes('YOUR_PROJECT_ID') &&
    !rawSupabaseAnonKey.includes('YOUR_SUPABASE_PUBLIC_ANON_KEY')
);

export const supabaseProjectUrl = rawSupabaseUrl;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ============================================================================
// ROW <-> DOMAIN MAPPERS (Exact Schema Alignment with supabase/schema.sql)
// ============================================================================

export function mapUserToRow(user: User, authUserId?: string | null) {
  return {
    id: user.id,
    ...(authUserId ? { auth_user_id: authUserId } : {}),
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    avatar: user.avatar,
    city: user.city,
    area: user.area,
    location: user.location,
    joined_at: user.joinedAt,
    verified_status: user.verifiedStatus,
    response_rate: user.responseRate,
    response_time: user.responseTime,
    listing_count: user.listingCount,
    sold_count: user.soldCount,
    bio: user.bio,
    contact_preference: user.contactPreference,
    seller_type: user.sellerType,
  };
}

export function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name || 'PHIRSE Member'),
    email: row.email ? String(row.email) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    avatar: String(row.avatar || ''),
    city: String(row.city || 'Karachi'),
    area: String(row.area || 'PECHS'),
    location: String(row.location || `${row.area || 'PECHS'}, ${row.city || 'Karachi'}`),
    joinedAt: String(row.joined_at || new Date().toISOString()),
    verifiedStatus: Boolean(row.verified_status ?? true),
    responseRate: Number(row.response_rate ?? 98),
    responseTime: String(row.response_time || 'Usually responds within 30 mins'),
    listingCount: Number(row.listing_count ?? 0),
    soldCount: Number(row.sold_count ?? 0),
    bio: String(row.bio || ''),
    contactPreference: (row.contact_preference as User['contactPreference']) || 'Messages & Offers',
    sellerType: (row.seller_type as User['sellerType']) || 'Individual',
  };
}

export function mapListingToRow(listing: Listing) {
  return {
    id: listing.id,
    seller_id: listing.sellerId,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    subcategory: listing.subcategory || '',
    brand: listing.brand || '',
    model: listing.model || '',
    condition: listing.condition,
    price: Number(listing.price),
    city: listing.city,
    area: listing.area,
    location: listing.location,
    images: Array.isArray(listing.images) ? listing.images : [],
    status: listing.status,
    specs: Array.isArray(listing.specs) ? listing.specs : [],
    created_at: listing.createdAt,
    updated_at: listing.updatedAt,
    views: Number(listing.views || 0),
    saves: Number(listing.saves || 0),
    inquiry_count: Number(listing.inquiryCount || 0),
    contact_preference: listing.contactPreference,
  };
}

export function mapRowToListing(row: Record<string, unknown>): Listing {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    title: String(row.title),
    description: String(row.description || ''),
    category: String(row.category || 'other'),
    subcategory: String(row.subcategory || ''),
    brand: String(row.brand || ''),
    model: String(row.model || ''),
    condition: (row.condition as Listing['condition']) || 'Good',
    price: Number(row.price || 0),
    city: String(row.city || 'Karachi'),
    area: String(row.area || 'PECHS'),
    location: String(row.location || `${row.area || 'PECHS'}, ${row.city || 'Karachi'}`),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    status: (row.status as Listing['status']) || 'active',
    specs: Array.isArray(row.specs) ? (row.specs as Listing['specs']) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    views: Number(row.views || 0),
    saves: Number(row.saves || 0),
    inquiryCount: Number(row.inquiry_count || 0),
    contactPreference:
      (row.contact_preference as Listing['contactPreference']) || 'Messages & Offers',
  };
}

export function mapFavoriteToRow(fav: Favorite) {
  return {
    id: fav.id,
    user_id: fav.userId,
    listing_id: fav.listingId,
    created_at: fav.createdAt,
  };
}

export function mapRowToFavorite(row: Record<string, unknown>): Favorite {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    listingId: String(row.listing_id),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapConversationToRow(conv: Conversation) {
  return {
    id: conv.id,
    listing_id: conv.listingId,
    buyer_id: conv.buyerId,
    seller_id: conv.sellerId,
    created_at: conv.createdAt,
    updated_at: conv.updatedAt,
  };
}

export function mapRowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

export function mapMessageToRow(msg: Message) {
  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    body: msg.body,
    created_at: msg.createdAt,
    read: Boolean(msg.read),
    offer_id: msg.offerId || null,
  };
}

export function mapRowToMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderId: String(row.sender_id),
    body: String(row.body || ''),
    createdAt: String(row.created_at || new Date().toISOString()),
    read: Boolean(row.read),
    offerId: row.offer_id ? String(row.offer_id) : undefined,
  };
}

export function mapOfferToRow(offer: Offer) {
  return {
    id: offer.id,
    listing_id: offer.listingId,
    buyer_id: offer.buyerId,
    seller_id: offer.sellerId,
    amount: Number(offer.amount),
    counter_amount: offer.counterAmount !== undefined ? Number(offer.counterAmount) : null,
    message: offer.message,
    status: offer.status,
    created_at: offer.createdAt,
    expires_at: offer.expiresAt,
  };
}

export function mapRowToOffer(row: Record<string, unknown>): Offer {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    amount: Number(row.amount || 0),
    counterAmount:
      row.counter_amount !== null && row.counter_amount !== undefined
        ? Number(row.counter_amount)
        : undefined,
    message: String(row.message || ''),
    status: (row.status as Offer['status']) || 'pending',
    createdAt: String(row.created_at || new Date().toISOString()),
    expiresAt: String(row.expires_at || new Date().toISOString()),
  };
}

export function mapReportToRow(report: Report) {
  return {
    id: report.id,
    listing_id: report.listingId,
    reporter_id: report.reporterId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    created_at: report.createdAt,
  };
}

export function mapRowToReport(row: Record<string, unknown>): Report {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    reporterId: String(row.reporter_id),
    reason: (row.reason as Report['reason']) || 'Other',
    description: String(row.description || ''),
    status: (row.status as Report['status']) || 'open',
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapReviewToRow(review: Review) {
  return {
    id: review.id,
    seller_id: review.sellerId,
    reviewer_id: review.reviewerId,
    reviewer_name: review.reviewerName,
    listing_id: review.listingId,
    listing_title: review.listingTitle,
    rating: Number(review.rating),
    comment: review.comment,
    created_at: review.createdAt,
  };
}

export function mapRowToReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    reviewerId: String(row.reviewer_id),
    reviewerName: String(row.reviewer_name || 'Verified Buyer'),
    listingId: String(row.listing_id),
    listingTitle: String(row.listing_title || 'Marketplace Item'),
    rating: Number(row.rating || 5),
    comment: String(row.comment || ''),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapNotificationToRow(notif: NotificationItem) {
  return {
    id: notif.id,
    user_id: notif.userId,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    link: notif.link,
    read: Boolean(notif.read),
    created_at: notif.createdAt,
  };
}

export function mapRowToNotification(row: Record<string, unknown>): NotificationItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: (row.type as NotificationItem['type']) || 'system_welcome',
    title: String(row.title || ''),
    body: String(row.body || ''),
    link: String(row.link || '/'),
    read: Boolean(row.read),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

// ============================================================================
// PHASE 3 END-TO-END REAL DATABASE VERIFICATION HELPER
// ============================================================================

export interface PersistenceTestReport {
  configured: boolean;
  insertOk: boolean;
  selectOk: boolean;
  updateOk: boolean;
  deleteOk: boolean;
  error?: string;
  details: string[];
}

export async function runSupabasePersistenceTest(): Promise<PersistenceTestReport> {
  const details: string[] = [];

  if (!supabase || !isSupabaseConfigured) {
    return {
      configured: false,
      insertOk: false,
      selectOk: false,
      updateOk: false,
      deleteOk: false,
      error:
        'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing from runtime environment variables.',
      details: [
        'Checked import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY: not set.',
      ],
    };
  }

  const testId = `SUPABASE_PERSISTENCE_TEST_${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Check current auth user if any
  const { data: authData } = await supabase.auth.getUser();
  const sellerId = authData?.user?.id || 'u-current';

  const testPayload = {
    id: testId,
    seller_id: sellerId,
    title: 'SUPABASE_PERSISTENCE_TEST',
    description: 'End-to-end verification record for Supabase Cloud persistence.',
    category: 'electronics',
    subcategory: 'Accessories',
    brand: 'PHIRSE',
    model: 'VERIFY-1',
    condition: 'Like New',
    price: 1000,
    city: 'Karachi',
    area: 'PECHS',
    location: 'PECHS, Karachi',
    images: [],
    status: 'draft',
    featured: false,
    created_at: nowIso,
    updated_at: nowIso,
    views: 0,
    saves: 0,
    inquiry_count: 0,
    contact_preference: 'Messages & Offers',
  };

  // 1. INSERT
  const { data: insertData, error: insertError } = await supabase
    .from('listings')
    .insert(testPayload)
    .select()
    .single();

  if (insertError || !insertData) {
    console.warn('[Supabase Persistence Test] INSERT failed:', insertError);
    return {
      configured: true,
      insertOk: false,
      selectOk: false,
      updateOk: false,
      deleteOk: false,
      error: `INSERT failed: ${insertError?.message || 'No row returned'} (code: ${insertError?.code || 'unknown'})`,
      details,
    };
  }
  details.push(`1. INSERT succeeded for id=${testId}`);

  // 2. SELECT
  const { data: selectData, error: selectError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', testId)
    .single();

  if (selectError || !selectData) {
    console.warn('[Supabase Persistence Test] SELECT failed:', selectError);
    return {
      configured: true,
      insertOk: true,
      selectOk: false,
      updateOk: false,
      deleteOk: false,
      error: `SELECT failed: ${selectError?.message || 'Record not found'}`,
      details,
    };
  }
  details.push(`2. SELECT verified record title="${selectData.title}"`);

  // 3. UPDATE
  const { data: updateData, error: updateError } = await supabase
    .from('listings')
    .update({ title: 'SUPABASE_PERSISTENCE_TEST_UPDATED', price: 1500 })
    .eq('id', testId)
    .select()
    .single();

  if (updateError || !updateData || updateData.price !== 1500) {
    console.warn('[Supabase Persistence Test] UPDATE failed:', updateError);
    return {
      configured: true,
      insertOk: true,
      selectOk: true,
      updateOk: false,
      deleteOk: false,
      error: `UPDATE failed: ${updateError?.message || 'Updated values did not persist'}`,
      details,
    };
  }
  details.push(`3. UPDATE verified new title="${updateData.title}" and price=${updateData.price}`);

  // 4. DELETE
  const { error: deleteError } = await supabase.from('listings').delete().eq('id', testId);

  if (deleteError) {
    console.warn('[Supabase Persistence Test] DELETE failed:', deleteError);
    return {
      configured: true,
      insertOk: true,
      selectOk: true,
      updateOk: true,
      deleteOk: false,
      error: `DELETE failed: ${deleteError.message}`,
      details,
    };
  }

  // 5. Confirm Deletion
  const { data: afterDeleteData } = await supabase
    .from('listings')
    .select('id')
    .eq('id', testId)
    .maybeSingle();

  if (afterDeleteData) {
    return {
      configured: true,
      insertOk: true,
      selectOk: true,
      updateOk: true,
      deleteOk: false,
      error: 'DELETE executed without error, but row still exists (likely blocked by RLS DELETE policy).',
      details,
    };
  }
  details.push(`4. DELETE confirmed: row ${testId} no longer exists in public.listings`);

  return {
    configured: true,
    insertOk: true,
    selectOk: true,
    updateOk: true,
    deleteOk: true,
    details,
  };
}
