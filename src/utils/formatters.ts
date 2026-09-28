import { ItemCondition, Listing } from '../types/marketplace';

/**
 * Formats PKR numbers cleanly with tabular discipline: e.g. Rs. 168,000
 */
export function formatPKR(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rs. 0';
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

/**
 * Formats an ISO date string into a human-readable relative age
 */
export function formatRelativeAge(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export function formatShortDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export interface QualityCheckItem {
  key: string;
  label: string;
  passed: boolean;
  hint: string;
}

export interface ListingQualityReport {
  level: 'Strong' | 'Good' | 'Needs Improvement';
  score: number;
  checks: QualityCheckItem[];
  missingHints: string[];
}

/**
 * Deterministic, local listing quality evaluator (Section 21)
 */
export function evaluateListingQuality(draft: {
  title: string;
  description: string;
  images: string[];
  condition: ItemCondition | '';
  price: number;
  city: string;
  area: string;
  brand?: string;
}): ListingQualityReport {
  const checks: QualityCheckItem[] = [
    {
      key: 'title',
      label: 'Clear title (12+ characters with model or item type)',
      passed: draft.title.trim().length >= 12,
      hint: 'Expand your title to include brand, model, or key spec (at least 12 characters).',
    },
    {
      key: 'description',
      label: 'Detailed description (50+ characters covering usage & defects)',
      passed: draft.description.trim().length >= 50,
      hint: 'Add at least 50 characters describing how long you used it, what is included, and any wear.',
    },
    {
      key: 'photos',
      label: 'Multiple photos (2 or more angles)',
      passed: draft.images.length >= 2,
      hint: 'Add at least 2 photos so buyers can inspect front and detail views.',
    },
    {
      key: 'condition',
      label: 'Condition selected',
      passed: Boolean(draft.condition),
      hint: 'Select an honest condition rating.',
    },
    {
      key: 'price',
      label: 'Realistic PKR price added',
      passed: Number.isFinite(draft.price) && draft.price >= 200,
      hint: 'Enter a valid price in PKR (minimum Rs. 200).',
    },
    {
      key: 'location',
      label: 'Location added (City & neighborhood area)',
      passed: Boolean(draft.city && draft.area),
      hint: 'Select both your city and neighborhood area.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const missingHints = checks.filter((c) => !c.passed).map((c) => c.hint);

  let level: ListingQualityReport['level'] = 'Needs Improvement';
  if (passedCount === 6) {
    level = 'Strong';
  } else if (passedCount >= 4) {
    level = 'Good';
  }

  return {
    level,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    missingHints,
  };
}

/**
 * Deterministic demo price insight calculator based on actual demo catalog listings (Section 22)
 */
export function calculateDemoPriceInsight(
  categorySlug: string,
  subcategory: string,
  allListings: Listing[]
): {
  minRange: number;
  maxRange: number;
  median: number;
  sampleCount: number;
  summaryText: string;
} | null {
  if (!categorySlug) return null;

  const sameSub = allListings.filter(
    (l) =>
      l.category === categorySlug &&
      l.status === 'active' &&
      (!subcategory || l.subcategory.toLowerCase() === subcategory.toLowerCase())
  );

  const pool =
    sameSub.length >= 2
      ? sameSub
      : allListings.filter((l) => l.category === categorySlug && l.status === 'active');

  if (pool.length === 0) return null;

  const prices = pool.map((l) => l.price).sort((a, b) => a - b);
  const minVal = prices[0];
  const maxVal = prices[prices.length - 1];
  const midIdx = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 !== 0
      ? prices[midIdx]
      : Math.round((prices[midIdx - 1] + prices[midIdx]) / 2);

  const lowBand = prices.length === 1 ? Math.round(minVal * 0.9) : minVal;
  const highBand = prices.length === 1 ? Math.round(maxVal * 1.1) : maxVal;

  return {
    minRange: lowBand,
    maxRange: highBand,
    median,
    sampleCount: pool.length,
    summaryText: `Listings with similar characteristics in this demo dataset commonly appear between ${formatPKR(lowBand)} and ${formatPKR(highBand)}.`,
  };
}

export function generateListingId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PHR-${num}`;
}
