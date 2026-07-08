import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { SegmentedOwner } from "@/components/twogether/primitives";
import { addEvent } from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import type { Ownership } from "@/data/types";
import { cn } from "@/lib/utils";

export function AddEventSheet({
  open, onClose, prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<{ title: string; date: string; owner: Ownership; location: string; emoji: string }>;
}) {
  const { currentUserId, partner } = useCurrentUser();
  const qc = useQueryClient();
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [date, setDate]   = useState(prefill?.date ?? defaultDateTime());
  const [owner, setOwner] = useState<Ownership>(prefill?.owner ?? "ours");
  const [location, setLocation] = useState(prefill?.location ?? "");
  const [surprise, setSurprise] = useState(false);
  const [teaser, setTeaser]     = useState("📦 A little something — details coming");
  const [emoji, setEmoji]       = useState(prefill?.emoji ?? "📅");

  useEffect(() => {
    if (!open) return;
    setTitle(prefill?.title ?? "");
    setDate(prefill?.date ?? defaultDateTime());
    setOwner(prefill?.owner ?? "ours");
    setLocation(prefill?.location ?? "");
    setEmoji(prefill?.emoji ?? "📅");
    setSurprise(false);
    setTeaser("📦 A little something — details coming");
  }, [open, prefill]);

  async function submit() {
    if (!title.trim()) return;
    await addEvent({
      title: title.trim(),
      date: new Date(date).toISOString(),
      owner,
      location: location || undefined,
      emoji,
      createdBy: currentUserId,
      surprise: surprise || undefined,
      teaser: surprise ? teaser : undefined,
    });
    await qc.invalidateQueries({ queryKey: ["events"] });
    toast("Event added 🗓️");
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add event"
      primaryCta={
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white disabled:opacity-50"
        >
          Save event
        </button>
      }
    >
      <div className="space-y-3">
        <Field label="Title">
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2) || "📅")}
              className="w-14 min-h-[44px] rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-2 text-center text-lg"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner with Rohan"
              className="min-h-[44px] flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]"
            />
          </div>
        </Field>
        <Field label="When">
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[44px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]"
          />
        </Field>
        <Field label="Whose">
          <SegmentedOwner value={owner} onChange={setOwner} />
        </Field>
        <Field label="Location">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="optional"
            className="min-h-[44px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]"
          />
        </Field>

        <div className="rounded-2xl border border-[color:var(--line)] p-3">
          <label className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[13.5px] font-bold text-[color:var(--ink)]">Surprise 🎁</div>
              <div className="text-[11.5px] text-[color:var(--ink-soft)]">
                {partner.name} sees only the teaser until it happens.
              </div>
            </div>
            <button
              onClick={() => setSurprise((s) => !s)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                surprise ? "bg-[color:var(--accent)]" : "bg-[color:var(--line)]",
              )}
              aria-pressed={surprise}
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                surprise ? "translate-x-[22px]" : "translate-x-0.5",
              )} />
            </button>
          </label>

          {surprise && (
            <div className="mt-3 space-y-2">
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
                Teaser {partner.name} will see
              </div>
              <input
                value={teaser}
                onChange={(e) => setTeaser(e.target.value)}
                className="min-h-[40px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--blush)]/40 px-3 text-[13px] italic"
              />
              <div className="rounded-xl bg-[color:var(--mist)] px-3 py-2 text-[11.5px] text-[color:var(--ink-soft)]">
                <b>{partner.name}</b> will only see: <span className="italic">"{teaser}"</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">{label}</div>
      {children}
    </div>
  );
}

function defaultDateTime() {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
