import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/layout/ConfirmDialog';
import { getCategoryName } from '../data/categories';
import { useMarketplace } from '../store/MarketplaceContext';
import { Listing } from '../types/marketplace';
import { formatPKR, formatShortDate } from '../utils/formatters';

export const SellerDashboardPage: React.FC = () => {
  const {
    listings,
    currentUser,
    navigate,
    setListingStatus,
    deleteListing,
    duplicateListing,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'active' | 'drafts' | 'sold'>(
    'active'
  );
  const [confirmSoldItem, setConfirmSoldItem] = useState<Listing | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Listing | null>(
    null
  );

  const myListings = useMemo(
    () => listings.filter((l) => l.sellerId === currentUser.id),
    [listings, currentUser.id]
  );

  const activeAndPaused = useMemo(
    () =>
      myListings.filter(
        (l) => l.status === 'active' || l.status === 'paused'
      ),
    [myListings]
  );

  const drafts = useMemo(
    () => myListings.filter((l) => l.status === 'draft'),
    [myListings]
  );

  const soldItems = useMemo(
    () => myListings.filter((l) => l.status === 'sold'),
    [myListings]
  );

  const displayedList =
    activeTab === 'active'
      ? activeAndPaused
      : activeTab === 'drafts'
      ? drafts
      : soldItems;

  const totalViews = useMemo(
    () => myListings.reduce((acc, item) => acc + item.views, 0),
    [myListings]
  );
  const totalSaves = useMemo(
    () => myListings.reduce((acc, item) => acc + item.saves, 0),
    [myListings]
  );
  const totalInquiries = useMemo(
    () => myListings.reduce((acc, item) => acc + item.inquiryCount, 0),
    [myListings]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-900/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#0F5348]">
            Seller Workspace · {currentUser.name}
          </p>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            My Listings
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Manage your active items, drafts, and completed sales.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/sell')}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Listing</span>
        </button>
      </div>

      {/* Lightweight Demo Activity Summary */}
      <div className="bg-white rounded-xl border border-gray-900/10 p-5 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 tabular-nums">
          <span>
            Active listings:{' '}
            <strong className="text-sm font-bold text-gray-900">
              {activeAndPaused.length}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Total views (demo):{' '}
            <strong className="text-sm font-bold text-gray-900">
              {totalViews}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Total saves (demo):{' '}
            <strong className="text-sm font-bold text-gray-900">
              {totalSaves}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Inquiries (demo):{' '}
            <strong className="text-sm font-bold text-gray-900">
              {totalInquiries}
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          Metrics reflect activity in the local demo dataset
        </span>
      </div>

      {/* Interactive Tabs: Active, Drafts, Sold */}
      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Seller listing status tabs"
          className="inline-flex items-center gap-1 p-1 bg-gray-200/75 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({activeAndPaused.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drafts'}
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'drafts'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Drafts ({drafts.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sold'}
            onClick={() => setActiveTab('sold')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors tabular-nums whitespace-nowrap ${
              activeTab === 'sold'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sold ({soldItems.length})
          </button>
        </div>

        {/* Listing rows */}
        {displayedList.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-900/10 p-10 text-center space-y-3">
            <p className="font-display text-lg font-bold text-gray-900">
              {activeTab === 'active'
                ? 'You have no active listings yet'
                : activeTab === 'drafts'
                ? 'No saved drafts'
                : 'No completed sales recorded yet'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              {activeTab === 'active'
                ? 'Have a phone, laptop, camera, or piece of furniture you no longer use? List it in under two minutes.'
                : activeTab === 'drafts'
                ? 'When you save an unfinished listing during the sell wizard, it will appear here so you can finish it later.'
                : 'When you mark an active listing as sold, it is archived here for your reference.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/sell')}
              className="mt-2 min-h-[40px] px-5 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              Sell Something
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-900/10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    onClick={() => navigate(`/listing/${item.id}`)}
                    className="w-24 h-20 rounded-lg object-cover bg-gray-100 shrink-0 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                      <span className="font-price tabular-nums">{item.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getCategoryName(item.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-gray-800">
                        {item.status === 'active'
                          ? 'Published'
                          : item.status === 'paused'
                          ? 'Paused'
                          : item.status === 'draft'
                          ? 'Draft'
                          : 'Sold'}
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/listing/${item.id}`)}
                      className="text-base font-bold text-gray-900 hover:text-[#0F5348] cursor-pointer truncate"
                    >
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 tabular-nums">
                      <span className="font-price font-bold text-gray-900">
                        {formatPKR(item.price)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>Listed {formatShortDate(item.createdAt)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 tabular-nums pt-0.5">
                      <span>{item.views} views</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.saves} saves</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.inquiryCount} inquiries</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/listing/${item.id}`)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/sell/edit/${item.id}`)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {item.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => setListingStatus(item.id, 'paused')}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  )}

                  {(item.status === 'paused' || item.status === 'draft') && (
                    <button
                      type="button"
                      onClick={() => setListingStatus(item.id, 'active')}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#EBF3F1] hover:bg-[#d7e8e4] text-xs font-semibold text-[#0F5348] flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </button>
                  )}

                  {item.status !== 'sold' && (
                    <button
                      type="button"
                      onClick={() => setConfirmSoldItem(item)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Sold</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => duplicateListing(item.id)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteItem(item)}
                    aria-label={`Delete ${item.title}`}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(confirmSoldItem)}
        title="Mark this listing as sold?"
        description={
          confirmSoldItem
            ? `"${confirmSoldItem.title}" will be removed from active public discovery and archived in your Sold history.`
            : ''
        }
        confirmLabel="Confirm Sold"
        onConfirm={() => {
          if (confirmSoldItem) {
            setListingStatus(confirmSoldItem.id, 'sold');
            setActiveTab('sold');
          }
        }}
        onCancel={() => setConfirmSoldItem(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteItem)}
        title="Delete this listing permanently?"
        description={
          confirmDeleteItem
            ? `Are you sure you want to delete "${confirmDeleteItem.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Listing"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteItem) {
            deleteListing(confirmDeleteItem.id);
          }
        }}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
};
