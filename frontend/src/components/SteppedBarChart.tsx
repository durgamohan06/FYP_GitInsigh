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

  // Selected/active column index (from activeId or hover)
  const activeColIdx = useMemo(() => {
    if (hoveredIdx !== null) return hoveredIdx;
    if (activeId) {
      const idx = columns.findIndex((c) => c.item.id === activeId);
      if (idx !== -1) return idx;
    }
    return null;
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
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 font-semibold shadow-xs"
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
              className="h-8 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-800 px-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs focus:outline-hidden focus:ring-1 focus:ring-orange-500"
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
      <div className="relative w-full pt-10 overflow-x-auto overflow-y-visible">
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
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.005" />
            </linearGradient>

            {/* 5. Hover Card Gradient: Fades and disappears as it reaches the top (0 opacity at top) */}
            <linearGradient id={`card-back-orange-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0" />
              <stop offset="30%" stopColor="#ea580c" stopOpacity="0.04" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.15" />
              <stop offset="85%" stopColor="#f97316" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.34" />
            </linearGradient>

            {/* 6. Hover Card Stroke Gradient: Zero line at the top, fades in toward the bar */}
            <linearGradient id={`card-stroke-orange-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0" />
              <stop offset="40%" stopColor="#ea580c" stopOpacity="0" />
              <stop offset="75%" stopColor="#ea580c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.65" />
            </linearGradient>

            {/* Soft Card Shadow Filter for Back Card */}
            <filter id={`back-card-shadow-${uid}`} x="-15%" y="-10%" width="130%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ea580c" floodOpacity="0.16" />
            </filter>

            {/* 7. 3D Side Layer / Drop Facet Gradient (Rich 3D depth for the side of each bar) */}
            <linearGradient id={`facet-grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.80" />
              <stop offset="25%" stopColor="#fb923c" stopOpacity="0.55" />
              <stop offset="65%" stopColor="#ea580c" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0.30" />
            </linearGradient>

            {/* 8. Side Depth Ambient Shadow Gradient */}
            <linearGradient id={`side-shadow-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.04" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
            </linearGradient>
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
              const isActive = activeColIdx === col.index;
              const showOrangeBackCard = isHovered || isActive;

              const isLast = col.index === columns.length - 1;
              const nextCol = !isLast ? columns[col.index + 1] : null;
              const defaultSideWidth = Math.max(14, Math.min(22, col.colWidth * 0.16));

              const xL = col.barLeft;
              const xR = nextCol
                ? nextCol.barLeft
                : Math.min(containerWidth - rightPadding, col.barRight + defaultSideWidth);
              const topY = 10;
              const r = 8;
              const ySlopeEnd = nextCol
                ? nextCol.barTop
                : Math.min(chartFloor, col.barTop + (chartFloor - col.barTop) * 0.6);

              // Path defining the hover card placed strictly in the upper region annotated by the user:
              // Encloses the contributor name & value, bottoms out at the top edge of the bar and slopes down the side layer
              const cardPath = `
                M ${xL + r} ${topY}
                L ${xR - r} ${topY}
                A ${r} ${r} 0 0 1 ${xR} ${topY + r}
                L ${xR} ${ySlopeEnd}
                L ${col.barRight} ${col.barTop}
                L ${xL} ${col.barTop}
                L ${xL} ${topY + r}
                A ${r} ${r} 0 0 1 ${xL + r} ${topY}
                Z
              `;

              return (
                <g key={`track-${col.item.id}`}>
                  {/* Hover Card placed strictly in the white annotated upper area above the bar */}
                  {showOrangeBackCard && (
                    <g filter={`url(#back-card-shadow-${uid})`}>
                      <path
                        d={cardPath}
                        fill={`url(#card-back-orange-${uid})`}
                        stroke={`url(#card-stroke-orange-${uid})`}
                        strokeWidth="1.2"
                        className="transition-all duration-200"
                      />
                    </g>
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

          {/* ── 3D Stepped Side Layers / Drop Facets for EACH Bar (Reference Design) ── */}
          <g className="bar-side-layers">
            {columns.map((col, idx) => {
              const isLast = idx === columns.length - 1;
              const nextCol = !isLast ? columns[idx + 1] : null;

              const x1 = col.barRight;
              const y1 = col.barTop;

              // For connecting bars: x2 and y2 are nextCol's barLeft and barTop.
              // For the last bar: x2 is col.barRight + sideWidth, and y2 slopes down towards the floor.
              const defaultSideWidth = Math.max(14, Math.min(22, colWidth * 0.16));
              const x2 = nextCol
                ? nextCol.barLeft
                : Math.min(containerWidth - rightPadding, col.barRight + defaultSideWidth);
              const y2 = nextCol
                ? nextCol.barTop
                : Math.min(chartFloor, col.barTop + (chartFloor - col.barTop) * 0.6);

              const isHovered = hoveredIdx === col.index;
              const isActive = activeColIdx === col.index;
              const isHighlighted = isHovered || isActive;

              return (
                <g key={`side-layer-${col.item.id}`}>
                  {/* Full-height 3D side layer facet (quadrilateral from top slope all the way down to floor) */}
                  <polygon
                    points={`${x1},${y1} ${x2},${y2} ${x2},${chartFloor} ${x1},${chartFloor}`}
                    fill={`url(#facet-grad-${uid})`}
                    className="transition-all duration-300"
                  />

                  {/* 3D ambient depth shadow on side face */}
                  <polygon
                    points={`${x1},${y1} ${x2},${y2} ${x2},${chartFloor} ${x1},${chartFloor}`}
                    fill={`url(#side-shadow-${uid})`}
                    className="transition-all duration-300"
                    pointerEvents="none"
                  />

                  {/* Crisp top slanted highlight rim connecting top rims */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#fed7aa"
                    strokeWidth={isHighlighted ? "2.6" : "2"}
                    strokeLinecap="round"
                  />

                  {/* Vertical crease boundary line between front face of bar and its side layer */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x1}
                    y2={chartFloor}
                    stroke="#ea580c"
                    strokeWidth="1.5"
                    strokeOpacity={isHighlighted ? 0.95 : 0.65}
                  />

                  {/* Right edge boundary line of the side layer */}
                  <line
                    x1={x2}
                    y1={y2}
                    x2={x2}
                    y2={chartFloor}
                    stroke="#ea580c"
                    strokeWidth="1.2"
                    strokeOpacity={0.4}
                  />
                </g>
              );
            })}
          </g>

          {/* ── The Bars (All Bars in Signature Brand Orange Stripes - Zero Solid Cards on the Front) ── */}
          <g className="bars">
            {columns.map((col) => {
              const isHovered = hoveredIdx === col.index;
              const isActive = activeColIdx === col.index;
              const isSolid = isHovered || isActive;

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
                  {isSolid ? (
                    /* ── Solid Radiant Orange Bar (Only in Orange, NO STRIPES when hovered!) ── */
                    <g>
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
                    /* ── Orange Diagonal Striped Bar (Default state) ── */
                    <g>
                      {/* Diagonal striped orange pattern fill */}
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

                      {/* Crisp peach top edge rim highlight */}
                      <line
                        x1={col.barLeft}
                        y1={col.barTop}
                        x2={col.barRight}
                        y2={col.barTop}
                        stroke="#fed7aa"
                        strokeWidth="1.8"
                        strokeOpacity="0.85"
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
              const isHovered = hoveredIdx === col.index;
              const isActive = activeColIdx === col.index;
              const isHighlighted = isHovered || isActive;
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
                        : "fill-zinc-600 dark:fill-zinc-400"
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
            className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 top-1"
            style={{
              left: `${columns[hoveredIdx].colCenter}px`,
            }}
          >
            <div className="bg-zinc-950 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-orange-500/40 backdrop-blur-md flex items-center gap-2.5 text-xs whitespace-nowrap">
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
            {/* Small downward pointer triangle */}
            <div className="w-2 h-2 bg-zinc-950 border-r border-b border-orange-500/40 rotate-45 mx-auto -mt-1" />
          </div>
        )}
      </div>

      {/* ── Bottom Summary Row ── */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-xs inline-block shadow-xs border border-orange-500/30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #ea580c, #ea580c 2px, #f97316 2px, #f97316 4px)",
              }}
            />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Orange stepped bars</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-xs inline-block shadow-xs border border-orange-500/40"
              style={{
                background: "linear-gradient(135deg, #fed7aa 0%, #fb923c 40%, #ea580c 100%)",
              }}
            />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">3D side layers</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-orange-500/20 border border-orange-500/50 inline-block shadow-xs" />
            <span>Hover card (back side)</span>
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
