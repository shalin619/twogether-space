import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Lock, MoreHorizontal, ExternalLink, Bell, Gift, Plus, Sparkles, X, Link as LinkIcon, Image as ImageIcon, MessageSquare } from "lucide-react";
import {
  Card, Chip, PairedAvatar, PrivacyDial, SkeletonCard, EmptyState, AmountText, formatINR,
} from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import {
  getWishlist, getOccasions, claimWishlistItem, addWishlistItem, markGiftPurchased,
} from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import type { OwnerId, Privacy, WishlistItem, Occasion } from "@/data/types";
import { cn } from "@/lib/utils";

type Tab = "partner" | "me" | "ours";

// Fake enrichment lookup (5 known URLs)
const LINK_DB: Record<string, { title: string; price: number; image: string }> = {
  "amazon.in/keychron": { title: "Keychron K2 (Brown switches)", price: 8500, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=60" },
  "amazon.in/kindle":   { title: "Kindle Paperwhite (11th gen)", price: 13999, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=60" },
  "nykaa.com/dress":    { title: "Linen midi dress — terracotta", price: 2499, image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=60" },
  "amazon.in/airfryer": { title: "Philips air fryer 4.1L", price: 6990, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=60" },
  "bluetokaicoffee":    { title: "Blue Tokai — Attikan Estate 500g", price: 720, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=60" },
};

export function Wishlists() {
  const { currentUserId, currentUser, partner } = useCurrentUser();
  const qc = useQueryClient();
  const wishQ = useQuery({ queryKey: ["wishlist"],  queryFn: getWishlist });
  const occQ  = useQuery({ queryKey: ["occasions"], queryFn: getOccasions });

  const [tab, setTab] = useState<Tab>("partner");
  const [lockerOpen, setLockerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [conciergeFor, setConciergeFor] = useState<Occasion | null>(null);

  const items = wishQ.data ?? [];
  const partnerItems = items.filter((w) => w.ownerId === partner.id);
  const myItems      = items.filter((w) => w.ownerId === currentUserId);
  const oursItems    = items.filter((w) => w.ownerId === "ours");

  const lockerItems = useMemo(
    () => items.filter((w) => w.claimedBy === currentUserId),
    [items, currentUserId],
  );

  const activeItems = tab === "partner" ? partnerItems : tab === "me" ? myItems : oursItems;

  const headers: { key: Tab; label: string; tint: string; sub: string }[] = [
    { key: "partner", label: `${partner.name}'s wishlist`,     tint: "linear-gradient(135deg, #E4EEE9 0%, #D6E7DE 100%)", sub: `${partnerItems.length} things she's dropped` },
    { key: "me",      label: "My wishlist",                    tint: "linear-gradient(135deg, var(--blush) 0%, #F6D8CD 100%)", sub: `${myItems.length} for ${currentUser.name}` },
    { key: "ours",    label: "Ours",                           tint: "linear-gradient(135deg, #F7E6DE 0%, #E4EEE9 100%)", sub: `${oursItems.length} shared dreams` },
  ];

  return (
    <div className="pb-24">
      {/* Occasion radar */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <span className="section-header">Occasion radar</span>
        <button
          onClick={() => setLockerOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-[color:var(--mist)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--ink)]"
        >
          <Lock className="h-3.5 w-3.5" />
          Gift Locker {lockerItems.length > 0 && <span className="ml-0.5 rounded-full bg-[color:var(--gold)]/20 px-1.5 text-[color:var(--gold)]">{lockerItems.length}</span>}
        </button>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3">
        {(occQ.data ?? []).map((o) => {
          const days = Math.max(0, Math.round((parseISO(o.date).getTime() - Date.now()) / 86400000));
          return (
            <div key={o.id} className="min-w-[240px] snap-start rounded-[18px] border border-[color:var(--line)]/60 bg-[color:var(--surface)] p-3 card-shadow">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-bold text-[color:var(--ink)]">{o.emoji} {o.name}</span>
                <Chip tone="gold">{days}d</Chip>
              </div>
              <p className="mt-1 text-[12px] text-[color:var(--ink-soft)]">
                ₹{o.budget ? formatINR(o.budget) : "—"} budget
                {o.lastGift && <> · last: {o.lastGift.name} {"⭐".repeat(o.lastGift.rating)}</>}
              </p>
              <button
                onClick={() => setConciergeFor(o)}
                className="mt-2 flex min-h-[36px] w-full items-center justify-center gap-1 rounded-full bg-[color:var(--blush)] px-3 text-[12.5px] font-semibold text-[color:var(--accent)]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Get ideas
              </button>
            </div>
          );
        })}
      </div>

      {/* Header selectors */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3">
        {headers.map((h) => {
          const active = tab === h.key;
          return (
            <button
              key={h.key}
              onClick={() => setTab(h.key)}
              className={cn(
                "min-w-[220px] snap-start rounded-[22px] border p-3 text-left transition-all duration-200",
                active ? "border-transparent scale-[1.02]" : "border-[color:var(--line)]/70 opacity-80",
              )}
              style={{ background: h.tint }}
            >
              <div className="flex items-center gap-3">
                <PairedAvatar a={partner.avatarEmoji} b={currentUser.avatarEmoji} size={36} />
                <div>
                  <div className="font-display text-[15px] font-bold text-[color:var(--ink)]">{h.label}</div>
                  <div className="text-[11.5px] text-[color:var(--ink-soft)]">{h.sub}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {wishQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          <SkeletonCard height={200} /><SkeletonCard height={200} />
          <SkeletonCard height={200} /><SkeletonCard height={200} />
        </div>
      ) : activeItems.length === 0 ? (
        <EmptyState
          emoji="💭"
          line="Drop a hint. Or twelve."
          cta={tab === "me" ? (
            <button onClick={() => setAddOpen(true)} className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-[13px] font-semibold text-white">
              Add first hint
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {activeItems.map((w) => (
            <WishCard
              key={w.id}
              item={w}
              onClaim={async () => {
                await claimWishlistItem(w.id, currentUserId);
                await qc.invalidateQueries({ queryKey: ["wishlist"] });
                toast("Claimed 🤫", { description: `In your Gift Locker — ${partner.name} can't see this.` });
              }}
            />
          ))}
        </div>
      )}

      {/* My-list add button */}
      {tab === "me" && activeItems.length > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setAddOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-[color:var(--line)] bg-transparent text-[13px] font-semibold text-[color:var(--ink-soft)]"
          >
            <Plus className="h-4 w-4" /> Add to my wishlist
          </button>
        </div>
      )}

      <GiftLockerSheet
        open={lockerOpen}
        onClose={() => setLockerOpen(false)}
        items={lockerItems}
        occasions={occQ.data ?? []}
        onPurchase={async (id) => {
          await markGiftPurchased(id);
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["wishlist"] }),
            qc.invalidateQueries({ queryKey: ["transactions"] }),
            qc.invalidateQueries({ queryKey: ["gifts"] }),
          ]);
          toast("Logged as a hidden expense 🤝");
        }}
      />

      <AddWishlistSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={async (payload) => {
          await addWishlistItem({ ...payload, ownerId: currentUserId });
          await qc.invalidateQueries({ queryKey: ["wishlist"] });
          toast("Saved to your wishlist ✨");
        }}
      />

      <ConciergeSheet
        occasion={conciergeFor}
        onClose={() => setConciergeFor(null)}
        wishlist={items.filter((w) => w.ownerId === partner.id || w.ownerId === "ours")}
      />
    </div>
  );
}

// ------ Card ------
function WishCard({ item, onClaim }: { item: WishlistItem; onClaim: () => void }) {
  const { currentUserId } = useCurrentUser();
  const isPartnerItem = item.ownerId !== currentUserId && item.ownerId !== "ours";
  const claimedByMe = item.claimedBy === currentUserId;
  const [menu, setMenu] = useState(false);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[20px] border bg-[color:var(--surface)] card-shadow",
      claimedByMe ? "border-[color:var(--gold)]/40" : "border-[color:var(--line)]/60",
    )}>
      {claimedByMe && (
        <>
          <div className="absolute right-0 top-0 z-10 rotate-[8deg] translate-x-2 -translate-y-1 rounded-bl-lg bg-[color:var(--gold)] px-2 py-0.5 text-[10px] font-bold text-white shadow">
            🎁 In your Gift Locker
          </div>
        </>
      )}

      {item.generic ? (
        <div className="grid aspect-square place-items-center border-b border-dashed border-[color:var(--line)] bg-[color:var(--mist)]/40 text-5xl">
          {item.title.match(/\p{Emoji}/u)?.[0] ?? "💭"}
        </div>
      ) : item.image ? (
        <div className="aspect-square overflow-hidden bg-[color:var(--mist)]">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="grid aspect-square place-items-center bg-[color:var(--mist)]/60 text-4xl">🎁</div>
      )}

      <div className="p-2.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[color:var(--ink)]">{item.title}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px]">
              {item.price ? <AmountText value={item.price} size={13} /> : <span className="text-[color:var(--ink-soft)]">no price</span>}
              <span className="text-[color:var(--gold)]">{"★".repeat(item.priority)}<span className="text-[color:var(--line)]">{"★".repeat(3 - item.priority)}</span></span>
            </div>
            {item.note && (
              <div className="mt-1 line-clamp-1 rounded-full bg-[color:var(--mist)] px-2 py-0.5 text-[10.5px] text-[color:var(--ink-soft)]">
                {item.note}
              </div>
            )}
          </div>

          {isPartnerItem && (
            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--ink-soft)] hover:bg-[color:var(--mist)]"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menu && (
                <>
                  <button className="fixed inset-0 z-20 cursor-default" onClick={() => setMenu(false)} aria-label="close" />
                  <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface)] card-shadow">
                    {!claimedByMe && (
                      <MenuBtn icon={<Gift className="h-4 w-4" />} label="Claim secretly 🤫" onClick={() => { setMenu(false); onClaim(); }} />
                    )}
                    <MenuBtn
                      icon={<ExternalLink className="h-4 w-4" />}
                      label="Open link"
                      onClick={() => { setMenu(false); toast("Coming soon in your space ✨"); }}
                    />
                    <MenuBtn
                      icon={<Bell className="h-4 w-4" />}
                      label="Hint me later"
                      onClick={() => { setMenu(false); toast("We'll nudge you closer to their occasions ⏰"); }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {claimedByMe && (
          <div className="mt-1.5 text-[10.5px] italic text-[color:var(--ink-soft)]">
            {`They can't see this.`}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-[13px] font-semibold text-[color:var(--ink)] hover:bg-[color:var(--mist)]"
    >
      <span className="text-[color:var(--ink-soft)]">{icon}</span> {label}
    </button>
  );
}

// ------ Gift Locker ------
function GiftLockerSheet({
  open, onClose, items, occasions, onPurchase,
}: {
  open: boolean; onClose: () => void; items: WishlistItem[]; occasions: Occasion[];
  onPurchase: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, WishlistItem[]>();
    items.forEach((i) => {
      const key = i.claimedForOccasionId ?? "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Gift Locker 🔒">
      {items.length === 0 ? (
        <EmptyState emoji="🎁" line="Nothing claimed yet. Peek at their wishlist above." />
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([occId, list]) => {
            const occ = occasions.find((o) => o.id === occId);
            const days = occ ? Math.max(0, Math.round((parseISO(occ.date).getTime() - Date.now()) / 86400000)) : null;
            return (
              <div key={occId}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[color:var(--ink)]">
                    {occ ? `${occ.emoji} ${occ.name}` : "No occasion"}
                  </span>
                  {days != null && <Chip tone="gold">{days} days</Chip>}
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((w) => (
                    <Card key={w.id} className="flex items-center gap-3 p-2.5">
                      {w.image ? (
                        <img src={w.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-[color:var(--mist)] text-xl">🎁</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-[color:var(--ink)]">{w.title}</div>
                        {w.price && <div className="text-[11.5px] text-[color:var(--ink-soft)]">₹{formatINR(w.price)}</div>}
                      </div>
                      <button
                        onClick={() => onPurchase(w.id)}
                        className="min-h-[44px] rounded-full bg-[color:var(--gold)] px-3 text-[12px] font-bold text-white"
                      >
                        Mark purchased{w.price ? ` ₹${formatINR(w.price)}` : ""}
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}

// ------ Add wishlist sheet ------
type AddMode = "link" | "photo" | "vibe";

function AddWishlistSheet({
  open, onClose, onAdd,
}: {
  open: boolean; onClose: () => void;
  onAdd: (p: Omit<WishlistItem, "id" | "ownerId">) => Promise<void>;
}) {
  const [mode, setMode] = useState<AddMode>("link");
  const [url, setUrl]     = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [note, setNote]   = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [privacy, setPrivacy]   = useState<Privacy>("visible");
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState<{ title: string; price: number; image: string } | null>(null);

  function reset() {
    setUrl(""); setTitle(""); setPrice(""); setImage(""); setNote("");
    setPriority(2); setPrivacy("visible"); setEnriched(null); setMode("link");
  }

  async function enrich() {
    if (!url) return;
    setEnriching(true);
    setEnriched(null);
    await new Promise((r) => setTimeout(r, 800));
    const key = Object.keys(LINK_DB).find((k) => url.toLowerCase().includes(k));
    const found = key ? LINK_DB[key] : {
      title: "New wishlist item", price: 999,
      image: "https://images.unsplash.com/photo-1513116476489-7635e79feb27?w=400&q=60",
    };
    setEnriched(found);
    setTitle(found.title); setPrice(String(found.price)); setImage(found.image);
    setEnriching(false);
  }

  async function submit() {
    const base: Omit<WishlistItem, "id" | "ownerId"> = {
      title: title || "Untitled",
      priority,
      privacy,
      price: price ? Number(price) : undefined,
      note: note || undefined,
      image: mode === "vibe" ? undefined : (image || undefined),
      generic: mode === "vibe" || !image,
    };
    await onAdd(base);
    reset();
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Add to my wishlist"
      primaryCta={
        <button
          onClick={submit}
          disabled={!title && !enriched}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[color:var(--ink)] text-[14px] font-bold text-white disabled:opacity-50"
        >
          Save
        </button>
      }
    >
      <div className="mb-3 grid grid-cols-3 gap-2">
        {([
          { k: "link" as AddMode,  icon: <LinkIcon className="h-4 w-4" />,  label: "Paste link" },
          { k: "photo" as AddMode, icon: <ImageIcon className="h-4 w-4" />, label: "Photo URL" },
          { k: "vibe" as AddMode,  icon: <MessageSquare className="h-4 w-4" />, label: "Just a vibe" },
        ]).map((m) => (
          <button
            key={m.k}
            onClick={() => setMode(m.k)}
            className={cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl border text-[11.5px] font-semibold",
              mode === m.k
                ? "border-transparent bg-[color:var(--blush)] text-[color:var(--accent)]"
                : "border-[color:var(--line)] text-[color:var(--ink-soft)]",
            )}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {mode === "link" && (
        <div className="mb-3 space-y-2">
          <label className="text-[12px] font-semibold text-[color:var(--ink-soft)]">Product link</label>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste from Amazon, Nykaa…"
              className="flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]"
            />
            <button
              onClick={enrich}
              disabled={!url || enriching}
              className="min-h-[40px] rounded-full bg-[color:var(--ink)] px-4 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {enriching ? "…" : "Fetch"}
            </button>
          </div>
          {enriching && <div className="flex items-center gap-2 text-[12px] text-[color:var(--ink-soft)]">✨ Fetching product…</div>}
          {enriched && (
            <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] p-2">
              <img src={enriched.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{enriched.title}</div>
                <div className="text-[11.5px] text-[color:var(--ink-soft)]">₹{formatINR(enriched.price)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "photo" && (
        <div className="mb-3 space-y-2">
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Photo URL"
            className="w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]"
          />
          {image && <img src={image} alt="" className="mt-1 h-32 w-full rounded-2xl object-cover" onError={() => setImage("")} />}
        </div>
      )}

      <div className="space-y-2">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "vibe" ? "e.g. a proper massage day" : "Item name"}
            className="w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]" />
        </Field>
        {mode !== "vibe" && (
          <Field label="Price (₹)">
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric"
              className="w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]" />
          </Field>
        )}
        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="size, color, why you love it…"
            className="w-full rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[13px]" />
        </Field>

        <Field label="Priority">
          <div className="flex gap-2">
            {[1, 2, 3].map((p) => (
              <button key={p} onClick={() => setPriority(p as 1 | 2 | 3)}
                className={cn(
                  "min-h-[40px] flex-1 rounded-full border text-[13px] font-semibold",
                  priority === p ? "border-transparent bg-[color:var(--blush)] text-[color:var(--accent)]" : "border-[color:var(--line)] text-[color:var(--ink-soft)]",
                )}>
                {"★".repeat(p)}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Privacy">
          <PrivacyDial value={privacy} onChange={setPrivacy} />
        </Field>
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

// ------ Gift Concierge ------
function ConciergeSheet({
  occasion, onClose, wishlist,
}: {
  occasion: Occasion | null; onClose: () => void; wishlist: WishlistItem[];
}) {
  if (!occasion) return null;
  const budget = occasion.budget ?? 3000;
  const matches = wishlist
    .filter((w) => (w.price ?? 0) <= budget * 1.2)
    .slice(0, 2)
    .map((w) => ({ pinned: true, title: w.title, price: w.price, reason: `From ${w.ownerId === "ours" ? "your shared" : "their"} wishlist — priority ${"★".repeat(w.priority)}`, image: w.image }));

  const suggestions = [
    { title: "Handmade photo album", price: 1800, reason: "Sentimental & under budget — you did well with the silk saree." },
    { title: "Kanjeevaram silk stole", price: 2400, reason: "Matches her taste; last silk gift got 5🎯." },
    { title: "Aromatic candle set (Bath & Body)", price: 1500, reason: "Universal crowd-pleaser, safe hit." },
  ];
  const all = [...matches, ...suggestions].slice(0, 5);

  return (
    <BottomSheet open={!!occasion} onClose={onClose} title={`Gift ideas — ${occasion.name}`}>
      <p className="mb-3 text-[13px] text-[color:var(--ink-soft)]">
        Budget ₹{formatINR(budget)} · ranked by fit
      </p>
      <div className="flex flex-col gap-2">
        {all.map((s, i) => (
          <Card key={i} className="flex items-start gap-3 p-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--blush)] text-lg">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "✨"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-bold text-[color:var(--ink)]">{s.title}</span>
                {"pinned" in s && s.pinned && <Chip tone="gold">Wishlist match</Chip>}
              </div>
              <div className="text-[11.5px] text-[color:var(--ink-soft)]">{s.reason}</div>
              {s.price && <div className="mt-1 text-[12px] font-semibold">₹{formatINR(s.price)}</div>}
            </div>
          </Card>
        ))}
      </div>
    </BottomSheet>
  );
}
