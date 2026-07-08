import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Gift, MessageCircle } from "lucide-react";
import { Chip, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getCategories, getTransactions } from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/data/types";

type FilterKey = "all" | "mine" | "partner" | "ours" | "hidden";

export function Activity() {
  const { currentUser, partner, currentUserId } = useCurrentUser();
  const txQ  = useQuery({ queryKey: ["transactions"], queryFn: getTransactions });
  const catQ = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openTx, setOpenTx] = useState<Transaction | null>(null);

  const catMap = useMemo(
    () => Object.fromEntries((catQ.data ?? []).map((c) => [c.id, c])),
    [catQ.data],
  );

  const visible = useMemo(() => {
    const all = txQ.data ?? [];
    return all
      // Privacy: hidden gift only visible to owner
      .filter((t) => !(t.isGiftHidden && t.hiddenFrom === currentUserId))
      .filter((t) => {
        if (filter === "mine")    return t.paidBy === currentUserId && t.owner !== "ours";
        if (filter === "partner") return t.paidBy !== currentUserId && t.owner !== "ours";
        if (filter === "ours")    return t.owner === "ours";
        if (filter === "hidden")  return t.isGiftHidden && t.paidBy === currentUserId;
        return true;
      })
      .filter((t) => !q || t.merchant.toLowerCase().includes(q.toLowerCase()));
  }, [txQ.data, filter, q, currentUserId]);

  // Group by day (YYYY-MM-DD)
  const groups = useMemo(() => {
    const g = new Map<string, Transaction[]>();
    for (const t of visible) {
      const k = t.date.slice(0, 10);
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(t);
    }
    return [...g.entries()];
  }, [visible]);

  const chips: { k: FilterKey; label: string }[] = [
    { k: "all",     label: "All" },
    { k: "mine",    label: "Mine" },
    { k: "partner", label: partner.name },
    { k: "ours",    label: "Ours" },
    { k: "hidden",  label: "🎁 Hidden" },
  ];

  return (
    <div className="pb-6">
      {/* Search + chips */}
      <div className="px-4">
        <label className="flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2">
          <Search className="h-4 w-4 text-[color:var(--ink-soft)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[color:var(--ink-soft)]"
          />
        </label>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {chips.map((c) => (
            <button
              key={c.k}
              onClick={() => setFilter(c.k)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                filter === c.k
                  ? "border-transparent bg-[color:var(--ink)] text-white"
                  : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-soft)]",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 px-4">
        {txQ.isLoading && (
          <div className="flex flex-col gap-2">
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
            <SkeletonCard height={72} />
          </div>
        )}
        {!txQ.isLoading && groups.length === 0 && (
          <EmptyState emoji="☕" line="Your money story starts with one expense ☕" />
        )}
        {groups.map(([day, items]) => (
          <div key={day} className="mb-4">
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
              {format(new Date(day), "EEE, d MMM")}
            </div>
            <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface)] card-shadow">
              {items.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setOpenTx(t)}
                  className={cn(
                    "flex w-full items-center gap-3 p-3 text-left",
                    i > 0 && "border-t border-[color:var(--line)]/70",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--mist)] text-[17px]">
                    {catMap[t.categoryId]?.emoji ?? "💳"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-[color:var(--ink)]">{t.merchant}</span>
                      {t.isGiftHidden && t.paidBy === currentUserId && (
                        <Gift className="h-3.5 w-3.5 text-[color:var(--gold)]" />
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[color:var(--ink-soft)]">
                      <OwnerDot t={t} />
                      <span>{catMap[t.categoryId]?.name}</span>
                      {t.note && <span className="truncate">· {t.note}</span>}
                      {t.id === "tx1" && <span className="inline-flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />2</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-[15px] font-semibold tabular-nums text-[color:var(--ink)]">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <TxDetailSheet
        tx={openTx}
        onClose={() => setOpenTx(null)}
        catEmoji={openTx ? catMap[openTx.categoryId]?.emoji ?? "💳" : ""}
        catName={openTx ? catMap[openTx.categoryId]?.name ?? "" : ""}
        currentUserId={currentUserId}
        currentUserName={currentUser.name}
        partnerName={partner.name}
      />
    </div>
  );
}

function OwnerDot({ t }: { t: Transaction }) {
  if (t.owner === "ours") return <span className="h-1.5 w-6 rounded-full bg-ours" />;
  const color = t.paidBy === "aarav" ? "var(--accent)" : "var(--accent-2)";
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />;
}

function TxDetailSheet({
  tx, onClose, catEmoji, catName, currentUserId, currentUserName, partnerName,
}: {
  tx: Transaction | null; onClose: () => void; catEmoji: string; catName: string;
  currentUserId: "aarav" | "meera"; currentUserName: string; partnerName: string;
}) {
  if (!tx) return null;
  const meShare      = tx.splits?.find((s) => s.ownerId === currentUserId)?.amount;
  const partnerShare = tx.splits?.find((s) => s.ownerId !== currentUserId)?.amount;

  const comments = tx.id === "tx1" ? [
    { who: partnerName, color: "var(--accent-2)", text: "Got extra paneer, batch cooking tomorrow 🧑‍🍳" },
    { who: currentUserName, color: "var(--accent)", text: "You're the best 🤍" },
  ] : [];

  return (
    <BottomSheet open={!!tx} onClose={onClose} title={tx.merchant}>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--blush)] text-2xl">{catEmoji}</span>
        <div>
          <div className="font-display text-[26px] font-semibold text-[color:var(--ink)]">
            ₹{tx.amount.toLocaleString("en-IN")}
          </div>
          <div className="text-[12px] text-[color:var(--ink-soft)]">
            {catName} · {format(new Date(tx.date), "d MMM, h:mm a")}
          </div>
        </div>
      </div>

      {tx.isGiftHidden && tx.paidBy === currentUserId && (
        <div className="mt-3 rounded-[12px] border border-[color:var(--gold)]/40 bg-[#FDF6E7] p-3 text-[12.5px] text-[color:var(--ink)]">
          🎁 Hidden from {partnerName} until 9 Dec
        </div>
      )}

      {tx.splits && (
        <div className="mt-4 rounded-[16px] bg-[color:var(--mist)] p-3">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
            Split · 55/45
          </div>
          <div className="mt-2 flex justify-between text-[13.5px]">
            <span>You</span><span className="font-semibold">₹{(meShare ?? 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-1 flex justify-between text-[13.5px]">
            <span>{partnerName}</span><span className="font-semibold">₹{(partnerShare ?? 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Receipt</div>
        <div className="mt-2 grid h-24 place-items-center rounded-[12px] border border-dashed border-[color:var(--line)] text-[12px] text-[color:var(--ink-soft)]">
          Tap to add
        </div>
      </div>

      {comments.length > 0 && (
        <div className="mt-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Comments</div>
          <div className="mt-2 flex flex-col gap-2">
            {comments.map((c, i) => {
              const mine = c.who === currentUserName;
              return (
                <div key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className="max-w-[75%] rounded-[16px] px-3 py-2 text-[13px]"
                    style={{
                      background: mine ? "var(--blush)" : "#E4EEE9",
                      color: "var(--ink)",
                    }}
                  >
                    {c.text}
                    <div className="mt-1 text-right text-[10px] font-semibold" style={{ color: c.color }}>
                      {c.who}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-2 flex gap-2 text-[16px]">
              {["🤍", "🙌", "😂", "👀"].map((e) => (
                <button
                  key={e}
                  onClick={() => toast(`${e} noted`, { duration: 1200 })}
                  className="grid h-9 w-9 min-h-11 min-w-11 place-items-center rounded-full bg-[color:var(--mist)]"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
