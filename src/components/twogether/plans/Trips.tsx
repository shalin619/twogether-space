import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { Paperclip, Plane, Bed, Sparkles, FileText, Download } from "lucide-react";
import {
  Card, Chip, PillTabs, AmountText, formatINR, SkeletonCard, EmptyState, ProgressBar,
} from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getTrips, getTripItems, togglePackingItem, addTripItem } from "@/data/service";
import type { Trip, TripItem, OwnerId } from "@/data/types";
import { cn } from "@/lib/utils";

type TripTab = "itin" | "packing" | "budget" | "docs";

export function Trips() {
  const tripsQ = useQuery({ queryKey: ["trips"],     queryFn: getTrips });
  const itemsQ = useQuery({ queryKey: ["tripItems"], queryFn: getTripItems });
  const [openTrip, setOpenTrip] = useState<string | null>(null);

  const trips = tripsQ.data ?? [];
  const planning = trips.filter((t) => t.status === "planning" || t.status === "booked");
  const dreams   = trips.filter((t) => t.status === "dream");

  const active = trips.find((t) => t.id === openTrip);

  return (
    <div className="pb-24">
      {tripsQ.isLoading && (
        <div className="px-4"><SkeletonCard height={200} /></div>
      )}

      {planning.map((t) => {
        const items = (itemsQ.data ?? []).filter((i) => i.tripId === t.id);
        const spent = items
          .filter((i) => i.status === "booked" || i.status === "paid")
          .reduce((s, i) => s + (i.price ?? 0), 0);
        const total = t.spent ?? spent;
        return (
          <button key={t.id} onClick={() => setOpenTrip(t.id)}
            className="mx-4 mb-3 block w-[calc(100%-2rem)] overflow-hidden rounded-[24px] border border-[color:var(--line)]/60 bg-[color:var(--surface)] card-shadow text-left">
            {t.image && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={t.image} alt={t.destination} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <div>
                    <div className="font-display text-[26px] font-bold leading-none">{t.emoji} {t.destination}</div>
                    {t.startDate && (
                      <div className="mt-1 text-[12px] opacity-90">
                        {format(parseISO(t.startDate), "MMM d")} — {format(parseISO(t.endDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold uppercase backdrop-blur">{t.status}</span>
                </div>
              </div>
            )}
            <div className="p-3">
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="text-[color:var(--ink-soft)]">
                  ₹{formatINR(total)} of ₹{formatINR(t.budget)}
                </span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {Math.round((total / t.budget) * 100)}%
                </span>
              </div>
              <ProgressBar value={total} max={t.budget} tone="ours" />
            </div>
          </button>
        );
      })}

      {planning.length === 0 && !tripsQ.isLoading && (
        <EmptyState emoji="✈️" line="No trips yet. Where should we go?" />
      )}

      {/* Dream list */}
      {dreams.length > 0 && (
        <>
          <div className="px-4 pb-2 pt-2"><span className="section-header">Dream list</span></div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
            {dreams.map((t) => (
              <div key={t.id} className="min-w-[160px] snap-start overflow-hidden rounded-[20px] card-shadow border border-[color:var(--line)]/60 bg-[color:var(--surface)]">
                {t.image && <img src={t.image} alt={t.destination} className="aspect-[4/5] w-full object-cover" />}
                <div className="p-2 text-center">
                  <div className="text-[13px] font-bold text-[color:var(--ink)]">{t.emoji} {t.destination}</div>
                  <div className="text-[11px] text-[color:var(--ink-soft)]">someday</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {active && (
        <TripDetail
          trip={active}
          items={(itemsQ.data ?? []).filter((i) => i.tripId === active.id)}
          onClose={() => setOpenTrip(null)}
        />
      )}
    </div>
  );
}

function TripDetail({
  trip, items, onClose,
}: { trip: Trip; items: TripItem[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TripTab>("itin");

  return (
    <BottomSheet open onClose={onClose} title={`${trip.emoji} ${trip.destination}`}>
      <div className="mb-3">
        <PillTabs<TripTab>
          value={tab} onChange={setTab}
          options={[
            { value: "itin",    label: "Itinerary" },
            { value: "packing", label: "Packing" },
            { value: "budget",  label: "Budget" },
            { value: "docs",    label: "Docs" },
          ]}
        />
      </div>

      {tab === "itin" && <Itinerary trip={trip} items={items} onDraft={async () => {
        const draft: Omit<TripItem, "id">[] = [
          { tripId: trip.id, kind: "activity", title: "Tegallalang rice terraces at sunrise", price: 1800, status: "idea" },
          { tripId: trip.id, kind: "activity", title: "Tirta Empul water blessing",            price: 800,  status: "idea" },
          { tripId: trip.id, kind: "stay",     title: "Seminyak beach-front night (add-on)",   price: 12000, status: "idea" },
        ];
        for (const d of draft) await addTripItem(d);
        await qc.invalidateQueries({ queryKey: ["tripItems"] });
        toast("Added 3 draft ideas ✈️");
      }} />}

      {tab === "packing" && <Packing items={items} onToggle={async (id) => {
        await togglePackingItem(id);
        await qc.invalidateQueries({ queryKey: ["tripItems"] });
      }} />}

      {tab === "budget" && <Budget trip={trip} items={items} />}

      {tab === "docs" && <Docs />}
    </BottomSheet>
  );
}

// ---------- Itinerary ----------
function Itinerary({ trip, items, onDraft }: { trip: Trip; items: TripItem[]; onDraft: () => void }) {
  const list = items.filter((i) => i.kind !== "packing" && i.kind !== "doc");

  const kindIcon = (k: TripItem["kind"]) =>
    k === "flight" ? <Plane className="h-3.5 w-3.5" /> :
    k === "stay"   ? <Bed className="h-3.5 w-3.5" /> :
    <Sparkles className="h-3.5 w-3.5" />;

  return (
    <div className="space-y-3">
      <button onClick={onDraft}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--blush)] text-[13px] font-semibold text-[color:var(--accent)]">
        <Sparkles className="h-4 w-4" /> AI trip draft
      </button>
      {list.length === 0 && <EmptyState emoji="🗺️" line="Nothing planned yet." />}
      {list.map((i) => (
        <Card key={i.id} className="flex items-center gap-3 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--mist)] text-[color:var(--ink-soft)]">
            {kindIcon(i.kind)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-[color:var(--ink)]">{i.title}</div>
            <div className="text-[11.5px] text-[color:var(--ink-soft)]">
              {i.kind}{i.price ? ` · ₹${formatINR(i.price)}` : ""}
            </div>
          </div>
          {i.status === "booked" && <Chip tone="success"><Paperclip className="h-3 w-3" /> booked</Chip>}
          {i.status === "idea"   && <Chip tone="neutral">idea</Chip>}
          {i.status === "paid"   && <Chip tone="gold">paid</Chip>}
        </Card>
      ))}
    </div>
  );
}

// ---------- Packing ----------
function Packing({ items, onToggle }: { items: TripItem[]; onToggle: (id: string) => void }) {
  const pack = items.filter((i) => i.kind === "packing");
  const done = pack.filter((i) => i.done).length;
  const grouped = useMemo(() => {
    const map = new Map<OwnerId, TripItem[]>();
    pack.forEach((i) => {
      const a = (i.assignee ?? "aarav") as OwnerId;
      if (!map.has(a)) map.set(a, []);
      map.get(a)!.push(i);
    });
    return Array.from(map.entries());
  }, [pack]);

  return (
    <div className="space-y-3">
      <Card className="bg-[color:var(--mist)]/60">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-[color:var(--ink)]">
            {done}/{pack.length} — {done === pack.length ? "packed! 🎉" : "let's go 😅"}
          </span>
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">{Math.round((done / Math.max(1, pack.length)) * 100)}%</span>
        </div>
        <div className="mt-2"><ProgressBar value={done} max={pack.length} tone="ours" /></div>
      </Card>
      {grouped.map(([owner, list]) => (
        <div key={owner}>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white"
              style={{ background: owner === "aarav" ? "var(--accent)" : "var(--accent-2)" }}
            >
              {owner === "aarav" ? "A" : "M"}
            </span>
            <span className="text-[12px] font-bold uppercase tracking-wide text-[color:var(--ink-soft)]">
              {list.filter((i) => i.done).length}/{list.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {list.map((i) => (
              <li key={i.id}>
                <button onClick={() => onToggle(i.id)}
                  className={cn(
                    "flex min-h-[40px] w-full items-center gap-3 rounded-lg px-2 text-left",
                    i.done && "opacity-60",
                  )}>
                  <span className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                    i.done ? "border-[color:var(--accent-2)] bg-[color:var(--accent-2)] text-white" : "border-[color:var(--line)]",
                  )}>
                    {i.done ? "✓" : ""}
                  </span>
                  <span className={cn("text-[13.5px]", i.done && "line-through text-[color:var(--ink-soft)]")}>{i.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---------- Budget ----------
function Budget({ trip, items }: { trip: Trip; items: TripItem[] }) {
  const cats: { key: TripItem["kind"]; label: string; plan: number }[] = [
    { key: "stay",     label: "Stay",       plan: Math.round(trip.budget * 0.3) },
    { key: "flight",   label: "Transport",  plan: Math.round(trip.budget * 0.4) },
    { key: "activity", label: "Activities", plan: Math.round(trip.budget * 0.2) },
    { key: "packing",  label: "Food & misc",plan: Math.round(trip.budget * 0.1) },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="section-header">Total</span>
        <div className="flex items-baseline gap-1">
          <AmountText value={trip.spent ?? 0} size={20} />
          <span className="text-[12px] text-[color:var(--ink-soft)]">/ ₹{formatINR(trip.budget)}</span>
        </div>
      </div>
      {cats.map((c) => {
        const actual = items.filter((i) => i.kind === c.key && (i.status === "booked" || i.status === "paid"))
          .reduce((s, i) => s + (i.price ?? 0), 0);
        return (
          <div key={c.key}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[color:var(--ink)]">{c.label}</span>
              <span className="text-[color:var(--ink-soft)]">₹{formatINR(actual)} / ₹{formatINR(c.plan)}</span>
            </div>
            <ProgressBar value={actual} max={c.plan} tone={actual > c.plan ? "gold" : "ours"} />
          </div>
        );
      })}
    </div>
  );
}

// ---------- Docs ----------
function Docs() {
  const docs = [
    { name: "Passport scans.pdf",   size: "2.4 MB", added: "3 weeks ago" },
    { name: "Bali visa on arrival.png", size: "820 KB", added: "1 week ago" },
  ];
  return (
    <div className="space-y-2">
      {docs.map((d) => (
        <Card key={d.name} className="flex items-center gap-3 p-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--mist)] text-[color:var(--ink-soft)]">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold text-[color:var(--ink)]">{d.name}</div>
            <div className="text-[11.5px] text-[color:var(--ink-soft)]">{d.size} · {d.added}</div>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full text-[color:var(--ink-soft)]" aria-label="Download">
            <Download className="h-4 w-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}

// dead export guard – ensures date-fns imports used
export const _guard = differenceInCalendarDays;
