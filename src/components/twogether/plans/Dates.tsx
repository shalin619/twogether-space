import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Dice5, Plus, Sparkles, Link as LinkIcon } from "lucide-react";
import { Card, Chip, AmountText, formatINR, SkeletonCard, EmptyState } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import {
  getDateIdeas, getDateStats, addDateIdea, markIdeaDone, getMemories,
} from "@/data/service";
import { AddEventSheet } from "./AddEventSheet";
import type { DateIdea } from "@/data/types";
import { cn } from "@/lib/utils";

type PriceFilter = "any" | 1 | 2 | 3;
type VibeFilter = "any" | DateIdea["vibe"];

export function Dates() {
  const qc = useQueryClient();
  const ideasQ    = useQuery({ queryKey: ["dateIdeas"], queryFn: getDateIdeas });
  const statsQ    = useQuery({ queryKey: ["dateStats"], queryFn: getDateStats });
  const memoriesQ = useQuery({ queryKey: ["memories"],  queryFn: getMemories });

  const [price, setPrice] = useState<PriceFilter>("any");
  const [vibe, setVibe]   = useState<VibeFilter>("any");
  const [roulette, setRoulette]     = useState(false);
  const [rouletteLanded, setLanded] = useState<DateIdea | null>(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [aiOpen, setAiOpen]         = useState(false);
  const [aiInput, setAiInput]       = useState("");
  const [eventOpen, setEventOpen]   = useState(false);
  const [eventPrefill, setEventPrefill] = useState<{ title?: string; date?: string; owner?: "ours" }>();

  const ideas = ideasQ.data ?? [];
  const filtered = useMemo(() => ideas.filter((i) => {
    if (i.done) return false;
    if (price !== "any" && i.price !== price) return false;
    if (vibe !== "any" && i.vibe !== vibe) return false;
    return true;
  }), [ideas, price, vibe]);
  const pastIdeas = ideas.filter((i) => i.done);

  function spin() {
    setRoulette(true);
    setLanded(null);
    setTimeout(() => {
      const pick = filtered[Math.floor(Math.random() * filtered.length)] ?? ideas[0];
      setLanded(pick);
    }, 900);
  }

  function bookIt(i: DateIdea) {
    setEventPrefill({
      title: i.title,
      date: defaultSatEvening(),
      owner: "ours",
    });
    setEventOpen(true);
    setRoulette(false);
  }

  return (
    <div className="pb-24">
      {/* Header strip */}
      <div className="mx-4 rounded-[20px] card-shadow border border-[color:var(--line)]/60 bg-[color:var(--surface)] p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl">🔥</div>
            <div className="font-display text-[20px] font-bold text-[color:var(--ink)]">{statsQ.data?.streak ?? 0}</div>
            <div className="text-[11px] text-[color:var(--ink-soft)]">month streak</div>
          </div>
          <div>
            <div className="text-2xl">🌙</div>
            <div className="font-display text-[20px] font-bold text-[color:var(--ink)]">1/{statsQ.data?.monthlyGoal ?? 2}</div>
            <div className="text-[11px] text-[color:var(--ink-soft)]">this month</div>
          </div>
          <div>
            <div className="text-2xl">💞</div>
            <AmountText value={1850} size={20} />
            <div className="text-[11px] text-[color:var(--ink-soft)]">date fund left</div>
          </div>
        </div>
      </div>

      {/* AI planner + roulette + add */}
      <div className="mt-3 flex gap-2 px-4">
        <button
          onClick={() => setAiOpen(true)}
          className="flex min-h-[44px] flex-1 items-center gap-2 rounded-full bg-[color:var(--blush)] px-3 text-left text-[12.5px] font-semibold text-[color:var(--accent)]"
        >
          <Sparkles className="h-4 w-4" /> Tell me the vibe…
        </button>
        <button
          onClick={spin}
          className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--gold)] text-white"
          aria-label="Roulette"
        >
          <Dice5 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setAddOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--ink)] text-white"
          aria-label="Save idea"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        <FilterChip label="₹"   active={price === 1} onClick={() => setPrice(price === 1 ? "any" : 1)} />
        <FilterChip label="₹₹"  active={price === 2} onClick={() => setPrice(price === 2 ? "any" : 2)} />
        <FilterChip label="₹₹₹" active={price === 3} onClick={() => setPrice(price === 3 ? "any" : 3)} />
        <span className="w-1 shrink-0" />
        {(["chill", "active", "romantic", "at-home"] as const).map((v) => (
          <FilterChip key={v} label={v} active={vibe === v} onClick={() => setVibe(vibe === v ? "any" : v)} />
        ))}
      </div>

      {/* Masonry-ish grid */}
      <div className="mt-3 grid grid-cols-2 gap-3 px-4">
        {ideasQ.isLoading && (<><SkeletonCard height={200} /><SkeletonCard height={200} /></>)}
        {!ideasQ.isLoading && filtered.length === 0 && (
          <div className="col-span-2"><EmptyState emoji="💞" line="No ideas match. Loosen a filter?" /></div>
        )}
        {filtered.map((i, idx) => (
          <IdeaCard key={i.id} idea={i} tall={idx % 3 === 0} onBook={() => bookIt(i)} onDone={async () => {
            await markIdeaDone(i.id);
            await qc.invalidateQueries({ queryKey: ["dateIdeas"] });
            await qc.invalidateQueries({ queryKey: ["dateStats"] });
            toast("Marked as done 🔥");
          }} />
        ))}
      </div>

      {/* Past dates timeline */}
      {pastIdeas.length > 0 && (
        <>
          <div className="mt-6 px-4 pb-2"><span className="section-header">Past dates</span></div>
          <div className="mx-4 flex flex-col gap-2">
            {pastIdeas.map((p) => {
              const mem = (memoriesQ.data ?? []).find((m) =>
                m.title.toLowerCase().includes(p.title.split(" ")[0].toLowerCase()),
              );
              return (
                <Card key={p.id} className="flex items-center gap-3 p-3">
                  <span className="text-2xl">💞</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold text-[color:var(--ink)]">{p.title}</div>
                    {p.location && <div className="text-[11.5px] text-[color:var(--ink-soft)]">{p.location}</div>}
                  </div>
                  {mem && <Chip tone="gold">📸 Memory</Chip>}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Roulette modal */}
      <BottomSheet open={roulette} onClose={() => setRoulette(false)} title="Date roulette 🎲">
        {!rouletteLanded ? (
          <div className="flex flex-col items-center py-8">
            <div className="animate-spin text-6xl">🎲</div>
            <div className="mt-3 text-[13px] text-[color:var(--ink-soft)]">Shuffling…</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <IdeaCard idea={rouletteLanded} tall={false} standalone />
            <div className="flex gap-2">
              <button
                onClick={() => bookIt(rouletteLanded)}
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white"
              >Book it</button>
              <button
                onClick={spin}
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-[color:var(--line)] text-[14px] font-bold text-[color:var(--ink)]"
              >Spin again</button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Save idea sheet */}
      <SaveIdeaSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={async (payload) => {
          await addDateIdea(payload);
          await qc.invalidateQueries({ queryKey: ["dateIdeas"] });
          toast("Saved 💞");
        }}
      />

      {/* AI planner */}
      <BottomSheet
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="AI date planner ✨"
        primaryCta={
          <button
            onClick={async () => {
              setEventPrefill({
                title: "Home ramen night 🍜",
                date: defaultSatEvening(),
                owner: "ours",
              });
              setAiOpen(false);
              setEventOpen(true);
              toast("Reserved ₹900 from date fund 💞");
            }}
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white"
          >
            Add to Sat 8 PM + reserve ₹900
          </button>
        }
      >
        <input
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="cozy, rainy, don't want to move…"
          className="min-h-[44px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]"
        />
        <Card className="mt-3">
          <div className="text-[14px] font-bold text-[color:var(--ink)]">🍜 Home ramen night</div>
          <div className="mt-0.5 text-[11.5px] text-[color:var(--ink-soft)]">Cozy · At home · ~₹900 · 90 min</div>
          <ol className="mt-2 space-y-1.5 text-[13px] text-[color:var(--ink)]">
            <li>1. Grocery run: miso, ramen noodles, eggs, scallions</li>
            <li>2. Boil eggs (7 min), simmer broth 20 min</li>
            <li>3. Playlist: <i>Late Night Jazz</i>, dim the balcony lights</li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="me">Aarav: broth 🍲</Chip>
            <Chip tone="partner">Meera: playlist 🎧</Chip>
            <Chip tone="ours">Both: eat & rate ⭐</Chip>
          </div>
        </Card>
      </BottomSheet>

      <AddEventSheet
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        prefill={eventPrefill}
      />
    </div>
  );
}

function IdeaCard({
  idea, tall, onBook, onDone, standalone,
}: {
  idea: DateIdea; tall: boolean; onBook?: () => void; onDone?: () => void; standalone?: boolean;
}) {
  return (
    <div className={cn(
      "overflow-hidden rounded-[20px] border border-[color:var(--line)]/60 bg-[color:var(--surface)] card-shadow",
      standalone && "col-span-2",
    )}>
      {idea.image && (
        <div className={cn("overflow-hidden bg-[color:var(--mist)]", tall ? "aspect-square" : "aspect-[4/3]")}>
          <img src={idea.image} alt={idea.title} loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-2.5">
        <div className="line-clamp-1 text-[13.5px] font-bold text-[color:var(--ink)]">{idea.title}</div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-[color:var(--ink-soft)]">
          <span>{"₹".repeat(idea.price)}</span>
          <span>·</span>
          <span>{idea.vibe}</span>
          {idea.location && <><span>·</span><span className="truncate">{idea.location}</span></>}
        </div>
        {(onBook || onDone) && (
          <div className="mt-2 flex gap-1">
            {onBook && <button onClick={onBook} className="flex-1 min-h-[36px] rounded-full bg-[color:var(--ink)] text-[11.5px] font-bold text-white">Book</button>}
            {onDone && <button onClick={onDone} className="flex-1 min-h-[36px] rounded-full border border-[color:var(--line)] text-[11.5px] font-bold text-[color:var(--ink-soft)]">Done</button>}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-[36px] shrink-0 rounded-full border px-3 text-[12px] font-semibold capitalize",
        active
          ? "border-transparent bg-[color:var(--ink)] text-white"
          : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink-soft)]",
      )}
    >
      {label}
    </button>
  );
}

function SaveIdeaSheet({
  open, onClose, onAdd,
}: {
  open: boolean; onClose: () => void;
  onAdd: (p: Omit<DateIdea, "id">) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [vibe, setVibe] = useState<DateIdea["vibe"]>("chill");
  const [price, setPrice] = useState<1 | 2 | 3>(2);
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | undefined>();

  const LOOKUP: Record<string, { title: string; image: string; location: string }> = {
    "prithvi":     { title: "Prithvi Theatre play",   image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&q=60", location: "Juhu" },
    "sassoon":     { title: "Sassoon Dock photowalk", image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=60", location: "Colaba" },
    "cinepolis":   { title: "Cinepolis movie night",  image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=60", location: "Andheri" },
  };

  async function enrich() {
    if (!url) return;
    setEnriching(true);
    await new Promise((r) => setTimeout(r, 800));
    const key = Object.keys(LOOKUP).find((k) => url.toLowerCase().includes(k));
    const hit = key ? LOOKUP[key] : { title: "New date idea", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=60", location: "" };
    setTitle(hit.title); setImage(hit.image); setLocation(hit.location);
    setEnriching(false);
  }

  async function submit() {
    if (!title.trim()) return;
    await onAdd({ title: title.trim(), vibe, price, location: location || undefined, image, tags: [] });
    setUrl(""); setTitle(""); setImage(undefined); setLocation("");
    onClose();
  }

  return (
    <BottomSheet
      open={open} onClose={onClose} title="Save a date idea"
      primaryCta={
        <button onClick={submit} disabled={!title.trim()}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white disabled:opacity-50">
          Save
        </button>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">Paste a link</div>
          <div className="flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="bookmyshow.com/…"
              className="min-h-[44px] flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]" />
            <button onClick={enrich} disabled={!url || enriching}
              className="min-h-[44px] rounded-full bg-[color:var(--ink)] px-4 text-[12px] font-semibold text-white disabled:opacity-50">
              {enriching ? "…" : <><LinkIcon className="inline h-3.5 w-3.5" /> Fetch</>}
            </button>
          </div>
        </div>
        {image && <img src={image} alt="" className="h-32 w-full rounded-2xl object-cover" />}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
          className="min-h-[44px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)"
          className="min-h-[44px] w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[13px]" />
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((p) => (
            <button key={p} onClick={() => setPrice(p)}
              className={cn("min-h-[40px] flex-1 rounded-full border text-[13px] font-semibold",
                price === p ? "border-transparent bg-[color:var(--blush)] text-[color:var(--accent)]" : "border-[color:var(--line)] text-[color:var(--ink-soft)]")}>
              {"₹".repeat(p)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["chill", "active", "romantic", "at-home"] as const).map((v) => (
            <button key={v} onClick={() => setVibe(v)}
              className={cn("min-h-[36px] rounded-full border px-3 text-[12px] font-semibold capitalize",
                vibe === v ? "border-transparent bg-[color:var(--ink)] text-white" : "border-[color:var(--line)] text-[color:var(--ink-soft)]")}>
              {v}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-[color:var(--ink-soft)]">Formatted for date fund tracking · not saved to expense yet.</div>
        {formatINR(0) === "0" && null}
      </div>
    </BottomSheet>
  );
}

function defaultSatEvening() {
  const d = new Date();
  const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(20, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
