import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AmountText, Card, ProgressBar } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { Confetti } from "@/components/twogether/Confetti";
import { PrivacyDial } from "@/components/twogether/primitives";
import { getGoals, getGoalContributions } from "@/data/service";
import { format } from "date-fns";

export function Goals() {
  const goalsQ = useQuery({ queryKey: ["goals"], queryFn: getGoals });
  const contribQ = useQuery({ queryKey: ["goalContributions"], queryFn: getGoalContributions });

  const [addOpen, setAddOpen]         = useState(false);
  const [contribOpen, setContribOpen] = useState<string | null>(null);
  const [privacy, setPrivacy]         = useState<"private"|"visible"|"shared">("shared");
  const [emoji, setEmoji]             = useState("🌱");

  const contribBy = (goalId: string) => {
    const cs = (contribQ.data ?? []).filter((c) => c.goalId === goalId);
    const a = cs.filter((c) => c.ownerId === "aarav").reduce((s, c) => s + c.amount, 0);
    const m = cs.filter((c) => c.ownerId === "meera").reduce((s, c) => s + c.amount, 0);
    return { a, m };
  };

  return (
    <div className="px-4 pb-6">
      <div className="flex flex-col gap-3">
        {(goalsQ.data ?? []).map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          const complete = pct >= 100;
          const { a, m } = contribBy(g.id);
          return (
            <Card key={g.id} className="relative overflow-hidden p-5">
              {complete && <Confetti fireKey={`goal_complete_${g.id}`} />}
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[color:var(--blush)] text-2xl">
                  {g.emoji}
                </span>
                <div className="min-w-0">
                  <div className="text-[15.5px] font-bold text-[color:var(--ink)]">{g.name}</div>
                  {g.targetDate && (
                    <div className="text-[11.5px] text-[color:var(--ink-soft)]">
                      on track for {format(new Date(g.targetDate), "MMM ''yy")}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <AmountText value={g.saved} size={26} />
                <span className="text-[12.5px] text-[color:var(--ink-soft)]">
                  of ₹{g.target.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-2"><ProgressBar value={g.saved} max={g.target} height={10} /></div>
              <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-[color:var(--ink-soft)]">
                <span>{pct}%</span>
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                    A ₹{Math.round(a/1000)}k
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent-2)" }} />
                    M ₹{Math.round(m/1000)}k
                  </span>
                </span>
              </div>

              <button
                onClick={() => setContribOpen(g.id)}
                className="mt-4 w-full rounded-[12px] py-2.5 text-[13px] font-bold text-white"
                style={{ background: "var(--ours)" }}
              >
                Add money
              </button>
            </Card>
          );
        })}

        <button
          onClick={() => setAddOpen(true)}
          className="grid min-h-[100px] place-items-center rounded-[20px] border-2 border-dashed border-[color:var(--line)] text-[13.5px] font-bold text-[color:var(--ink-soft)]"
        >
          <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" /> New goal</span>
        </button>
      </div>

      {/* Add contribution */}
      <BottomSheet
        open={!!contribOpen}
        onClose={() => setContribOpen(null)}
        title="Add money"
        primaryCta={
          <button className="w-full rounded-[14px] py-3 text-[14px] font-bold text-white" style={{ background: "var(--ours)" }}>
            Contribute
          </button>
        }
      >
        <div className="text-center">
          <div className="text-[12.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Amount</div>
          <div className="mt-2"><AmountText value={5000} size={40} /></div>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {[1000, 2500, 5000, 10000].map((n) => (
            <button key={n} className="rounded-full bg-[color:var(--mist)] px-3 py-1.5 text-[12.5px] font-semibold">
              ₹{n.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* New goal */}
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New goal"
        primaryCta={
          <button className="w-full rounded-[14px] py-3 text-[14px] font-bold text-white" style={{ background: "var(--accent)" }}>
            Create goal
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-[16px] bg-[color:var(--blush)] text-3xl">{emoji}</div>
          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            {["🌱","🏠","✈️","🚗","💍","🎓","🍼","🌴","🎁"].map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg ${emoji===e?"bg-[color:var(--mist)]":""}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Name</label>
          <input placeholder="e.g. Tokyo trip" className="mt-1 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-[14px] outline-none" />
        </div>
        <div className="mt-3">
          <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Target</label>
          <input inputMode="numeric" placeholder="₹1,50,000" className="mt-1 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-[14px] outline-none" />
        </div>
        <div className="mt-4">
          <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Privacy</label>
          <div className="mt-2"><PrivacyDial value={privacy} onChange={setPrivacy} /></div>
        </div>
      </BottomSheet>
    </div>
  );
}
