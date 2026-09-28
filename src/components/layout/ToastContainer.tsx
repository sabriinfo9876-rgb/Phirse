import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useMarketplace } from '../../store/MarketplaceContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useMarketplace();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-16 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.variant === 'success'
            ? CheckCircle2
            : toast.variant === 'danger' || toast.variant === 'warning'
            ? AlertCircle
            : Info;

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-lg bg-gray-900 text-white shadow-lg border border-gray-800 transition-all"
          >
            <div className="flex items-start gap-2.5 text-xs sm:text-sm">
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-medium leading-snug">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-gray-300 mt-0.5">{toast.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
