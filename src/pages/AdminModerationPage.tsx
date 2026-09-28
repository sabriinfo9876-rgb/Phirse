import React, { useState } from 'react';
import { CheckCircle2, Eye, RotateCcw, ShieldAlert, Slash } from 'lucide-react';
import { ConfirmDialog } from '../components/layout/ConfirmDialog';
import { useMarketplace } from '../store/MarketplaceContext';
import { Listing } from '../types/marketplace';
import { formatPKR, formatShortDate } from '../utils/formatters';

export const AdminModerationPage: React.FC = () => {
  const {
    reports,
    listings,
    getUserById,
    getListingById,
    resolveReport,
    setListingStatus,
    navigate,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'reports' | 'listings'>('reports');
  const [confirmDisableListing, setConfirmDisableListing] =
    useState<Listing | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Explicit Demo Security Banner (Section 38) */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">
            Demo Moderation Interface (Frontend-Only MVP Preview)
          </p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            This screen demonstrates report inspection and listing moderation
            workflows using local persistent state. In a production deployment,
            moderation actions are protected by server-side RBAC authorization.
          </p>
        </div>
      </div>

      {/* Header & Tabs */}
      <div className="bg-white rounded-xl border border-gray-900/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Moderation Console
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Inspect reported listings, disable policy-violating items, or
            restore listings.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Moderation console tabs"
          className="inline-flex items-center gap-1 p-1 bg-gray-200/75 rounded-lg self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reports ({reports.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'listings'}
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'listings'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Listings ({listings.length})
          </button>
        </div>
      </div>

      {/* REPORTS VIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-900/10 p-10 text-center space-y-2">
              <p className="font-display text-lg font-bold text-gray-900">
                No reports in queue
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Submitted listing reports will appear here for review.
              </p>
            </div>
          ) : (
            reports.map((rep) => {
              const targetListing = getListingById(rep.listingId);
              const reporter = getUserById(rep.reporterId);
              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-xl border border-gray-900/10 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="font-price font-semibold text-gray-900">
                        {rep.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-red-700">
                        Reason: {rep.reason}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Status:{' '}
                        <strong className="uppercase text-gray-900">
                          {rep.status}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {formatShortDate(rep.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">
                      Target Listing:{' '}
                      {targetListing
                        ? `${targetListing.title} (${targetListing.id})`
                        : rep.listingId}
                    </h3>

                    {rep.description && (
                      <p className="text-xs sm:text-sm text-gray-700">
                        Reporter note: "{rep.description}"
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Reported by: {reporter?.name || rep.reporterId} · Current
                      listing status:{' '}
                      <strong className="uppercase">
                        {targetListing?.status || 'deleted'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {targetListing && (
                      <button
                        type="button"
                        onClick={() => navigate(`/listing/${targetListing.id}`)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Listing</span>
                      </button>
                    )}

                    {rep.status === 'open' && (
                      <>
                        <button
                          type="button"
                          onClick={() => resolveReport(rep.id, false)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveReport(rep.id, true)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Slash className="w-3.5 h-3.5" />
                          <span>Disable Listing & Resolve</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ALL LISTINGS MODERATION VIEW */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {listings.map((item) => {
            const seller = getUserById(item.sellerId);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-900/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-16 h-12 rounded object-cover bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-price tabular-nums">{item.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>Seller: {seller?.name || item.sellerId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold uppercase text-gray-800">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="font-price text-xs text-gray-600 tabular-nums">
                      {formatPKR(item.price)} · {item.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/listing/${item.id}`)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700"
                  >
                    Inspect
                  </button>
                  {item.status !== 'disabled' ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDisableListing(item)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 flex items-center gap-1"
                    >
                      <Slash className="w-3.5 h-3.5" />
                      <span>Disable</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setListingStatus(item.id, 'active')}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EBF3F1] text-[#0F5348] text-xs font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDisableListing)}
        title="Disable this listing?"
        description={
          confirmDisableListing
            ? `"${confirmDisableListing.title}" will be hidden from public discovery immediately. You can restore it later from this moderation console.`
            : ''
        }
        confirmLabel="Disable Listing"
        variant="danger"
        onConfirm={() => {
          if (confirmDisableListing) {
            setListingStatus(confirmDisableListing.id, 'disabled');
          }
        }}
        onCancel={() => setConfirmDisableListing(null)}
      />
    </div>
  );
};
