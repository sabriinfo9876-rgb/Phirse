import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  images,
  initialIndex,
  title,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image gallery for ${title}`}
      className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col justify-between p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between text-white max-w-6xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate pr-4">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-xs text-gray-400 tabular-nums">
            Image {currentIndex + 1} of {images.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full-screen viewer"
          className="min-w-[44px] min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image stage */}
      <div
        className="relative flex-1 flex items-center justify-center my-4 max-w-5xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
            }
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="w-full max-h-[72vh] aspect-4/3 flex items-center justify-center overflow-hidden rounded-lg bg-gray-900">
          <img
            src={images[currentIndex]}
            alt={`${title} — view ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[72vh] object-contain"
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
            aria-label="Next image"
            className="absolute right-2 sm:right-4 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-center gap-2.5 overflow-x-auto py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`w-16 h-12 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={img}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
