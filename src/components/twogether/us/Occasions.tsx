import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { Plus, Archive, Star } from "lucide-react";
import { Card, Chip, SkeletonCard, EmptyState, AmountText } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getOccasions, getGifts, addOccasion } from "@/data/service";
import type { Gift, Occasion } from "@/data/types";
import { cn } from "@/lib/utils";

export function Occasions() {
  const qc = useQueryClient();
  const occQ  = useQuery({ queryKey: ["occasions"], queryFn: getOccasions });
  const giftQ = useQuery({ queryKey: ["gifts"],     queryFn: getGifts });

  const [addOpen, setAddOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  const occasions = useMemo(
    () => (occQ.data ?? []).slice().sort((a, b) => (a.date < b.date ? -1 : 1)),
    [occQ.data],
  );

  if (occQ.isLoading) {
    return (
      <div className="space-y-3 px-4 pt-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={110} />)}
      </div>
    );
  }

  if (!occasions.length) {
    return (
      <EmptyState
        emoji="🎂"
        line="No occasions yet. Add birthdays, anniversaries and never miss a hint."
        cta={
          <button
            onClick={() => setAddOpen(true)}
            className="min-h-11 rounded-full bg-[color:var(--accent)] px-5 text-[14px] font-semibold text-white"
          >
            + Add an occasion
          </button>
        }
      />
    );
  }

  return (
    <div className="pb-6 pt-3">
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="section-header">Upcoming</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVaultOpen(true)}
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[color:var(--mist)] px-3 text-[12.5px] font-semibold text-[color:var(--ink)]"
          >
            <Archive size={13} /> Vault
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[color:var(--accent)] px-3 text-[12.5px] font-semibold text-white"
          >
            <Plus size={13} /> Person/occasion
          </button>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative px-4">
        <div
          className="absolute bottom-2 left-[26px] top-2 w-px"
          style={{ background: "var(--line)" }}
        />
        <div className="space-y-3">
          {occasions.map((o) => (
            <OccasionRow key={o.id} o={o} gifts={giftQ.data ?? []} />
          ))}
        </div>
      </div>

      <AddOccasionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["occasions"] });
          setAddOpen(false);
          toast.success("Occasion added 🎉");
        }}
      />

      <GiftVaultSheet
        open={vaultOpen}
        onClose={() => setVaultOpen(false)}
        gifts={giftQ.data ?? []}
      />
    </div>
  );
}

function OccasionRow({ o, gifts }: { o: Occasion; gifts: Gift[] }) {
  const days = differenceInCalendarDays(parseISO(o.date), new Date());
  const past = gifts.filter((g) => g.recipient === o.forWho || (o.lastGift && g.title === o.lastGift.name));

  return (
    <div className="relative pl-10">
      <div
        className="absolute left-3 top-4 grid h-6 w-6 place-items-center rounded-full border-2 border-[color:var(--surface)] text-[13px]"
        style={{ background: "var(--blush)" }}
      >
        {o.emoji ?? "🎁"}
      </div>
      <Card className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-[15.5px] font-semibold text-[color:var(--ink)]">
              {o.name}
            </div>
            <div className="text-[12px] text-[color:var(--ink-soft)]">
              {format(parseISO(o.date), "EEE d MMM")} · {o.forWho}
            </div>
          </div>
          <Chip tone={days <= 7 ? "alert" : days <= 30 ? "gold" : "neutral"}>
            {days <= 0 ? "Today" : `${days}d`}
          </Chip>
        </div>

        {o.budget && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-[color:var(--mist)] px-3 py-2">
            <span className="text-[12px] text-[color:var(--ink-soft)]">Budget</span>
            <AmountText value={o.budget} size={16} />
          </div>
        )}

        {o.lastGift && (
          <div className="mt-2 text-[12px] text-[color:var(--ink-soft)]">
            <span className="font-semibold text-[color:var(--ink)]">Last gift:</span> {o.lastGift.name} · ₹{o.lastGift.price}
            <span className="ml-1 text-[color:var(--gold)]">
              {" · "}🎯 {"★".repeat(o.lastGift.rating)}
            </span>
          </div>
        )}

        {o.giftIdeas && o.giftIdeas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.giftIdeas.map((idea) => (
              <span
                key={idea}
                className="rounded-full bg-[color:var(--blush)] px-2.5 py-1 text-[11.5px] font-medium text-[color:var(--ink)]"
              >
                💡 {idea}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddOccasionSheet({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [forWho, setForWho] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [budget, setBudget] = useState("");
  const [emoji, setEmoji] = useState("🎂");

  const emojiOpts = ["🎂", "💍", "🎁", "🏡", "🌸", "🎓"];

  return (
    <BottomSheet open={open} onClose={onClose} title="Add person or occasion">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Occasion</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meera's mom's birthday"
            className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">For</label>
          <input
            value={forWho}
            onChange={(e) => setForWho(e.target.value)}
            placeholder="Family · Friends · Us"
            className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Budget ₹</label>
            <input
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
              placeholder="2500"
              className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Emoji</label>
          <div className="flex flex-wrap gap-1.5">
            {emojiOpts.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  "min-h-11 min-w-11 rounded-2xl text-[20px]",
                  emoji === e ? "bg-[color:var(--accent)]" : "bg-[color:var(--mist)]",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button
          disabled={!name.trim() || !forWho.trim()}
          onClick={async () => {
            await addOccasion({
              name: name.trim(),
              forWho: forWho.trim(),
              date,
              emoji,
              budget: budget ? parseInt(budget) : undefined,
            });
            setName(""); setForWho(""); setBudget("");
            onSaved();
          }}
          className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Add occasion
        </button>
      </div>
    </BottomSheet>
  );
}

function GiftVaultSheet({
  open, onClose, gifts,
}: { open: boolean; onClose: () => void; gifts: Gift[] }) {
  const [side, setSide] = useState<"given" | "received">("given");

  const filtered = gifts.filter((g) => {
    if (g.status !== "given") return false;
    // "given" = you or partner gave; "received" = to === one of the couple
    if (side === "given") return g.to === "family" || g.to === "friends" || g.to === "aarav" || g.to === "meera";
    return g.to === "aarav" || g.to === "meera";
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Gift[]>();
    for (const g of filtered) {
      const y = g.date ? format(parseISO(g.date), "yyyy") : "—";
      const arr = map.get(y) ?? [];
      arr.push(g);
      map.set(y, arr);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Gift vault">
      <div className="mb-3 inline-flex rounded-full bg-[color:var(--mist)] p-1 text-[13px] font-semibold">
        {(["given", "received"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-full px-4 py-1.5",
              side === s
                ? "bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[0_1px_4px_rgba(43,35,64,0.08)]"
                : "text-[color:var(--ink-soft)]",
            )}
          >
            {s === "given" ? "Given" : "Received"}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState emoji="🎁" line="Nothing here yet." />
      ) : (
        <div className="space-y-4">
          {grouped.map(([year, arr]) => (
            <div key={year}>
              <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
                {year}
              </div>
              <div className="space-y-2">
                {arr.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-2xl bg-[color:var(--mist)] p-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-[14.5px] font-semibold text-[color:var(--ink)]">
                        {g.title}
                      </div>
                      <div className="text-[11.5px] text-[color:var(--ink-soft)]">
                        {g.from === "aarav" ? "Aarav" : "Meera"} → {g.recipient ?? (g.to === "aarav" ? "Aarav" : g.to === "meera" ? "Meera" : g.to)}
                        {g.date && ` · ${format(parseISO(g.date), "d MMM")}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <AmountText value={g.price} size={15} />
                      {g.rating && (
                        <div className="flex items-center justify-end gap-0.5 text-[color:var(--gold)]">
                          <Star size={11} fill="currentColor" />
                          <span className="text-[11px] font-semibold">🎯 {g.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
