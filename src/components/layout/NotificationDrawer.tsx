import React, { useEffect } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';
import { formatRelativeAge } from '../../utils/formatters';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    navigate,
  } = useMarketplace();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const myNotifications = notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="w-full max-w-md bg-white h-full shadow-xl flex flex-col border-l border-gray-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-900/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-gray-900">
              Notifications
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="px-2.5 py-1.5 text-xs font-medium text-[#0F5348] hover:bg-[#EBF3F1] rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="min-w-[36px] min-h-[36px] rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-900/5">
          {myNotifications.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Bell className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-semibold text-gray-900">
                No notifications yet
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                When buyers send offers or messages on your listings, updates will appear
                here.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/browse');
                }}
                className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F5348] rounded-lg hover:bg-[#0B3F36] transition-colors"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            myNotifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  markNotificationRead(item.id);
                  onClose();
                  navigate(item.link);
                }}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3 ${
                  !item.read ? 'bg-[#EBF3F1]/40' : 'bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        !item.read
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-700'
                      }`}
                    >
                      {item.title}
                    </p>
                    {!item.read && (
                      <span className="text-[11px] font-semibold text-[#0F5348]">
                        · Unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.body}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatRelativeAge(item.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
