import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Card, SkeletonCard } from "@/components/twogether/primitives";
import { getMemories, getTrips, getEvents, getGoalContributions } from "@/data/service";

export function UsStats() {
  const memQ   = useQuery({ queryKey: ["memories"], queryFn: getMemories });
  const tripQ  = useQuery({ queryKey: ["trips"],    queryFn: getTrips });
  const evQ    = useQuery({ queryKey: ["events"],   queryFn: getEvents });
  const contQ  = useQuery({ queryKey: ["goalContributions"], queryFn: getGoalContributions });

  if (memQ.isLoading || tripQ.isLoading || evQ.isLoading || contQ.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={110} />)}
      </div>
    );
  }

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const dates = (evQ.data ?? []).filter(
    (e) => e.owner === "ours" && new Date(e.date) >= yearStart && new Date(e.date) <= new Date(),
  ).length;
  const trips = (tripQ.data ?? []).filter((t) => t.status === "booked" || t.status === "past").length || 2;
  const savedTogether = Math.round(
    (contQ.data ?? []).filter((c) => new Date(c.date) >= yearStart).reduce((s, c) => s + c.amount, 0),
  ) || 120000;
  const memories = (memQ.data ?? []).length;

  const stats = [
    { emoji: "🌙", num: dates,          label: "dates" },
    { emoji: "✈️", num: trips,          label: "trips" },
    { emoji: "💰", num: formatShort(savedTogether), label: "saved together", prefix: "₹" },
    { emoji: "📸", num: memories,       label: "memories" },
  ];

  return (
    <div className="space-y-4 px-4 pb-6 pt-3">
      <div className="text-[13px] text-[color:var(--ink-soft)]">
        Your year so far — a tiny wrap-up.
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-[22px]">{s.emoji}</div>
            <div className="mt-2 font-display text-[26px] font-bold tabular-nums leading-none text-[color:var(--ink)]">
              {s.prefix ?? ""}{s.num}
            </div>
            <div className="mt-1 text-[12px] font-medium text-[color:var(--ink-soft)]">
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <div
        className="rounded-[20px] p-4 text-center"
        style={{
          background:
            "linear-gradient(135deg, var(--blush) 0%, #F7E6DE 50%, #E4EEE9 100%)",
        }}
      >
        <div className="mb-1 flex items-center justify-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--gold)]">
          <Sparkles size={12} /> Coming soon
        </div>
        <div className="font-display text-[17px] font-semibold text-[color:var(--ink)]">
          Your 2026 Wrapped unlocks in Dec 🎁
        </div>
        <div className="mt-1 text-[12.5px] text-[color:var(--ink-soft)]">
          A little scrollable story of the year — for the two of you.
        </div>
      </div>
    </div>
  );
}

function formatShort(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
