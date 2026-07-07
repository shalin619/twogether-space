import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { PrivacyDial } from "@/components/twogether/primitives";
import { getCategories } from "@/data/service";
import { cn } from "@/lib/utils";

export function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const catQ = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<string>("cat_dining");
  const [more, setMore] = useState(false);
  const [split, setSplit] = useState<"none"|"5050"|"5545"|"custom">("none");
  const [customPct, setCustomPct] = useState(55);
  const [privacy, setPrivacy] = useState<"private"|"visible"|"shared">("shared");

  useEffect(() => {
    if (!open) {
      setAmount(""); setCat("cat_dining"); setMore(false);
      setSplit("none"); setCustomPct(55); setPrivacy("shared");
    }
  }, [open]);

  const cats = catQ.data ?? [];
  // Smart suggestions: top 5 most likely
  const suggestions = ["cat_dining", "cat_groc", "cat_food", "cat_dates", "cat_travel"]
    .map((id) => cats.find((c) => c.id === id))
    .filter(Boolean) as typeof cats;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add expense"
      primaryCta={
        <button
          onClick={onClose}
          className="w-full rounded-[14px] py-3.5 text-[14.5px] font-bold text-white transition-transform active:scale-[0.99]"
          style={{ background: "var(--ours)" }}
        >
          Save ₹{amount || "0"}
        </button>
      }
    >
      {/* Huge amount input */}
      <div className="text-center">
        <div className="mt-1 flex items-baseline justify-center">
          <span className="mr-1 font-display text-[28px] text-[color:var(--ink-soft)]">₹</span>
          <input
            autoFocus
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0"
            className="w-full max-w-[220px] bg-transparent text-center font-display text-[54px] font-semibold leading-none tracking-[-0.02em] outline-none placeholder:text-[color:var(--ink-soft)]/40"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-5">
        <div className="mb-2 text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
          Suggested
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {suggestions.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-semibold",
                  active
                    ? "border-transparent bg-[color:var(--blush)] text-[color:var(--accent)]"
                    : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink)]",
                )}
              >
                <span>{c.emoji}</span>{c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* More */}
      <button
        onClick={() => setMore((v) => !v)}
        className="mt-5 flex w-full items-center justify-between rounded-[12px] bg-[color:var(--mist)] px-3 py-2.5 text-[13px] font-bold text-[color:var(--ink)]"
      >
        More
        <ChevronDown className={cn("h-4 w-4 transition-transform", more && "rotate-180")} />
      </button>

      {more && (
        <div className="mt-3 space-y-3 animate-[fade-in_200ms_ease-out]">
          <Row label="Account">
            <select className="w-full rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]">
              <option>HDFC Savings</option>
              <option>Joint (Kotak)</option>
              <option>Credit Card</option>
            </select>
          </Row>
          <Row label="Date">
            <input type="date" defaultValue={new Date().toISOString().slice(0,10)}
              className="w-full rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]" />
          </Row>
          <Row label="Note">
            <input placeholder="Add a note" className="w-full rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px] outline-none" />
          </Row>
          <Row label="Receipt">
            <button className="w-full rounded-[10px] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-[12px] text-[color:var(--ink-soft)]">
              Attach
            </button>
          </Row>

          <div>
            <div className="mb-2 text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Split</div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "none",   label: "No split" },
                { k: "5050",   label: "50 / 50" },
                { k: "5545",   label: "55 / 45" },
                { k: "custom", label: "Custom" },
              ].map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSplit(s.k as typeof split)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                    split === s.k
                      ? "bg-[color:var(--ink)] text-white"
                      : "bg-[color:var(--mist)] text-[color:var(--ink-soft)]",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {split === "custom" && (
              <div className="mt-3 rounded-[12px] bg-[color:var(--mist)] p-3">
                <div className="flex justify-between text-[11.5px] font-semibold text-[color:var(--ink)]">
                  <span style={{ color: "var(--accent)" }}>You {customPct}%</span>
                  <span style={{ color: "var(--accent-2)" }}>Partner {100-customPct}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={customPct}
                  onChange={(e) => setCustomPct(+e.target.value)}
                  className="mt-2 w-full accent-[color:var(--accent)]"
                />
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Privacy</div>
            <PrivacyDial value={privacy} onChange={setPrivacy} />
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
