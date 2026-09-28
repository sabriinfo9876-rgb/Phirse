export type ItemCondition = 'Like New' | 'Excellent' | 'Good' | 'Fair' | 'For Parts';

export type ListingStatus = 'active' | 'draft' | 'paused' | 'sold' | 'disabled';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';

export type ContactPreference = 'In-App Messages' | 'Messages & Offers' | 'Flexible Meetup';

export type ReportReason =
  | 'Scam'
  | 'Misleading information'
  | 'Prohibited item'
  | 'Duplicate'
  | 'Wrong category'
  | 'Other';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export type NotificationType =
  | 'new_message'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'offer_countered'
  | 'listing_sold'
  | 'listing_report';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar: string;
  city: string;
  area: string;
  location: string; // e.g., "Clifton, Karachi"
  joinedAt: string;
  verifiedStatus: boolean;
  responseRate: number; // e.g., 96
  responseTime: string; // e.g., "Usually responds within 1 hour"
  listingCount: number;
  soldCount: number;
  bio: string;
  contactPreference: ContactPreference;
  sellerType: 'Individual' | 'Frequent Seller';
}

export interface ListingSpec {
  label: string;
  value: string;
}

export interface Listing {
  id: string; // e.g., "PHR-842731"
  sellerId: string;
  title: string;
  description: string;
  category: string; // category slug
  subcategory: string;
  brand: string;
  model: string;
  condition: ItemCondition;
  price: number; // in PKR
  city: string;
  area: string;
  location: string; // "Area, City"
  images: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: ListingStatus;
  views: number;
  saves: number;
  inquiryCount: number;
  contactPreference: ContactPreference;
  specs?: ListingSpec[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: string[];
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface RecentlyViewedItem {
  listingId: string;
  viewedAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  counterAmount?: number;
  message: string;
  status: OfferStatus;
  createdAt: string;
  expiresAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
  offerId?: string;
}

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  listingId: string;
  listingTitle: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export type SortOption = 'relevance' | 'newest' | 'price_asc' | 'price_desc';

export type ListingAgeFilter = 'all' | '24h' | '7d' | '30d';

export interface FilterState {
  query: string;
  category: string;
  subcategory: string;
  minPrice: string;
  maxPrice: string;
  city: string;
  area: string;
  conditions: ItemCondition[];
  sellerType: 'all' | 'Individual' | 'Frequent Seller';
  listingAge: ListingAgeFilter;
  status: 'active' | 'all' | 'sold';
  sort: SortOption;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
