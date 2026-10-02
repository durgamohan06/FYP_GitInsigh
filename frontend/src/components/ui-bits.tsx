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
      className={`rounded-2xl bg-card border border-border shadow-sm ${lift ? "card-lift" : ""} ${className}`}
    >
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
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    brand: "bg-brand/15 text-brand",
    cyan: "bg-accent-cyan/15 text-accent-cyan",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]} ${className}`}
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
  color = "var(--color-brand)",
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
    </svg>
  );
}

export function CircularProgress({
  value,
  size = 180,
  stroke = 14,
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
            <stop offset="0%" stopColor="var(--color-brand)" />
            <stop offset="100%" stopColor="var(--color-brand-2)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-muted)"
          strokeWidth={stroke}
          fill="none"
        />
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
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-semibold tracking-tight">
            <CountUp value={value} />%
          </div>
          {label && <div className="text-sm font-medium mt-1">{label}</div>}
          {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
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
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50";
  const map = {
    primary:
      "bg-brand-gradient text-white shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5",
    secondary: "bg-card border border-border hover:bg-accent",
    outline: "border border-border hover:bg-accent",
    ghost: "hover:bg-accent",
  };
  return (
    <button className={`${base} ${map[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
