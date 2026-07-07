import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from "react";
import type { OwnerId, Ownership } from "@/data/types";

// ---------- AppHeader ----------
export function AppHeader({
  title,
  right,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-2 pb-3">
      <div className="min-w-0">
        <h1 className="screen-title truncate">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[color:var(--ink-soft)]">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

// ---------- Card ----------
export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] bg-[color:var(--surface)] card-shadow border border-[color:var(--line)]/60 p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------- Section header ----------
export function SectionHeader({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <span className="section-header">{children}</span>
      {right}
    </div>
  );
}

// ---------- PillTabs ----------
export function PillTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-[color:var(--mist)] p-1 text-[13px] font-semibold">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-4 py-1.5 transition-colors duration-[180ms]",
              active
                ? "bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[0_1px_4px_rgba(43,35,64,0.08)]"
                : "text-[color:var(--ink-soft)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Chip ----------
export function Chip({
  children,
  tone = "neutral",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "me" | "partner" | "ours" | "gold" | "success" | "alert";
}) {
  const styles: Record<string, string> = {
    neutral: "bg-[color:var(--mist)] text-[color:var(--ink)]",
    me:      "bg-[color:var(--blush)] text-[color:var(--accent)]",
    partner: "bg-[#E4EEE9] text-[color:var(--accent-2)]",
    ours:    "text-white bg-ours",
    gold:    "bg-[#F7EAD1] text-[color:var(--gold)]",
    success: "bg-[#E4EEE9] text-[color:var(--success)]",
    alert:   "bg-[#F6E1E1] text-[color:var(--alert)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
        styles[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

// ---------- Avatar ----------
export function Avatar({
  owner,
  emoji,
  size = 40,
  ring = true,
}: {
  owner: OwnerId | "ours";
  emoji: string;
  size?: number;
  ring?: boolean;
}) {
  const ringBg =
    owner === "aarav" ? "var(--accent)" :
    owner === "meera" ? "var(--accent-2)" :
    "var(--ours)";
  return (
    <div
      className="relative shrink-0 grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: ring ? (owner === "ours" ? ringBg : ringBg) : "transparent",
        padding: ring ? 2 : 0,
      }}
    >
      <div
        className="grid h-full w-full place-items-center rounded-full bg-[color:var(--surface)]"
        style={{ fontSize: size * 0.55 }}
      >
        <span>{emoji}</span>
      </div>
    </div>
  );
}

// ---------- Paired avatar (two overlapping circles with gradient ring) ----------
export function PairedAvatar({
  a, b, size = 44,
}: { a: string; b: string; size?: number }) {
  const inner = size * 0.75;
  return (
    <div
      className="relative shrink-0 rounded-full p-[2px] bg-ours"
      style={{ width: size + inner * 0.55, height: size }}
    >
      <div className="relative flex h-full w-full items-center">
        <div
          className="grid place-items-center rounded-full bg-[color:var(--surface)]"
          style={{ width: inner, height: inner, fontSize: inner * 0.55 }}
        >
          {a}
        </div>
        <div
          className="grid place-items-center rounded-full bg-[color:var(--surface)] -ml-3 ring-2"
          style={{
            width: inner,
            height: inner,
            fontSize: inner * 0.55,
            // @ts-expect-error css var
            "--tw-ring-color": "var(--surface)",
          }}
        >
          {b}
        </div>
      </div>
    </div>
  );
}

// ---------- AmountText (Indian comma system) ----------
export function formatINR(n: number) {
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  const [intPart] = String(abs).split(".");
  // Indian grouping: last 3, then groups of 2
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3
    : last3;
  return (neg ? "-" : "") + grouped;
}

export function AmountText({
  value,
  size = 34,
  className,
  muted,
}: { value: number; size?: number; className?: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "font-display font-semibold tabular-nums",
        muted ? "text-[color:var(--ink-soft)]" : "text-[color:var(--ink)]",
        className,
      )}
      style={{ fontSize: size, lineHeight: 1.05, letterSpacing: "-0.01em" }}
    >
      <span style={{ fontSize: size * 0.6, marginRight: 2 }}>₹</span>
      {formatINR(value)}
    </span>
  );
}

// ---------- ProgressBar ----------
export function ProgressBar({
  value, max = 100, tone = "ours", height = 10,
}: {
  value: number; max?: number;
  tone?: "ours" | "me" | "partner" | "gold";
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg =
    tone === "me"      ? "var(--accent)" :
    tone === "partner" ? "var(--accent-2)" :
    tone === "gold"    ? "var(--gold)" :
    "var(--ours)";
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[color:var(--mist)]"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: bg }}
      />
    </div>
  );
}

// ---------- SkeletonCard ----------
export function SkeletonCard({ height = 96 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-[20px] bg-[color:var(--mist)]/70"
      style={{ height }}
    />
  );
}

// ---------- EmptyState ----------
export function EmptyState({
  emoji, line, cta,
}: { emoji: string; line: string; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 text-5xl">{emoji}</div>
      <p className="mb-4 text-[15px] text-[color:var(--ink-soft)]">{line}</p>
      {cta}
    </div>
  );
}

// ---------- SegmentedOwner ----------
export function SegmentedOwner({
  value, onChange,
}: {
  value: Ownership;
  onChange: (v: Ownership) => void;
}) {
  const opts: { v: Ownership; label: string; color: string }[] = [
    { v: "me",      label: "Me",      color: "var(--accent)" },
    { v: "partner", label: "Partner", color: "var(--accent-2)" },
    { v: "ours",    label: "Ours",    color: "transparent" },
  ];
  return (
    <div className="inline-flex rounded-full bg-[color:var(--mist)] p-1">
      {opts.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-[180ms]",
              active && o.v !== "ours" && "text-white",
              active && o.v === "ours" && "text-white bg-ours",
              !active && "text-[color:var(--ink-soft)]",
            )}
            style={active && o.v !== "ours" ? { background: o.color } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- PrivacyDial ----------
export function PrivacyDial({
  value, onChange,
}: {
  value: "private" | "visible" | "shared";
  onChange: (v: "private" | "visible" | "shared") => void;
}) {
  const opts = [
    { v: "private" as const, icon: "🔒", label: "Private" },
    { v: "visible" as const, icon: "👀", label: "Visible" },
    { v: "shared"  as const, icon: "🤝", label: "Shared" },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "flex-1 rounded-2xl border p-3 text-center transition-all duration-[180ms]",
              active
                ? "border-transparent bg-[color:var(--blush)] text-[color:var(--ink)]"
                : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-soft)]",
            )}
          >
            <div className="text-lg">{o.icon}</div>
            <div className="mt-0.5 text-[11.5px] font-semibold">{o.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- FAB ----------
export function FAB({
  onClick, className, children,
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_10px_24px_rgba(226,114,91,0.35)]",
        "transition-transform duration-[180ms] active:scale-95",
        className,
      )}
      style={{ background: "var(--ours)" }}
      aria-label="Add"
    >
      {children}
    </button>
  );
}
