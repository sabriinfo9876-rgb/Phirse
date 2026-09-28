import React, { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { getCategoryName } from '../../data/categories';
import { ItemCondition, Listing } from '../../types/marketplace';
import {
  calculateDemoPriceInsight,
  formatPKR,
} from '../../utils/formatters';
import {
  CONDITION_TOOLTIP_DESCRIPTIONS,
  InfoTooltip,
} from '../ui/InfoTooltip';

interface PriceTrendsModuleProps {
  categorySlug: string;
  subcategory: string;
  currentPrice: number;
  currentCondition: ItemCondition;
  allListings: Listing[];
  onSelectSuggestedPrice?: (price: number) => void;
}

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

// Deterministic monthly multipliers per category so trends look realistic and consistent
const CATEGORY_TREND_CURVES: Record<string, number[]> = {
  mobiles: [1.06, 1.04, 1.03, 1.01, 0.99, 1.0],
  'laptops-computers': [1.05, 1.04, 1.02, 1.01, 1.0, 1.0],
  gaming: [1.08, 1.06, 1.03, 1.02, 1.01, 1.0],
  cameras: [0.98, 0.99, 1.01, 1.02, 1.01, 1.0],
  electronics: [1.04, 1.03, 1.01, 1.0, 0.99, 1.0],
  furniture: [0.97, 0.98, 1.0, 1.01, 1.0, 1.0],
};

const CONDITION_MULTIPLIERS: { condition: ItemCondition; factor: number }[] = [
  { condition: 'Like New', factor: 1.08 },
  { condition: 'Excellent', factor: 1.0 },
  { condition: 'Good', factor: 0.9 },
  { condition: 'Fair', factor: 0.78 },
];

export const PriceTrendsModule: React.FC<PriceTrendsModuleProps> = ({
  categorySlug,
  subcategory,
  currentPrice,
  currentCondition,
  allListings,
  onSelectSuggestedPrice,
}) => {
  const [viewMode, setViewMode] = useState<'trend' | 'condition'>('trend');
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(5);

  const insight = useMemo(
    () => calculateDemoPriceInsight(categorySlug, subcategory, allListings),
    [categorySlug, subcategory, allListings]
  );

  const baseMedian = insight?.median || currentPrice || 50000;
  const lowRange = insight?.minRange || Math.round(baseMedian * 0.82);
  const highRange = insight?.maxRange || Math.round(baseMedian * 1.18);

  const monthlySeries = useMemo(() => {
    const curve = CATEGORY_TREND_CURVES[categorySlug] || [
      1.04, 1.03, 1.02, 1.01, 1.0, 1.0,
    ];
    return MONTHS.map((month, idx) => {
      const avg = Math.round((baseMedian * curve[idx]) / 500) * 500;
      const low = Math.round((avg * 0.88) / 500) * 500;
      const high = Math.round((avg * 1.12) / 500) * 500;
      return { month, avg, low, high };
    });
  }, [categorySlug, baseMedian]);

  const conditionSeries = useMemo(() => {
    return CONDITION_MULTIPLIERS.map(({ condition, factor }) => ({
      condition,
      estimatedPrice: Math.round((baseMedian * factor) / 500) * 500,
    }));
  }, [baseMedian]);

  // Calculate where currentPrice sits on the [lowRange, highRange] spectrum (0% to 100%)
  const pricePositionPercent = useMemo(() => {
    if (!currentPrice || currentPrice <= 0) return 50;
    const span = Math.max(1000, highRange - lowRange);
    const raw = ((currentPrice - lowRange) / span) * 100;
    return Math.min(96, Math.max(4, Math.round(raw)));
  }, [currentPrice, lowRange, highRange]);

  const priceComparisonLabel = useMemo(() => {
    if (!currentPrice || currentPrice <= 0) return 'Enter a price to compare';
    const diffRatio = (currentPrice - baseMedian) / Math.max(1, baseMedian);
    if (diffRatio <= -0.05) {
      return `${Math.abs(Math.round(diffRatio * 100))}% below category median`;
    }
    if (diffRatio >= 0.06) {
      return `${Math.round(diffRatio * 100)}% above category median`;
    }
    return 'Right in line with category median';
  }, [currentPrice, baseMedian]);

  const sixMonthChangePct = useMemo(() => {
    const first = monthlySeries[0].avg;
    const last = monthlySeries[monthlySeries.length - 1].avg;
    return Math.round(((last - first) / Math.max(1, first)) * 100);
  }, [monthlySeries]);

  // SVG chart coordinates for 6 months
  const chartPoints = useMemo(() => {
    const vals = monthlySeries.map((m) => m.avg);
    const minVal = Math.min(...vals) * 0.94;
    const maxVal = Math.max(...vals) * 1.06;
    const range = Math.max(1, maxVal - minVal);

    return monthlySeries.map((item, idx) => {
      const x = 36 + idx * 96;
      const y = 120 - ((item.avg - minVal) / range) * 84;
      return { ...item, x, y: Math.round(y) };
    });
  }, [monthlySeries]);

  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `36,132 ${polylinePoints} ${
    chartPoints[chartPoints.length - 1].x
  },132`;

  const selectedPoint = chartPoints[activeMonthIdx] || chartPoints[5];

  return (
    <div className="rounded-xl border border-gray-900/10 bg-[#F8F9FA] p-5 space-y-5">
      {/* Header with Interactive Tooltip & Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-sm sm:text-base font-bold text-gray-900">
              Price Trends & Market Range
            </h3>
            <InfoTooltip
              label="How Price Trends Work"
              content={`Calculated from ${
                insight?.sampleCount || 4
              } active ${getCategoryName(
                categorySlug
              )} listings in the PHIRSE Pakistan demo dataset.`}
              detail="Click any month or condition tier to inspect typical resale values."
            />
          </div>
          <p className="text-xs text-gray-600">
            {subcategory || getCategoryName(categorySlug)} ·{' '}
            <span className="font-semibold text-gray-900">
              {priceComparisonLabel}
            </span>
          </p>
        </div>

        {/* Interactive toggle: 6-Month Trend vs Condition Tiers */}
        <div
          role="tablist"
          aria-label="Price trend view mode"
          className="inline-flex items-center gap-1 p-1 bg-gray-200/80 rounded-lg self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'trend'}
            onClick={() => setViewMode('trend')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'trend'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            6-Month Trend
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'condition'}
            onClick={() => setViewMode('condition')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'condition'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            By Condition
          </button>
        </div>
      </div>

      {/* Market Position Spectrum Bar */}
      {currentPrice > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Typical Low:{' '}
              <strong className="font-price text-gray-800 tabular-nums">
                {formatPKR(lowRange)}
              </strong>
            </span>
            <span className="text-[#0F5348] font-semibold">
              Median:{' '}
              <strong className="font-price tabular-nums">
                {formatPKR(baseMedian)}
              </strong>
            </span>
            <span className="text-gray-500">
              Typical High:{' '}
              <strong className="font-price text-gray-800 tabular-nums">
                {formatPKR(highRange)}
              </strong>
            </span>
          </div>

          <div className="relative h-2.5 rounded-full bg-gradient-to-r from-emerald-100 via-[#0F5348]/30 to-amber-100">
            {/* Median tick */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
              style={{ left: '50%' }}
              aria-hidden="true"
            />
            {/* Current listing marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0F5348] border-2 border-white shadow-sm transition-all"
              style={{ left: `${pricePositionPercent}%` }}
              title={`Current price: ${formatPKR(currentPrice)}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>
              This item ({currentCondition}):{' '}
              <strong className="font-price text-gray-900 tabular-nums">
                {formatPKR(currentPrice)}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1 text-gray-600 tabular-nums">
              {sixMonthChangePct <= 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-[#0F5348]" />
                  <span>{Math.abs(sixMonthChangePct)}% softer over 6 mos</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  <span>+{sixMonthChangePct}% firmer over 6 mos</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* VIEW 1: Interactive 6-Month SVG Sparkline Chart */}
      {viewMode === 'trend' ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-gray-500">
                Selected Month ({selectedPoint.month} 2026):{' '}
              </span>
              <strong className="font-price text-sm font-bold text-gray-900 tabular-nums">
                {formatPKR(selectedPoint.avg)}
              </strong>
              <span className="text-gray-400 tabular-nums">
                {' '}
                (Range: {formatPKR(selectedPoint.low)} –{' '}
                {formatPKR(selectedPoint.high)})
              </span>
            </div>
            {onSelectSuggestedPrice && (
              <button
                type="button"
                onClick={() => onSelectSuggestedPrice(selectedPoint.avg)}
                className="text-xs font-semibold text-[#0F5348] hover:underline tabular-nums"
              >
                Apply {formatPKR(selectedPoint.avg)} →
              </button>
            )}
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 552 155"
              className="w-full h-36 select-none overflow-visible"
              role="img"
              aria-label="Six-month pre-owned price trend chart in PKR"
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F5348" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#0F5348" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal guide lines */}
              <line
                x1="24"
                y1="36"
                x2="528"
                y2="36"
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <line
                x1="24"
                y1="84"
                x2="528"
                y2="84"
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <line
                x1="24"
                y1="132"
                x2="528"
                y2="132"
                stroke="#D1D5DB"
              />

              {/* Area under curve */}
              <polygon points={areaPoints} fill="url(#trendFill)" />

              {/* Trend line */}
              <polyline
                fill="none"
                stroke="#0F5348"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Interactive data nodes */}
              {chartPoints.map((pt, idx) => {
                const isSelected = idx === activeMonthIdx;
                return (
                  <g
                    key={pt.month}
                    className="cursor-pointer"
                    onClick={() => setActiveMonthIdx(idx)}
                    onMouseEnter={() => setActiveMonthIdx(idx)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={14}
                      fill="transparent"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#0F5348' : '#FFFFFF'}
                      stroke="#0F5348"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={148}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? '700' : '500'}
                      fill={isSelected ? '#111827' : '#6B7280'}
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* VIEW 2: Condition-Based Price Benchmarks */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {conditionSeries.map((row) => {
            const isCurrent = row.condition === currentCondition;
            return (
              <div
                key={row.condition}
                onClick={() =>
                  onSelectSuggestedPrice &&
                  onSelectSuggestedPrice(row.estimatedPrice)
                }
                className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                  onSelectSuggestedPrice ? 'cursor-pointer' : ''
                } ${
                  isCurrent
                    ? 'border-[#0F5348] bg-[#EBF3F1]/60'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900">
                      {row.condition}
                    </span>
                    <InfoTooltip
                      label={`${row.condition} Condition`}
                      content={
                        CONDITION_TOOLTIP_DESCRIPTIONS[row.condition] || ''
                      }
                      align="left"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {isCurrent ? 'Selected condition' : 'Benchmark estimate'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-price text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                    {formatPKR(row.estimatedPrice)}
                  </p>
                  {onSelectSuggestedPrice && (
                    <span className="text-[11px] font-semibold text-[#0F5348]">
                      Use price
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
