import { useEffect, useRef, useState, type ReactNode } from "react";

export function Card({
  className = "",
  children,
  lift = true,
}: {
  className?: string;
  children: ReactNode;
  lift?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl bg-card border border-zinc-200/80 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/40 backdrop-blur-xl ${
        lift ? "card-lift" : ""
      } ${className}`}
    >
      {/* Subtle top rim light */}
      <div 
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/[0.12] to-transparent pointer-events-none rounded-t-2xl" 
        aria-hidden="true" 
      />
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "brand" | "cyan";
  className?: string;
}) {
  const map: Record<string, string> = {
    default: "bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    brand: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium border ${map[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n.toLocaleString()}</>;
}

export function Sparkline({
  data,
  color = "#f97316",
}: {
  data: readonly number[] | number[];
  color?: string;
}) {
  const w = 100;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const id = useRef(`sp-${Math.random().toString(36).slice(2)}`).current;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CircularProgress({
  value,
  size = 180,
  stroke = 12,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProgress(value), 100);
    return () => clearTimeout(t);
  }, [value]);
  const offset = c - (progress / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="cp-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff6525" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer subtle glow ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Animated Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#cp-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          filter="url(#gaugeGlow)"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-mono font-bold tracking-tight text-white drop-shadow-sm">
            <CountUp value={value} />%
          </div>
          {label && <div className="text-xs font-medium text-zinc-300 mt-1">{label}</div>}
          {sublabel && <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const map = {
    primary:
      "bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-[0_0_20px_-3px_rgba(234,88,12,0.45)] border border-orange-400/30 hover:shadow-[0_0_28px_-2px_rgba(234,88,12,0.6)]",
    secondary:
      "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.16] shadow-sm",
    outline:
      "border border-zinc-200 dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]",
    ghost:
      "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]",
  };
  return (
    <button className={`${base} ${map[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
