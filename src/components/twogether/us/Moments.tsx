import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { Plus, X, Lock, Flag } from "lucide-react";
import { Card, Chip, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { getMemories, addMemory, updateMemoryNote } from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import type { Memory } from "@/data/types";
import { cn } from "@/lib/utils";

export function Moments() {
  const { currentUserId } = useCurrentUser();
  const qc = useQueryClient();
  const memQ = useQuery({ queryKey: ["memories"], queryFn: getMemories });

  const [selected, setSelected] = useState<Memory | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const memories = memQ.data ?? [];

  const onThisDay = useMemo(() => {
    const today = new Date();
    return memories.find((m) => {
      const d = parseISO(m.date);
      const diff = Math.abs(
        differenceInCalendarDays(
          new Date(today.getFullYear(), d.getMonth(), d.getDate()),
          today,
        ),
      );
      return diff <= 1 && differenceInCalendarDays(today, d) >= 300;
    });
  }, [memories]);

  // Masonry: split into two columns, alternating
  const cols: Memory[][] = [[], []];
  memories.forEach((m, i) => cols[i % 2].push(m));

  if (memQ.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height={140 + (i % 3) * 40} />
        ))}
      </div>
    );
  }

  if (!memories.length) {
    return (
      <EmptyState
        emoji="📸"
        line="No memories yet. Save your first one — even a blurry one counts."
        cta={
          <button
            onClick={() => setAddOpen(true)}
            className="min-h-11 rounded-full bg-[color:var(--accent)] px-5 text-[14px] font-semibold text-white"
          >
            + Add a memory
          </button>
        }
      />
    );
  }

  return (
    <div className="pb-6">
      {/* On this day */}
      {onThisDay && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setSelected(onThisDay)}
            className="flex w-full items-center gap-3 rounded-[20px] border border-[color:var(--gold)]/40 p-3 text-left"
            style={{ background: "linear-gradient(90deg, #FBF3E1 0%, #F7EAD1 100%)" }}
          >
            <div
              className="h-14 w-14 shrink-0 rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(${onThisDay.photo})` }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--gold)]">
                On this day
              </div>
              <div className="mt-0.5 truncate font-display text-[16px] font-semibold text-[color:var(--ink)]">
                {onThisDay.title}
              </div>
              <div className="text-[12px] text-[color:var(--ink-soft)]">
                {format(parseISO(onThisDay.date), "d MMM yyyy")}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="section-header">Memories</span>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[color:var(--mist)] px-3 text-[12.5px] font-semibold text-[color:var(--ink)]"
        >
          <Plus size={14} /> Memory
        </button>
      </div>

      {/* Masonry */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-3">
            {col.map((m, i) => (
              <MemoryCard key={m.id} m={m} tall={(i + ci) % 3 === 0} onOpen={() => setSelected(m)} />
            ))}
          </div>
        ))}
      </div>

      {/* Detail sheet */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
      >
        {selected && (
          <MemoryDetail
            memory={selected}
            viewer={currentUserId}
            onSave={async (text) => {
              await updateMemoryNote(selected.id, currentUserId, text);
              qc.invalidateQueries({ queryKey: ["memories"] });
              toast.success("Note saved 🔒 only you can see this");
            }}
          />
        )}
      </BottomSheet>

      {/* Add sheet */}
      <AddMemorySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["memories"] });
          setAddOpen(false);
          toast.success("Memory saved 💛");
        }}
      />
    </div>
  );
}

function MemoryCard({
  m, tall, onOpen,
}: { m: Memory; tall?: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-[18px] text-left"
      style={{ aspectRatio: tall ? "3/4" : "1/1" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-active:scale-[1.02]"
        style={{ backgroundImage: `url(${m.photo})` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 p-2.5"
        style={{
          background:
            "linear-gradient(180deg, rgba(43,35,64,0) 0%, rgba(43,35,64,0.6) 100%)",
        }}
      >
        <div className="flex items-center gap-1">
          {m.milestone && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Flag size={9} /> Milestone
            </span>
          )}
        </div>
        <div className="mt-1 truncate font-display text-[13.5px] font-semibold text-white">
          {m.title}
        </div>
        <div className="text-[10.5px] text-white/80">
          {format(parseISO(m.date), "d MMM yyyy")}
        </div>
      </div>
    </button>
  );
}

function MemoryDetail({
  memory, viewer, onSave,
}: {
  memory: Memory;
  viewer: "aarav" | "meera";
  onSave: (text: string) => Promise<void>;
}) {
  const existingKey = viewer === "aarav" ? memory.privateNoteAarav : memory.privateNoteMeera;
  const otherHas = viewer === "aarav" ? !!memory.privateNoteMeera : !!memory.privateNoteAarav;
  const [note, setNote] = useState(existingKey ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div
        className="w-full overflow-hidden rounded-[18px] bg-cover bg-center"
        style={{ aspectRatio: "4/3", backgroundImage: `url(${memory.photo})` }}
      />
      <div>
        <div className="text-[12px] uppercase tracking-wide text-[color:var(--ink-soft)]">
          {format(parseISO(memory.date), "EEEE · d MMM yyyy")}
          {memory.location && ` · ${memory.location}`}
        </div>
        {memory.note && (
          <p className="mt-1 text-[14px] text-[color:var(--ink)]">{memory.note}</p>
        )}
        {memory.milestone && (
          <div className="mt-2"><Chip tone="gold"><Flag size={11} /> Milestone</Chip></div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="mb-1 flex items-center gap-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">
            <Lock size={11} /> Your note — only you can see this
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A tiny detail you want to remember…"
            className="min-h-[80px] w-full resize-none rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <div className="rounded-2xl bg-[color:var(--mist)] p-3 text-[12.5px] text-[color:var(--ink-soft)]">
          <Lock size={11} className="mr-1 inline" />
          {otherHas
            ? "Your partner has left a private note here too — hidden, always."
            : "Your partner can leave their own private note. You'll never see it."}
        </div>
        <button
          disabled={saving || note === (existingKey ?? "")}
          onClick={async () => {
            setSaving(true);
            await onSave(note);
            setSaving(false);
          }}
          className={cn(
            "min-h-11 rounded-full text-[14px] font-semibold text-white",
            "disabled:opacity-40",
          )}
          style={{ background: "var(--accent)" }}
        >
          Save private note
        </button>
      </div>
    </div>
  );
}

function AddMemorySheet({
  open, onClose, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [link, setLink] = useState<string | null>(null);
  const [milestone, setMilestone] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0;

  const linkChips = ["📅 Anniversary", "🌴 Bali trip", "🏡 New home", "🎂 Birthday"];

  return (
    <BottomSheet open={open} onClose={onClose} title="Save a memory">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Juhu beach walk"
            className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Photo URL</label>
          <input
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://…"
            className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>
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
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">Link to</label>
          <div className="flex flex-wrap gap-1.5">
            {linkChips.map((c) => (
              <button
                key={c}
                onClick={() => setLink(link === c ? null : c)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-[12.5px] font-semibold",
                  link === c
                    ? "bg-[color:var(--accent)] text-white"
                    : "bg-[color:var(--mist)] text-[color:var(--ink)]",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between rounded-2xl bg-[color:var(--mist)] p-3">
          <span className="text-[13px] text-[color:var(--ink)]">
            🚩 Mark as milestone
          </span>
          <input
            type="checkbox"
            checked={milestone}
            onChange={(e) => setMilestone(e.target.checked)}
            className="h-5 w-5 accent-[color:var(--accent)]"
          />
        </label>

        <button
          disabled={!canSave || saving}
          onClick={async () => {
            setSaving(true);
            await addMemory({
              title: title.trim(),
              date,
              photo: photo.trim() || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60",
              milestone,
              note: link ?? undefined,
            });
            setSaving(false);
            setTitle(""); setPhoto(""); setLink(null); setMilestone(false);
            onSaved();
          }}
          className="w-full min-h-12 rounded-full text-[15px] font-semibold text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Save memory
        </button>
      </div>
    </BottomSheet>
  );
}
