import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import { Card, ProgressBar } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getCategories, getTransactions } from "@/data/service";
import { cn } from "@/lib/utils";

export function Budgets() {
  const catQ = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const txQ  = useQuery({ queryKey: ["transactions"], queryFn: getTransactions });
  const [methodsOpen, setMethodsOpen] = useState(false);

  const envelopes = useMemo(() => {
    const cats = (catQ.data ?? []).filter((c) => c.budget);
    const spentBy = new Map<string, number>();
    for (const t of txQ.data ?? []) {
      spentBy.set(t.categoryId, (spentBy.get(t.categoryId) ?? 0) + t.amount);
    }
    return cats.map((c) => {
      // scale to something monthly-ish so cards vary nicely
      const raw = spentBy.get(c.id) ?? 0;
      const spent =
        c.id === "cat_dining"  ? 5420 :
        c.id === "cat_dates"   ? 2150 :
        c.id === "cat_food"    ? 1890 :
        c.id === "cat_groc"    ? 6840 :
        c.id === "cat_util"    ? 3539 :
        c.id === "cat_sub"     ? 1616 :
        c.id === "cat_rent"    ? 32000 :
        raw;
      return { ...c, spent };
    });
  }, [catQ.data, txQ.data]);

  return (
    <div className="px-4 pb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] text-[color:var(--ink-soft)]">This month · July</div>
        <button
          onClick={() => setMethodsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--mist)] px-3 py-1.5 text-[12px] font-bold text-[color:var(--ink)]"
        >
          <BookOpen className="h-3.5 w-3.5" /> Methods
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {envelopes.map((e) => {
          const pct = Math.min(999, (e.spent / (e.budget ?? 1)) * 100);
          const over = pct > 100;
          const near = pct >= 80 && pct <= 100;
          const barTone: "ours" | "gold" = near || over ? "gold" : "ours";
          const barColor = over ? "var(--alert)" : near ? "var(--caution)" : undefined;
          return (
            <Card key={e.id} className="p-3.5">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--mist)] text-[16px]">
                  {e.emoji}
                </span>
                {over && (
                  <span className="rounded-full bg-[#F6E1E1] px-2 py-0.5 text-[10.5px] font-bold text-[color:var(--alert)]">
                    over
                  </span>
                )}
              </div>
              <div className="mt-3 text-[13px] font-bold text-[color:var(--ink)]">{e.name}</div>
              <div className="mt-1 text-[11.5px] text-[color:var(--ink-soft)]">
                ₹{e.spent.toLocaleString("en-IN")} / ₹{(e.budget ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="mt-2">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--mist)]"
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: barColor ?? "var(--ours)",
                    }}
                  />
                </div>
              </div>
              {e.id === "cat_dining" && (
                <div className="mt-2 text-[10.5px] font-semibold text-[color:var(--caution)]">
                  38% above usual
                </div>
              )}
            </Card>
          );
        })}
        <button className="grid min-h-[128px] place-items-center rounded-[20px] border-2 border-dashed border-[color:var(--line)] text-[13px] font-bold text-[color:var(--ink-soft)]">
          <span className="flex flex-col items-center gap-1">
            <Plus className="h-5 w-5" />
            Envelope
          </span>
        </button>
      </div>

      <MethodsSheet open={methodsOpen} onClose={() => setMethodsOpen(false)} />
    </div>
  );
}

function MethodsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const methods = [
    { name: "50 / 30 / 20",       body: "Split take-home into needs, wants, savings.", emoji: "📊" },
    { name: "Kakeibo",            body: "Reflective monthly journaling of spend.",     emoji: "📓" },
    { name: "Envelopes",          body: "Give every category a monthly ceiling.",      emoji: "✉️" },
    { name: "Zero-based",         body: "Every rupee gets a job before the month.",    emoji: "🎯" },
    { name: "Yours · Mine · Ours", body: "Three pools with clear rules for each.",     emoji: "💞" },
    { name: "Money Date",         body: "A monthly ritual, not a spreadsheet.",         emoji: "☕" },
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title="Budgeting techniques">
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {methods.map((m) => (
          <div
            key={m.name}
            className="w-[240px] shrink-0 snap-start rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4"
          >
            <div className="text-3xl">{m.emoji}</div>
            <div className="mt-2 font-display text-[16px] font-bold text-[color:var(--ink)]">{m.name}</div>
            <p className="mt-1 text-[12.5px] leading-snug text-[color:var(--ink-soft)]">{m.body}</p>
            <button className="mt-3 w-full rounded-[10px] bg-[color:var(--ink)] py-2 text-[12.5px] font-bold text-white">
              Adopt
            </button>
          </div>
        ))}
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--blush)] py-3 text-[13.5px] font-bold text-[color:var(--ink)]">
        ✨ Which fits us? Take the 60-sec quiz
      </button>
    </BottomSheet>
  );
}
