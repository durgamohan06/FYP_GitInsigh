import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import { ArrowUpRight, TrendingUp, Users, Sparkles, Filter } from "lucide-react";

export interface SteppedBarItem {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  formattedValue?: string;
  avatar?: string;
  avatarUrl?: string;
  badge?: string;
  role?: string;
  onClick?: () => void;
}

export interface SteppedBarChartProps {
  data: SteppedBarItem[];
  metricLabel?: string;
  yAxisFormatter?: (value: number) => string;
  activeId?: string;
  onSelect?: (item: SteppedBarItem) => void;
  className?: string;
  defaultSortFunnel?: boolean;
  currentMetric?: string;
  metricOptions?: Record<string, string>;
  onMetricChange?: (metric: string) => void;
}

/**
 * Format numbers cleanly (e.g. 65200 -> "65.2K", 142 -> "142")
 */
function defaultFormatValue(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 10_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toLocaleString();
}

/**
 * Calculate nice round tick marks for the Y axis
 */
function calculateNiceTicks(maxVal: number): number[] {
  if (maxVal <= 0) return [10, 8, 6, 4, 2];

  // If in thousands like the reference image (e.g. 70K, 60K, 50K, 40K, 30K)
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const normalized = maxVal / magnitude;

  let niceNorm: number;
  if (normalized <= 1.2) niceNorm = 1.2;
  else if (normalized <= 2) niceNorm = 2;
  else if (normalized <= 5) niceNorm = 5;
  else if (normalized <= 8) niceNorm = 8;
  else niceNorm = 10;

  const niceMax = niceNorm * magnitude;
  const step = niceMax / 5;

  return [
    niceMax,
    niceMax - step,
    niceMax - step * 2,
    niceMax - step * 3,
    niceMax - step * 4,
  ];
}

export function SteppedBarChart({
  data,
  metricLabel = "Contributions",
  yAxisFormatter = defaultFormatValue,
  activeId,
  onSelect,
  className = "",
  defaultSortFunnel = true,
  currentMetric,
  metricOptions,
  onMetricChange,
}: SteppedBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(760);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isFunnelSort, setIsFunnelSort] = useState(defaultSortFunnel);
  const [displayCount, setDisplayCount] = useState<5 | 8 | "all">(5);

  const uid = useId().replace(/[:]/g, "");

  // Measure container width responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Process and sort data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let list = [...data];

    if (isFunnelSort) {
      // Sort descending (funnel progression)
      list.sort((a, b) => b.value - a.value);
    }

    if (displayCount !== "all") {
      list = list.slice(0, displayCount);
    }

    return list;
  }, [data, isFunnelSort, displayCount]);

  const totalValue = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const rawMax = useMemo(() => {
    if (!processedData.length) return 100;
    return Math.max(...processedData.map((d) => d.value), 10);
  }, [processedData]);

  const ticks = useMemo(() => calculateNiceTicks(rawMax), [rawMax]);
  const niceMax = ticks[0] || 100;

  // SVG Chart Geometry Constants
  const chartHeight = 360;
  const yAxisWidth = 56;
  const rightPadding = 18;
  const topHeaderH = 74;
  const chartFloor = chartHeight - 28;
  const usableBarH = chartFloor - topHeaderH;

  const colAreaWidth = Math.max(100, containerWidth - yAxisWidth - rightPadding);
  const colCount = Math.max(1, processedData.length);
  const colWidth = colAreaWidth / colCount;
  const barMargin = Math.max(8, colWidth * 0.08);
  const barWidth = Math.max(16, colWidth - barMargin * 2);

  // Compute column geometries
  const columns = useMemo(() => {
    return processedData.map((item, i) => {
      const colLeft = yAxisWidth + i * colWidth;
      const colCenter = colLeft + colWidth / 2;
      const barLeft = colLeft + barMargin;
      const barRight = barLeft + barWidth;
      const fraction = Math.min(1, Math.max(0.04, item.value / niceMax));
      const barH = fraction * usableBarH;
      const barTop = chartFloor - barH;

      return {
        item,
        index: i,
        colLeft,
        colCenter,
        colWidth,
        barLeft,
        barRight,
        barWidth,
        barTop,
        barH,
      };
    });
  }, [processedData, niceMax, usableBarH, chartFloor, colWidth, barMargin, barWidth, yAxisWidth]);

  // Which bar should be the highlighted solid blue bar?
  // If hovered -> that bar.
  // Else if activeId provided -> that bar.
  // Else default to the 3rd bar (index 2) or median bar if >= 3 columns (matching reference image!)
  const highlightedIndex = useMemo(() => {
    if (hoveredIdx !== null) return hoveredIdx;
    if (activeId) {
      const idx = columns.findIndex((c) => c.item.id === activeId);
      if (idx !== -1) return idx;
    }
    if (columns.length >= 3) {
      return 2; // Exact 3rd column highlighted as in the reference image
    }
    return 0;
  }, [hoveredIdx, activeId, columns]);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col select-none relative bg-card rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 ${className}`}
    >
      {/* ── Top Chart Controls Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
              Contribution Comparison
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
              <Sparkles className="w-3 h-3 text-orange-500" /> Stepped Velocity
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Stepped funnel visualization of team output across {metricLabel.toLowerCase()}
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Funnel sort toggle */}
          <button
            onClick={() => setIsFunnelSort(!isFunnelSort)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isFunnelSort
                ? "bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/30 font-semibold shadow-xs"
                : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:text-foreground"
            }`}
            title="Toggle between waterfall rank and original order"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isFunnelSort ? "Funnel Ranked" : "Default Order"}</span>
          </button>

          {/* Column count toggle */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-white/[0.08] p-0.5 bg-zinc-100/80 dark:bg-white/[0.03] text-xs">
            <button
              onClick={() => setDisplayCount(5)}
              className={`px-2 py-1 rounded-md transition-all font-mono text-[11px] cursor-pointer ${
                displayCount === 5
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => setDisplayCount(8)}
              className={`px-2 py-1 rounded-md transition-all font-mono text-[11px] cursor-pointer ${
                displayCount === 8
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Top 8
            </button>
            <button
              onClick={() => setDisplayCount("all")}
              className={`px-2 py-1 rounded-md transition-all font-mono text-[11px] cursor-pointer ${
                displayCount === "all"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              All
            </button>
          </div>

          {/* Metric Selector Dropdown if provided */}
          {metricOptions && onMetricChange && (
            <select
              className="h-8 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-800 px-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              value={currentMetric}
              onChange={(e) => onMetricChange(e.target.value)}
              aria-label="Select metric"
            >
              {Object.entries(metricOptions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Main SVG Canvas Container ── */}
      <div className="relative w-full overflow-x-auto overflow-y-visible">
        <svg
          viewBox={`0 0 ${containerWidth} ${chartHeight}`}
          width="100%"
          height={chartHeight}
          className="overflow-visible block"
          style={{ minWidth: columns.length > 5 ? `${columns.length * 110}px` : "100%" }}
        >
          <defs>
            {/* 1. Diagonal stripes pattern (Vibrant energetic brand orange, 45 degree angle) */}
            <pattern
              id={`stripes-${uid}`}
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="14" height="14" fill="#ea580c" />
              <rect x="0" y="0" width="7" height="14" fill="#f97316" />
            </pattern>

            {/* 2. Soft bottom ambient luminous glow */}
            <linearGradient id={`bottom-glow-${uid}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#fed7aa" stopOpacity="0.25" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* 3. Solid Vibrant Brand Orange Bar Gradient */}
            <linearGradient id={`solid-orange-bar-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="25%" stopColor="#fb923c" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* 4. Column Track / Lane frosted gradient (Default) */}
            <linearGradient id={`lane-grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.06" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.025" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.005" />
            </linearGradient>

            {/* 5. Hover Column Lane Gradient (Warm frosted orange box formed BEHIND the bar) */}
            <linearGradient id={`lane-hover-orange-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.16" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>

            {/* 6. Active Focus Lane Gradient */}
            <linearGradient id={`lane-active-orange-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>

            {/* 7. 3D Step Drop Slope Facet Gradient (Warm amber to orange) */}
            <linearGradient id={`facet-grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.70" />
              <stop offset="50%" stopColor="#fb923c" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.18" />
            </linearGradient>

            {/* Soft Warm Orange Glow Filter for Active/Hovered Bar */}
            <filter id={`orange-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#f97316" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* ── Y-Axis Gridlines & Tick Labels ── */}
          <g className="y-axis">
            {ticks.map((tickVal) => {
              const fraction = tickVal / niceMax;
              const y = chartFloor - fraction * usableBarH;
              return (
                <g key={tickVal}>
                  {/* Subtle horizontal grid line */}
                  <line
                    x1={yAxisWidth}
                    y1={y}
                    x2={containerWidth - rightPadding}
                    y2={y}
                    stroke="currentColor"
                    className="text-zinc-200/80 dark:text-white/[0.06]"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  {/* Y Axis numeric label */}
                  <text
                    x={yAxisWidth - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-zinc-400 dark:fill-zinc-500 select-none font-medium"
                  >
                    {yAxisFormatter(tickVal)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── Full-Height Column Tracks / Lanes (Formed BEHIND the bars!) ── */}
          <g className="column-tracks">
            {columns.map((col) => {
              const isHovered = hoveredIdx === col.index;
              const isSolidHighlight = col.index === highlightedIndex;

              return (
                <g key={`track-${col.item.id}`}>
                  {/* The Box Formed from BEHIND:
                      When hovering on a specific bar, this full-height box forms from BEHIND the bar!
                      Nothing is rendered on top of or covering the bar. */}
                  {isHovered ? (
                    <g>
                      {/* Highlighted warm orange box card BEHIND the bar */}
                      <rect
                        x={col.colLeft + 2}
                        y={topHeaderH - 10}
                        width={col.colWidth - 4}
                        height={chartFloor - topHeaderH + 12}
                        fill={`url(#lane-hover-orange-${uid})`}
                        stroke="#f97316"
                        strokeWidth="1.5"
                        strokeOpacity="0.5"
                        rx="6"
                        className="transition-all duration-200"
                      />
                      {/* Subtle top indicator pip behind header */}
                      <rect
                        x={col.colLeft + 8}
                        y={topHeaderH - 9}
                        width={col.colWidth - 16}
                        height="3"
                        fill="#f97316"
                        rx="1.5"
                      />
                    </g>
                  ) : isSolidHighlight ? (
                    /* Background box behind the active focus bar */
                    <rect
                      x={col.colLeft + 2}
                      y={topHeaderH - 10}
                      width={col.colWidth - 4}
                      height={chartFloor - topHeaderH + 12}
                      fill={`url(#lane-active-orange-${uid})`}
                      stroke="rgba(249, 115, 22, 0.25)"
                      strokeWidth="1"
                      rx="6"
                      className="transition-all duration-200"
                    />
                  ) : (
                    /* Default frosted vertical column lane */
                    <rect
                      x={col.colLeft + 2}
                      y={topHeaderH - 8}
                      width={col.colWidth - 4}
                      height={chartFloor - topHeaderH + 8}
                      fill={`url(#lane-grad-${uid})`}
                      stroke="currentColor"
                      className="text-zinc-200/60 dark:text-white/[0.05]"
                      strokeWidth="1"
                      rx="3"
                    />
                  )}

                  {/* Vertical lane separators */}
                  <line
                    x1={col.colLeft}
                    y1={topHeaderH - 8}
                    x2={col.colLeft}
                    y2={chartFloor}
                    stroke="currentColor"
                    className="text-zinc-200/40 dark:text-white/[0.04]"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            {/* Rightmost lane border */}
            {columns.length > 0 && (
              <line
                x1={columns[columns.length - 1].colLeft + columns[columns.length - 1].colWidth}
                y1={topHeaderH - 8}
                x2={columns[columns.length - 1].colLeft + columns[columns.length - 1].colWidth}
                y2={chartFloor}
                stroke="currentColor"
                className="text-zinc-200/40 dark:text-white/[0.04]"
                strokeWidth="1"
              />
            )}
          </g>

          {/* ── 3D Funnel Stepped Facets / Connecting Slopes (Reference Design) ── */}
          <g className="stepped-slopes">
            {columns.map((col, idx) => {
              if (idx === columns.length - 1) return null;
              const nextCol = columns[idx + 1];

              const x1 = col.barRight;
              const y1 = col.barTop;
              const x2 = nextCol.barLeft;
              const y2 = nextCol.barTop;

              // When bar 1 is taller than bar 2 (descending step):
              if (y1 <= y2) {
                return (
                  <g key={`slope-${col.item.id}-${nextCol.item.id}`}>
                    {/* Shaded drop-wall facet polygon */}
                    <polygon
                      points={`${x1},${y1} ${x2},${y2} ${x1},${y2}`}
                      fill={`url(#facet-grad-${uid})`}
                      className="transition-all duration-300"
                    />

                    {/* Crisp upper slope highlight line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#93c5fd"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      className="dark:stroke-cyan-300"
                    />

                    {/* Subtle vertical step wall boundary line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x1}
                      y2={y2}
                      stroke="#3b82f6"
                      strokeWidth="1.2"
                      strokeOpacity="0.4"
                    />
                  </g>
                );
              } else {
                // When stepping up:
                return (
                  <g key={`slope-${col.item.id}-${nextCol.item.id}`}>
                    <polygon
                      points={`${x1},${y1} ${x2},${y2} ${x2},${y1}`}
                      fill={`url(#facet-grad-${uid})`}
                      className="transition-all duration-300"
                    />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#93c5fd"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      className="dark:stroke-cyan-300"
                    />
                    <line
                      x1={x2}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#3b82f6"
                      strokeWidth="1.2"
                      strokeOpacity="0.4"
                    />
                  </g>
                );
              }
            })}
          </g>

          {/* ── The Bars (Striped Pattern + Solid Highlight Bar) ── */}
          <g className="bars">
            {columns.map((col) => {
              const isSolidHighlight = col.index === highlightedIndex;
              const isHovered = hoveredIdx === col.index;

              return (
                <g
                  key={`bar-${col.item.id}`}
                  className="transition-transform duration-200 cursor-pointer"
                  onClick={() => {
                    col.item.onClick?.();
                    onSelect?.(col.item);
                  }}
                  onMouseEnter={() => setHoveredIdx(col.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isSolidHighlight ? (
                    /* ── Solid Radiant Brand Orange Bar (GitInsight's signature accent / Active state) ── */
                    <g filter={`url(#orange-glow-${uid})`}>
                      <rect
                        x={col.barLeft}
                        y={col.barTop}
                        width={col.barWidth}
                        height={col.barH}
                        fill={`url(#solid-orange-bar-${uid})`}
                        rx="2"
                        className="transition-all duration-200"
                      />
                      {/* Top rim highlight edge */}
                      <line
                        x1={col.barLeft}
                        y1={col.barTop}
                        x2={col.barRight}
                        y2={col.barTop}
                        stroke="#fed7aa"
                        strokeWidth="2.5"
                        strokeLinecap="square"
                      />
                    </g>
                  ) : (
                    /* ── Diagonal Striped Pattern Bar (Bars in reference image) ── */
                    <g>
                      {/* Diagonal stripe patterned fill */}
                      <rect
                        x={col.barLeft}
                        y={col.barTop}
                        width={col.barWidth}
                        height={col.barH}
                        fill={`url(#stripes-${uid})`}
                        rx="2"
                        className="transition-all duration-200"
                      />

                      {/* Ambient bottom-up luminous glow */}
                      <rect
                        x={col.barLeft}
                        y={col.barTop}
                        width={col.barWidth}
                        height={col.barH}
                        fill={`url(#bottom-glow-${uid})`}
                        pointerEvents="none"
                      />

                      {/* Crisp top edge */}
                      <line
                        x1={col.barLeft}
                        y1={col.barTop}
                        x2={col.barRight}
                        y2={col.barTop}
                        stroke="#93c5fd"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Column Headers (Category Label + Large Metric Value) ── */}
          <g className="column-headers">
            {columns.map((col) => {
              const isHighlighted = col.index === highlightedIndex;
              const formattedVal = col.item.formattedValue || defaultFormatValue(col.item.value);

              return (
                <g
                  key={`header-${col.item.id}`}
                  className="cursor-pointer select-none"
                  onClick={() => {
                    col.item.onClick?.();
                    onSelect?.(col.item);
                  }}
                  onMouseEnter={() => setHoveredIdx(col.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Category / Contributor Label */}
                  <text
                    x={col.colCenter}
                    y={28}
                    textAnchor="middle"
                    className={`text-[12px] font-medium transition-colors select-none ${
                      isHighlighted
                        ? "fill-orange-600 dark:fill-orange-400 font-bold"
                        : "fill-zinc-500 dark:fill-zinc-400"
                    }`}
                  >
                    {col.item.label.length > 16
                      ? `${col.item.label.slice(0, 15)}…`
                      : col.item.label}
                  </text>

                  {/* Large Hero Metric Value */}
                  <text
                    x={col.colCenter}
                    y={54}
                    textAnchor="middle"
                    className={`text-[20px] font-bold font-mono tracking-tight select-none transition-colors ${
                      isHighlighted
                        ? "fill-orange-600 dark:fill-orange-400 font-extrabold"
                        : "fill-zinc-800 dark:fill-zinc-200"
                    }`}
                  >
                    {formattedVal}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── Invisible Interactive Column Trigger Zones ── */}
          <g className="interaction-hitboxes">
            {columns.map((col) => (
              <rect
                key={`hitbox-${col.item.id}`}
                x={col.colLeft}
                y={0}
                width={col.colWidth}
                height={chartFloor}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(col.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  col.item.onClick?.();
                  onSelect?.(col.item);
                }}
              />
            ))}
          </g>
        </svg>

        {/* ── Interactive Floating Tooltip Pill (Positioned cleanly at top above the column) ── */}
        {hoveredIdx !== null && columns[hoveredIdx] && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2"
            style={{
              left: `${columns[hoveredIdx].colCenter}px`,
              top: `2px`,
            }}
          >
            <div className="bg-zinc-950/95 dark:bg-zinc-950/95 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-orange-500/40 backdrop-blur-md flex items-center gap-2.5 text-xs whitespace-nowrap">
              {columns[hoveredIdx].item.avatar && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 font-bold text-[10px] grid place-items-center text-white shrink-0 shadow-xs">
                  {columns[hoveredIdx].item.avatar}
                </div>
              )}
              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>{columns[hoveredIdx].item.label}</span>
                  {columns[hoveredIdx].item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-mono border border-orange-500/30">
                      {columns[hoveredIdx].item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-300 font-mono mt-0.5">
                  <span className="font-bold text-orange-400">
                    {columns[hoveredIdx].item.value.toLocaleString()}
                  </span>{" "}
                  {metricLabel.toLowerCase()}
                  {totalValue > 0 && (
                    <span className="text-zinc-400 ml-1.5">
                      ({Math.round((columns[hoveredIdx].item.value / totalValue) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Summary Row ── */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-gradient-to-b from-orange-500 to-amber-600 shadow-xs inline-block" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Active focus / Peak velocity</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-xs inline-block"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #2563eb, #2563eb 2px, #3b82f6 2px, #3b82f6 4px)",
              }}
            />
            <span>Stepped contributors</span>
          </span>
        </div>

        <div className="font-mono text-[11px]">
          Total team {metricLabel.toLowerCase()}:{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            {totalValue.toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
}
