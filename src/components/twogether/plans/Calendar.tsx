import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfDay, addDays, differenceInCalendarDays } from "date-fns";
import { Plus, Sparkles, MapPin } from "lucide-react";
import { Card, Chip, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getEvents } from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import { AddEventSheet } from "./AddEventSheet";
import type { CalendarEvent } from "@/data/types";
import { cn } from "@/lib/utils";

export function Calendar() {
  const { currentUserId, partner } = useCurrentUser();
  const eventsQ = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const [openTx, setOpenTx] = useState<CalendarEvent | null>(null);
  const [freeOpen, setFreeOpen] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [prefill, setPrefill]   = useState<{ date?: string; title?: string } | undefined>();

  const events = eventsQ.data ?? [];
  const now = new Date();
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(now), i));
  const countdowns = events
    .filter((e) => e.countdown)
    .map((e) => ({ ...e, days: differenceInCalendarDays(parseISO(e.date), now) }))
    .filter((e) => e.days > 0)
    .sort((a, b) => a.days - b.days);

  const agenda = useMemo(() => {
    const upcoming = events
      .filter((e) => parseISO(e.date).getTime() >= startOfDay(now).getTime())
      .sort((a, b) => a.date.localeCompare(b.date));
    const groups = new Map<string, CalendarEvent[]>();
    upcoming.forEach((e) => {
      const key = format(parseISO(e.date), "yyyy-MM-dd");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return Array.from(groups.entries()).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const freeSlots = [
    { label: "Thu evening", date: nextDow(now, 4, 19) },
    { label: "Sat all day", date: nextDow(now, 6, 11) },
    { label: "Sat evening", date: nextDow(now, 6, 20) },
  ];

  function openFor(date: string, title = "") {
    setPrefill({ date, title });
    setAddOpen(true);
  }

  return (
    <div className="pb-24">
      {/* Add button */}
      <div className="flex items-center justify-end px-4">
        <button
          onClick={() => { setPrefill(undefined); setAddOpen(true); }}
          className="flex min-h-[40px] items-center gap-1 rounded-full bg-[color:var(--ink)] px-3 text-[12.5px] font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Event
        </button>
      </div>

      {/* Countdowns */}
      {countdowns.length > 0 && (
        <div className="no-scrollbar mt-2 flex gap-3 overflow-x-auto px-4 pb-1">
          {countdowns.map((c) => (
            <div
              key={c.id}
              className="min-w-[160px] snap-start rounded-[20px] p-3 text-white card-shadow"
              style={{ background: "var(--ours)" }}
            >
              <div className="text-[13px] font-semibold opacity-90">{c.emoji} {c.title}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-[34px] font-bold leading-none">{c.days}</span>
                <span className="text-[12px] opacity-80">days</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free-time ribbon */}
      <button
        onClick={() => setFreeOpen(true)}
        className="mx-4 mt-3 flex min-h-[48px] w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-[color:var(--blush)] px-4 text-left text-[13px] font-semibold text-[color:var(--accent)]"
      >
        <Sparkles className="h-4 w-4" />
        <span className="flex-1">You're both free Thu eve & Sat</span>
        <span className="text-[12px] opacity-70">Plan a date →</span>
      </button>

      {/* Week strip */}
      <div className="mt-4 px-4">
        <div className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), d));
            const isToday = isSameDay(d, now);
            return (
              <div key={d.toISOString()} className="flex flex-col items-center gap-1">
                <span className="text-[10.5px] font-semibold text-[color:var(--ink-soft)]">
                  {format(d, "EEE")}
                </span>
                <div className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-[13.5px] font-bold",
                  isToday ? "bg-[color:var(--ink)] text-white" : "text-[color:var(--ink)]",
                )}>
                  {format(d, "d")}
                </div>
                <div className="flex h-2 gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: ownerColor(e.owner) }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda */}
      <div className="mt-4 flex flex-col gap-4 px-4">
        {eventsQ.isLoading && (<><SkeletonCard height={80} /><SkeletonCard height={80} /></>)}
        {!eventsQ.isLoading && agenda.length === 0 && (
          <EmptyState emoji="🗓️" line="Your week is wide open. Plan something?" />
        )}
        {agenda.map(([day, list]) => (
          <div key={day}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-wide text-[color:var(--ink-soft)]">
                {format(parseISO(day), "EEE, MMM d")}
              </span>
              <div className="h-px flex-1 bg-[color:var(--line)]" />
            </div>
            <div className="flex flex-col gap-2">
              {list.map((e) => (
                <button key={e.id} onClick={() => setOpenTx(e)} className="text-left">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-[18px] border border-[color:var(--line)]/60 bg-[color:var(--surface)] p-3 card-shadow",
                    )}
                    style={
                      e.owner === "ours"
                        ? { borderLeft: "4px solid transparent", backgroundImage: "linear-gradient(var(--surface), var(--surface)), var(--ours)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }
                        : { borderLeft: `4px solid ${ownerColor(e.owner)}` }
                    }
                  >
                    <span className="text-2xl">{e.emoji ?? "📅"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold text-[color:var(--ink)]">{e.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[color:var(--ink-soft)]">
                        <span>{format(parseISO(e.date), "h:mm a")}</span>
                        {e.location && (<><span>·</span><MapPin className="h-3 w-3" />{e.location}</>)}
                      </div>
                    </div>
                    {e.surprise && e.createdBy === currentUserId && <Chip tone="gold">Surprise</Chip>}
                    {e.owner === "ours" && !e.surprise && <Chip tone="ours">Us</Chip>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Free slots sheet */}
      <BottomSheet open={freeOpen} onClose={() => setFreeOpen(false)} title="You're both free">
        <div className="flex flex-col gap-2">
          {freeSlots.map((s) => (
            <Card key={s.label} className="flex items-center gap-3 p-3">
              <span className="text-2xl">✨</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-[color:var(--ink)]">{s.label}</div>
                <div className="text-[11.5px] text-[color:var(--ink-soft)]">{format(parseISO(s.date), "EEE, MMM d · h:mm a")}</div>
              </div>
              <button
                onClick={() => { setFreeOpen(false); openFor(s.date.slice(0, 16), "Date night"); }}
                className="min-h-[40px] rounded-full bg-[color:var(--ink)] px-3 text-[12px] font-bold text-white"
              >
                Plan
              </button>
            </Card>
          ))}
        </div>
      </BottomSheet>

      {/* Event detail */}
      <BottomSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.title}>
        {openTx && (
          <div className="space-y-3">
            <div className="text-[13px] text-[color:var(--ink-soft)]">
              {format(parseISO(openTx.date), "EEEE, MMM d · h:mm a")}
            </div>
            {openTx.location && (
              <div className="flex items-center gap-1 text-[13px]">
                <MapPin className="h-3.5 w-3.5" /> {openTx.location}
              </div>
            )}
            {openTx.surprise && openTx.createdBy === currentUserId && (
              <Card className="bg-[color:var(--blush)]/60">
                <div className="text-[12.5px] font-semibold text-[color:var(--accent)]">Surprise 🎁 — {partner.name} sees:</div>
                <div className="mt-1 text-[13px] italic text-[color:var(--ink)]">"{openTx.teaser}"</div>
              </Card>
            )}
            {openTx.note && <div className="text-[13px]">{openTx.note}</div>}
          </div>
        )}
      </BottomSheet>

      <AddEventSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        prefill={prefill}
      />
    </div>
  );
}

function ownerColor(owner: string) {
  return owner === "me" ? "var(--accent)"
    : owner === "partner" ? "var(--accent-2)"
    : "var(--gold)";
}

function nextDow(from: Date, targetDow: number, hour: number) {
  const d = new Date(from);
  d.setHours(hour, 0, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString();
}
