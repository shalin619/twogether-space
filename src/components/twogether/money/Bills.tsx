import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInCalendarDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Plus, Check } from "lucide-react";
import { Card } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getBills } from "@/data/service";
import { cn } from "@/lib/utils";
import { profiles } from "@/data/mockData";

export function Bills() {
  const billsQ = useQuery({ queryKey: ["bills"], queryFn: getBills });
  const [addOpen, setAddOpen] = useState(false);

  const now = new Date();
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }),
    [now],
  );

  const billsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of billsQ.data ?? []) {
      const k = b.dueDate.slice(0, 10);
      m.set(k, (m.get(k) ?? 0) + b.amount);
    }
    return m;
  }, [billsQ.data]);

  return (
    <div className="px-4 pb-6">
      {/* Mini calendar */}
      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-[13px] font-bold text-[color:var(--ink)]">{format(now, "MMMM yyyy")}</div>
          <div className="text-[11.5px] text-[color:var(--ink-soft)]">Amounts due</div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="text-[10px] font-bold uppercase text-[color:var(--ink-soft)]">{d}</div>
          ))}
          {/* pad start */}
          {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={"pad"+i} />
          ))}
          {days.map((d) => {
            const has = billsByDay.get(d.toISOString().slice(0,10));
            const isToday = isSameDay(d, now);
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "relative grid h-9 place-items-center rounded-[10px] text-[12px]",
                  isToday && "bg-[color:var(--blush)] font-bold text-[color:var(--accent)]",
                )}
              >
                {format(d, "d")}
                {has && (
                  <span
                    className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--gold)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* List */}
      <div className="mt-4 flex flex-col gap-2">
        {(billsQ.data ?? []).map((b) => {
          const days = differenceInCalendarDays(new Date(b.dueDate), now);
          const chipTone =
            days <= 2 ? { bg: "#F7EAD1", fg: "var(--gold)" } :
            days <= 7 ? { bg: "var(--mist)", fg: "var(--ink)" } :
                        { bg: "var(--surface)", fg: "var(--ink-soft)" };
          const payerColor =
            b.payer === "joint" ? "var(--ours)" :
            b.payer === "aarav" ? "var(--accent)" : "var(--accent-2)";
          const payerName =
            b.payer === "joint" ? "Joint" : profiles.find(p=>p.id===b.payer)?.name ?? "";
          return (
            <div key={b.id} className="flex items-center gap-3 rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface)] p-3 card-shadow">
              <span
                className="h-10 w-1 shrink-0 rounded-full"
                style={{ background: payerColor }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[14px] font-semibold text-[color:var(--ink)]">{b.name}</span>
                  {b.autopay && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[color:var(--mist)] px-1.5 py-0.5 text-[9.5px] font-bold text-[color:var(--ink-soft)]">
                      <Check className="h-2.5 w-2.5" /> autopay
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11.5px] text-[color:var(--ink-soft)]">
                  {payerName} pays
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">
                  ₹{b.amount.toLocaleString("en-IN")}
                </div>
                <div
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  style={{ background: chipTone.bg, color: chipTone.fg }}
                >
                  {days <= 0 ? "today" : `in ${days} day${days>1?"s":""}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="mt-4 grid w-full place-items-center rounded-[16px] border-2 border-dashed border-[color:var(--line)] py-4 text-[13.5px] font-bold text-[color:var(--ink-soft)]"
      >
        <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add bill</span>
      </button>

      <AddBillSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AddBillSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [payer, setPayer] = useState<"aarav"|"meera"|"joint"|"rotate">("joint");
  const [repeat, setRepeat] = useState<"monthly"|"weekly"|"yearly"|"none">("monthly");
  const payers = [
    { k: "aarav", label: "Aarav", color: "var(--accent)" },
    { k: "meera", label: "Meera", color: "var(--accent-2)" },
    { k: "joint", label: "Joint", color: "linear-gradient(135deg,var(--accent),var(--accent-2))" },
    { k: "rotate", label: "We alternate 🔁", color: "var(--mist)" },
  ] as const;
  return (
    <BottomSheet
      open={open} onClose={onClose} title="Add bill"
      primaryCta={
        <button
          onClick={() => { toast.success("Bill saved 💌"); onClose(); }}
          className="w-full min-h-12 rounded-[14px] py-3 text-[14px] font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          Save bill
        </button>
      }
    >
      <div>
        <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Name</label>
        <input placeholder="e.g. Gas cylinder" className="mt-1 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-[14px] outline-none" />
      </div>
      <div className="mt-3">
        <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Amount</label>
        <input inputMode="numeric" placeholder="₹0" className="mt-1 w-full rounded-[12px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-[14px] outline-none" />
      </div>

      <div className="mt-4">
        <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Repeat</label>
        <div className="mt-2 flex gap-2">
          {(["monthly","weekly","yearly","none"] as const).map((r) => (
            <button key={r} onClick={() => setRepeat(r)}
              className={cn(
                "flex-1 rounded-full py-2 text-[12px] font-semibold capitalize",
                repeat===r ? "bg-[color:var(--ink)] text-white" : "bg-[color:var(--mist)] text-[color:var(--ink-soft)]",
              )}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Payer</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {payers.map((p) => (
            <button key={p.k} onClick={() => setPayer(p.k)}
              className={cn(
                "flex items-center gap-2 rounded-[12px] border p-3 text-left text-[12.5px] font-semibold",
                payer===p.k ? "border-transparent bg-[color:var(--blush)]" : "border-[color:var(--line)] bg-[color:var(--surface)]",
              )}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 flex items-center justify-between rounded-[12px] bg-[color:var(--mist)] px-3 py-3 text-[13px]">
        <span>Autopay</span>
        <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" />
      </label>
    </BottomSheet>
  );
}
