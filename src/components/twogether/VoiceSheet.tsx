import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Send, X, Sparkles, Loader2, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "./BottomSheet";
import { AmountText, Chip } from "./primitives";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/currentUser";
import {
  parseIntent, EXAMPLES, type Draft,
} from "@/lib/voiceAgent";
import {
  addTransaction, addWishlistItem, addListItem, addTask, addBill,
  addDateIdea, addEvent, addMemory,
} from "@/data/service";
import type { OwnerId } from "@/data/types";

// Speech Recognition typing (browser API)
type SR = {
  start: () => void; stop: () => void; abort: () => void;
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: unknown) => void) | null;
  onerror:  ((e: unknown) => void) | null;
  onend:    (() => void) | null;
};
type SRCtor = new () => SR;

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUserId } = useCurrentUser();
  const qc = useQueryClient();
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const recRef = useRef<SR | null>(null);

  // Set up recognizer + auto-start on open
  useEffect(() => {
    if (!open) return;
    setTranscript(""); setTyped(""); setDraft(null);
    const Ctor = getSR();
    if (!Ctor) { setSupported(false); return; }
    setSupported(true);
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: unknown) => {
      const evt = e as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      let full = "";
      for (let i = 0; i < evt.results.length; i++) {
        full += evt.results[i][0].transcript;
      }
      setTranscript(full);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
    return () => { try { rec.abort(); } catch { /* noop */ } setListening(false); };
  }, [open]);

  const stopListening = () => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  };
  const startListening = () => {
    if (!recRef.current) return;
    setTranscript("");
    try { recRef.current.start(); setListening(true); } catch { /* noop */ }
  };

  const submit = async (text: string) => {
    stopListening();
    setParsing(true);
    const d = await parseIntent(text, currentUserId);
    setParsing(false);
    setDraft(d);
  };

  const cancelDraft = () => setDraft(null);

  const commit = async () => {
    if (!draft) return;
    setCommitting(true);
    try {
      await executeDraft(draft, currentUserId);
      invalidateFor(draft, qc);
      toast.success(successToast(draft));
      onClose();
      setDraft(null);
      setTranscript(""); setTyped("");
    } catch {
      toast.error("Couldn't save that — try again");
    } finally {
      setCommitting(false);
    }
  };

  const readyToSubmit = useMemo(() => (transcript || typed).trim().length > 0, [transcript, typed]);

  return (
    <BottomSheet open={open} onClose={onClose} title={draft ? "Confirm" : "Listening"}>
      {!draft && (
        <div className="space-y-4">
          {/* Mic visual + live transcript */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              onClick={listening ? stopListening : startListening}
              className={cn(
                "relative grid h-24 w-24 place-items-center rounded-full text-white transition-transform active:scale-95",
                !supported && "opacity-40",
              )}
              style={{ background: "var(--ours)" }}
              disabled={!supported}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening && (
                <>
                  <span
                    className="absolute inset-0 animate-ping rounded-full"
                    style={{ background: "var(--accent)", opacity: 0.25 }}
                  />
                  <span
                    className="absolute -inset-2 rounded-full"
                    style={{ background: "var(--ours)", opacity: 0.15, filter: "blur(8px)" }}
                  />
                </>
              )}
              <Mic className="h-9 w-9" />
            </button>
            <div className="text-[12px] font-semibold text-[color:var(--ink-soft)]">
              {!supported ? "Voice unsupported — type below" :
                listening ? "Listening… tap mic to stop" : "Tap mic to speak"}
            </div>
          </div>

          {/* Transcript */}
          <div className="min-h-[64px] rounded-2xl bg-[color:var(--mist)] px-4 py-3 text-[15px] text-[color:var(--ink)]">
            {transcript || (
              <span className="text-[color:var(--ink-soft)]">
                Say something like &ldquo;Spent 480 on coffee, split it&rdquo;…
              </span>
            )}
          </div>

          {/* Typed fallback */}
          <div className="flex items-center gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && readyToSubmit) submit(transcript || typed); }}
              placeholder="Or type instead…"
              className="flex-1 min-h-11 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
            <button
              onClick={() => submit(transcript || typed)}
              disabled={!readyToSubmit || parsing}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
              style={{ background: "var(--accent)" }}
              aria-label="Send"
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          {/* Example chips */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
              <Sparkles className="h-3 w-3" /> Try
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setTyped(ex); submit(ex); }}
                  className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1.5 text-[12px] text-[color:var(--ink)] transition-colors active:bg-[color:var(--mist)]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {draft && (
        <div className="space-y-4">
          <DraftCard draft={draft} onEdit={cancelDraft} />
          {draft.kind !== "unknown" && draft.kind !== "query" && (
            <div className="flex gap-2">
              <button
                onClick={cancelDraft}
                className="flex-1 min-h-12 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] text-[14px] font-semibold text-[color:var(--ink)]"
              >
                <span className="inline-flex items-center gap-1.5"><X className="h-4 w-4" /> Cancel</span>
              </button>
              <button
                onClick={commit}
                disabled={committing}
                className="flex-[2] min-h-12 rounded-full text-[14px] font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Confirm
                </span>
              </button>
            </div>
          )}
          {(draft.kind === "unknown" || draft.kind === "query") && (
            <button
              onClick={onClose}
              className="w-full min-h-12 rounded-full bg-[color:var(--ink)] text-[14px] font-semibold text-white"
            >
              Done
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

// ---------- Draft rendering ----------
function DraftCard({ draft, onEdit }: { draft: Draft; onEdit: () => void }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-soft)]">
          {labelFor(draft.kind)}
        </span>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--accent)]"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      <DraftBody draft={draft} />
    </div>
  );
}

function labelFor(k: Draft["kind"]): string {
  switch (k) {
    case "expense":  return "New expense";
    case "wishlist": return "Wishlist item";
    case "grocery":  return "Add to groceries";
    case "task":     return "New task";
    case "reminder": return "Reminder";
    case "date":     return "Date idea";
    case "event":    return "Calendar event";
    case "memory":   return "Memory";
    case "query":    return "Answer";
    case "unknown":  return "Not sure what you meant";
  }
}

function DraftBody({ draft }: { draft: Draft }) {
  switch (draft.kind) {
    case "expense":
      return (
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--blush)] text-xl">{draft.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold text-[color:var(--ink)]">{draft.merchant}</div>
              <div className="text-[12.5px] text-[color:var(--ink-soft)]">{draft.categoryName}</div>
            </div>
            <AmountText value={draft.amount} size={22} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tone={draft.owner === "ours" ? "ours" : draft.owner === "me" ? "me" : "partner"}>
              {draft.splitLabel ?? (draft.owner === "ours" ? "Split 50/50" : "You paid")}
            </Chip>
            {draft.hidden && <Chip tone="gold">🔒 Hidden gift</Chip>}
          </div>
          {draft.hidden && draft.hiddenReason && (
            <p className="mt-2 text-[12px] text-[color:var(--ink-soft)]">{draft.hiddenReason}</p>
          )}
        </div>
      );
    case "wishlist":
      return (
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ink)]">{draft.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip tone={draft.ownerId === "ours" ? "ours" : draft.ownerId === "aarav" ? "me" : "partner"}>
              {draft.ownerId === "ours" ? "Ours" : draft.ownerId === "aarav" ? "Aarav" : "Meera"}
            </Chip>
            {draft.price != null && <Chip tone="neutral">₹{draft.price.toLocaleString("en-IN")}</Chip>}
            {draft.note && <Chip tone="neutral">{draft.note}</Chip>}
          </div>
        </div>
      );
    case "grocery":
      return (
        <div>
          <div className="mb-2 text-[13px] text-[color:var(--ink-soft)]">{draft.items.length} items → 🛒 Groceries</div>
          <div className="flex flex-wrap gap-1.5">
            {draft.items.map((i) => <Chip key={i} tone="neutral">{i}</Chip>)}
          </div>
        </div>
      );
    case "task":
      return (
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ink)]">{draft.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip tone={draft.assignee === "ours" ? "ours" : draft.assignee === "aarav" ? "me" : "partner"}>
              {draft.assignee === "ours" ? "Both" : draft.assignee === "aarav" ? "Aarav" : "Meera"}
            </Chip>
            {draft.dueDate && <Chip tone="neutral">Due {new Date(draft.dueDate).toDateString().slice(4, 10)}</Chip>}
          </div>
        </div>
      );
    case "reminder":
      return (
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ink)]">{draft.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip tone="neutral">⏰ {new Date(draft.dueDate).toDateString().slice(4, 10)}</Chip>
            {draft.amount ? <Chip tone="neutral">₹{draft.amount.toLocaleString("en-IN")}</Chip> : null}
          </div>
        </div>
      );
    case "date":
      return (
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ink)]">💞 {draft.title}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip tone="neutral">{draft.vibe}</Chip>
            <Chip tone="neutral">{"₹".repeat(draft.price)}</Chip>
          </div>
        </div>
      );
    case "event":
      return (
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ink)]">{draft.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip tone="neutral">📅 {new Date(draft.date).toDateString().slice(0, 10)}</Chip>
            <Chip tone={draft.owner === "ours" ? "ours" : draft.owner === "me" ? "me" : "partner"}>
              {draft.owner === "ours" ? "Both" : draft.owner === "me" ? "You" : "Partner"}
            </Chip>
          </div>
        </div>
      );
    case "memory":
      return (
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ink)]">📸 {draft.title}</div>
          <div className="mt-1 text-[12.5px] text-[color:var(--ink-soft)]">Today</div>
        </div>
      );
    case "query":
      return (
        <div>
          <div className="text-[12.5px] text-[color:var(--ink-soft)]">{draft.question}</div>
          <div className="mt-1 text-[18px] font-bold text-[color:var(--ink)]">{draft.answer}</div>
          {draft.detail && <div className="mt-1 text-[12.5px] text-[color:var(--ink-soft)]">{draft.detail}</div>}
        </div>
      );
    case "unknown":
      return (
        <div>
          <div className="text-[13px] text-[color:var(--ink-soft)]">You said:</div>
          <div className="mt-1 text-[15px] text-[color:var(--ink)]">&ldquo;{draft.transcript}&rdquo;</div>
          <div className="mt-2 text-[12.5px] text-[color:var(--ink-soft)]">{draft.hint}</div>
        </div>
      );
  }
}

// ---------- Commit executor ----------
async function executeDraft(draft: Draft, viewer: OwnerId): Promise<void> {
  switch (draft.kind) {
    case "expense": {
      const partner: OwnerId = viewer === "aarav" ? "meera" : "aarav";
      const half = Math.round(draft.amount / 2);
      await addTransaction({
        date: new Date().toISOString(),
        merchant: draft.merchant,
        categoryId: draft.categoryId,
        amount: draft.amount,
        accountId: viewer === "aarav" ? "acc_a_hdfc" : "acc_m_icici",
        paidBy: viewer,
        owner: draft.owner,
        ownerId: viewer,
        splits: draft.owner === "ours"
          ? [{ ownerId: viewer, amount: half }, { ownerId: partner, amount: draft.amount - half }]
          : undefined,
        isGiftHidden: draft.hidden || undefined,
        hiddenFrom: draft.hidden ? partner : undefined,
        note: "Added via voice",
      });
      return;
    }
    case "wishlist":
      await addWishlistItem({
        ownerId: draft.ownerId,
        title: draft.title,
        priority: draft.priority,
        price: draft.price,
        note: draft.note,
        privacy: "shared",
      });
      return;
    case "grocery":
      for (const item of draft.items) {
        await addListItem({ listId: "l_groc", title: item, addedBy: viewer });
      }
      return;
    case "task":
      await addTask({ title: draft.title, assignee: draft.assignee, dueDate: draft.dueDate, status: "todo" });
      return;
    case "reminder":
      await addBill({
        name: draft.name, amount: draft.amount ?? 0, dueDate: draft.dueDate,
        payer: "joint", autopay: false, repeat: "none",
      });
      return;
    case "date":
      await addDateIdea({ title: draft.title, vibe: draft.vibe, price: draft.price });
      return;
    case "event":
      await addEvent({
        title: draft.title, date: draft.date, owner: draft.owner, createdBy: viewer,
      });
      return;
    case "memory":
      await addMemory({
        title: draft.title, date: draft.date,
        photo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600",
      });
      return;
    case "query":
    case "unknown":
      return;
  }
}

function invalidateFor(draft: Draft, qc: ReturnType<typeof useQueryClient>) {
  const keys: string[][] = [];
  switch (draft.kind) {
    case "expense":  keys.push(["transactions"], ["runningBalance"], ["monthBudget"], ["insights"]); break;
    case "wishlist": keys.push(["wishlist"]); break;
    case "grocery":  keys.push(["listItems"]); break;
    case "task":     keys.push(["tasks"]); break;
    case "reminder": keys.push(["bills"]); break;
    case "date":     keys.push(["dateIdeas"]); break;
    case "event":    keys.push(["events"]); break;
    case "memory":   keys.push(["memories"]); break;
  }
  keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
}

function successToast(draft: Draft): string {
  switch (draft.kind) {
    case "expense":  return draft.hidden ? "Hidden gift logged 🔒" : "Expense logged 💸";
    case "wishlist": return "Added to wishlist 🎁";
    case "grocery":  return `${draft.items.length} added to groceries 🛒`;
    case "task":     return "Task added ✅";
    case "reminder": return "Reminder set ⏰";
    case "date":     return "Date idea saved 💞";
    case "event":    return "Event added 📅";
    case "memory":   return "Memory saved 📸";
    default:         return "Done";
  }
}
