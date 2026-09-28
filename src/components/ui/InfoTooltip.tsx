import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  label: string;
  content: string;
  detail?: string;
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
}

export const CONDITION_TOOLTIP_DESCRIPTIONS: Record<string, string> = {
  'Like New':
    'Mint condition with zero cosmetic blemishes. Includes original box, accessories, and intact factory seals.',
  Excellent:
    'Lightly used and 100% functional. Clean screen/surfaces with virtually no visible wear.',
  Good:
    'Well-maintained everyday item. Minor cosmetic wear on frame or edges; all primary functions tested and working.',
  Fair:
    'Visible signs of regular use or a minor cosmetic flaw clearly disclosed by the seller. Priced for value.',
  'For Parts':
    'Non-working or requires repair/replacement components. Intended for technicians or spare parts.',
};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  label,
  content,
  detail,
  align = 'center',
  children,
}) => {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const alignmentClasses =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 text-gray-500 hover:text-[#0F5348] focus:text-[#0F5348] transition-colors cursor-help rounded-xs"
      >
        {children || <HelpCircle className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-full mb-2 ${alignmentClasses} z-40 w-56 sm:w-64 max-w-[calc(100vw-2rem)] p-3 rounded-lg bg-gray-900 text-white text-xs leading-relaxed shadow-xl border border-gray-800 pointer-events-auto text-left font-normal`}
        >
          <span className="block font-semibold text-emerald-300 mb-0.5">
            {label}
          </span>
          <span className="block text-gray-200">{content}</span>
          {detail && (
            <span className="block text-[11px] text-gray-400 mt-1 pt-1 border-t border-gray-800 tabular-nums">
              {detail}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
