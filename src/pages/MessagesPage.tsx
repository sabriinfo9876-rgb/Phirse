import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, MessageSquare, Send, Tag, X } from 'lucide-react';
import { MakeOfferModal } from '../components/listing/MakeOfferModal';
import { useMarketplace } from '../store/MarketplaceContext';
import { formatPKR, formatRelativeAge } from '../utils/formatters';

interface MessagesPageProps {
  activeConversationId?: string;
}

const QUICK_REPLIES = [
  'Is this still available?',
  'Can we meet in a public spot tomorrow?',
  'What is your final price for cash pickup?',
  'Everything looks good, thank you!',
];

export const MessagesPage: React.FC<MessagesPageProps> = ({
  activeConversationId,
}) => {
  const {
    conversations,
    messages,
    offers,
    currentUser,
    getUserById,
    getListingById,
    sendMessage,
    markConversationRead,
    respondToOffer,
    navigate,
  } = useMarketplace();

  const myConversations = useMemo(() => {
    return conversations
      .filter(
        (c) => c.buyerId === currentUser.id || c.sellerId === currentUser.id
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [conversations, currentUser.id]);

  const [selectedId, setSelectedId] = useState<string>(
    () => activeConversationId || myConversations[0]?.id || ''
  );
  const [draftText, setDraftText] = useState('');
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  useEffect(() => {
    if (activeConversationId) {
      setSelectedId(activeConversationId);
    } else if (!selectedId && myConversations[0]) {
      setSelectedId(myConversations[0].id);
    }
  }, [activeConversationId, myConversations, selectedId]);

  const activeConversation = useMemo(
    () => myConversations.find((c) => c.id === selectedId),
    [myConversations, selectedId]
  );

  useEffect(() => {
    if (activeConversation) {
      markConversationRead(activeConversation.id);
    }
  }, [activeConversation, markConversationRead]);

  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [messages, activeConversation]);

  const activeListing = useMemo(
    () =>
      activeConversation
        ? getListingById(activeConversation.listingId)
        : undefined,
    [activeConversation, getListingById]
  );

  const counterpart = useMemo(() => {
    if (!activeConversation) return undefined;
    const otherId =
      activeConversation.buyerId === currentUser.id
        ? activeConversation.sellerId
        : activeConversation.buyerId;
    return getUserById(otherId);
  }, [activeConversation, currentUser.id, getUserById]);

  const linkedOffer = useMemo(() => {
    if (!activeConversation) return undefined;
    return offers.find(
      (o) =>
        o.listingId === activeConversation.listingId &&
        ((o.buyerId === activeConversation.buyerId &&
          o.sellerId === activeConversation.sellerId) ||
          (o.buyerId === activeConversation.sellerId &&
            o.sellerId === activeConversation.buyerId))
    );
  }, [offers, activeConversation]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !counterpart || !draftText.trim()) return;
    sendMessage(activeConversation.listingId, counterpart.id, draftText);
    setDraftText('');
  };

  if (myConversations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-900/10 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-gray-900">
            No conversations yet
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            When you contact a seller or receive an inquiry about one of your
            listings, your messages will appear here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/browse')}
            className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold transition-colors"
          >
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="bg-white rounded-xl border border-gray-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px] lg:min-h-[620px]">
        {/* Left pane: Conversation list */}
        <div
          className={`lg:col-span-4 border-r border-gray-900/10 flex flex-col ${
            activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-gray-900/10">
            <h1 className="font-display text-lg font-bold text-gray-900">
              Messages
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
              {myConversations.length} active{' '}
              {myConversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-900/5">
            {myConversations.map((conv) => {
              const otherId =
                conv.buyerId === currentUser.id ? conv.sellerId : conv.buyerId;
              const otherUser = getUserById(otherId);
              const item = getListingById(conv.listingId);
              const threadMsgs = messages.filter(
                (m) => m.conversationId === conv.id
              );
              const lastMsg = threadMsgs[threadMsgs.length - 1];
              const unread = threadMsgs.some(
                (m) => m.senderId !== currentUser.id && !m.read
              );
              const isSelected = conv.id === selectedId;

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(conv.id);
                    navigate(`/messages/${conv.id}`, { replace: true });
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-[#EBF3F1]/50' : 'bg-white'
                  }`}
                >
                  {otherUser && (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {otherUser?.name || 'Marketplace User'}
                      </p>
                      {lastMsg && (
                        <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                          {formatRelativeAge(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {item && (
                      <p className="text-xs font-medium text-[#0F5348] truncate">
                        {item.title} · {formatPKR(item.price)}
                      </p>
                    )}
                    {lastMsg && (
                      <p
                        className={`text-xs truncate ${
                          unread
                            ? 'font-semibold text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {lastMsg.senderId === currentUser.id ? 'You: ' : ''}
                        {lastMsg.body}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right pane: Active conversation */}
        <div
          className={`lg:col-span-8 flex flex-col ${
            !activeConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConversation && counterpart ? (
            <>
              {/* Thread header with participant & listing context */}
              <div className="p-4 border-b border-gray-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    aria-label="Back to conversation list"
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <img
                    src={counterpart.avatar}
                    alt={counterpart.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {counterpart.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {counterpart.location} · {counterpart.responseTime}
                    </p>
                  </div>
                </div>

                {activeListing && (
                  <div className="flex items-center gap-2 shrink-0">
                    {activeListing.sellerId !== currentUser.id &&
                      activeListing.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => setOfferModalOpen(true)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#EBF3F1] hover:bg-[#0F5348] text-[#0F5348] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Make Offer</span>
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => navigate(`/listing/${activeListing.id}`)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left max-w-xs shrink-0 transition-colors"
                    >
                      <img
                        src={activeListing.images[0]}
                        alt={activeListing.title}
                        className="w-10 h-8 rounded object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {activeListing.title}
                        </p>
                        <p className="font-price text-[11px] font-bold text-[#0F5348] tabular-nums">
                          {formatPKR(activeListing.price)}
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Offer Banner with Inline Actions */}
              {linkedOffer && (
                <div className="px-4 py-2.5 bg-[#EBF3F1] border-b border-[#0F5348]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-900">
                      Offer Status ({linkedOffer.status.toUpperCase()}):
                    </span>{' '}
                    <span className="font-price font-bold text-[#0F5348] tabular-nums">
                      {formatPKR(
                        linkedOffer.counterAmount || linkedOffer.amount
                      )}
                    </span>
                    {linkedOffer.counterAmount && (
                      <span className="text-gray-600">
                        {' '}
                        (Countered from {formatPKR(linkedOffer.amount)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {linkedOffer.sellerId === currentUser.id &&
                      linkedOffer.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              respondToOffer(linkedOffer.id, 'accept')
                            }
                            className="px-2.5 py-1 rounded-md bg-[#0F5348] text-white font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              respondToOffer(linkedOffer.id, 'decline')
                            }
                            className="px-2.5 py-1 rounded-md bg-white border border-red-200 text-red-700 font-semibold flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}
                    {linkedOffer.buyerId === currentUser.id &&
                      linkedOffer.status === 'countered' && (
                        <button
                          type="button"
                          onClick={() =>
                            respondToOffer(linkedOffer.id, 'accept_counter')
                          }
                          className="px-2.5 py-1 rounded-md bg-[#0F5348] text-white font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept Counter</span>
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => navigate('/offers')}
                      className="font-semibold text-[#0F5348] underline hover:text-[#0B3F36] whitespace-nowrap"
                    >
                      All Offers →
                    </button>
                  </div>
                </div>
              )}

              {/* Messages stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F9FA]">
                {activeMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-lg rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? 'bg-[#0F5348] text-white'
                            : 'bg-white text-gray-900 border border-gray-900/10'
                        }`}
                      >
                        <p>{msg.body}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-gray-400 tabular-nums">
                        <span>{formatRelativeAge(msg.createdAt)}</span>
                        {isMine && (
                          <span className="inline-flex items-center gap-0.5">
                            · <CheckCheck className="w-3 h-3" />{' '}
                            {msg.read ? 'Read' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick replies & Composer */}
              <div className="p-4 bg-white border-t border-gray-900/10 space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setDraftText(reply)}
                      className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 whitespace-nowrap shrink-0 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <label htmlFor="chat-input" className="sr-only">
                    Type a message
                  </label>
                  <input
                    id="chat-input"
                    type="text"
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder={`Message ${counterpart.name}...`}
                    className="flex-1 min-h-[42px] rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!draftText.trim()}
                    className="min-h-[42px] px-5 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-gray-500">
              Select a conversation on the left to view messages.
            </div>
          )}
        </div>
      </div>

      {activeListing && offerModalOpen && (
        <MakeOfferModal
          isOpen={offerModalOpen}
          listing={activeListing}
          onClose={() => setOfferModalOpen(false)}
        />
      )}
    </div>
  );
};
