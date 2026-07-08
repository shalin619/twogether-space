import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Heart, Sparkles, ArrowRight, Mail } from "lucide-react";
import { Card, Chip, SkeletonCard, Avatar } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import {
  getDailyQuestion, getDailyQuestionHistory, answerDailyQuestion,
  getGratitudeNotes, sendGratitude, markGratitudeRead,
  getCheckIns, saveCheckIn,
  getEvents, getBills, getTasks,
} from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";
import type { CheckIn, GratitudeNote } from "@/data/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const LOVE_LANGUAGES: Record<"aarav" | "meera", { primary: string; emoji: string; note: string }> = {
  aarav: { primary: "Words of affirmation", emoji: "💬", note: "Small verbal appreciations land big." },
  meera: { primary: "Acts of service",       emoji: "🤝", note: "A quiet chore taken off her plate = love." },
};

export function Rituals() {
  return (
    <div className="space-y-4 px-4 pb-6 pt-3">
      <DailyQuestionCard />
      <GratitudeCard />
      <WeeklyCheckInCard />
      <LoveLanguagesCard />
    </div>
  );
}

// ============ 1. Daily Question ============
function DailyQuestionCard() {
  const { currentUserId, partner } = useCurrentUser();
  const qc = useQueryClient();
  const qQ = useQuery({ queryKey: ["dailyQuestion"], queryFn: getDailyQuestion });
  const histQ = useQuery({ queryKey: ["dailyQuestionHistory"], queryFn: getDailyQuestionHistory });

  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [showHist, setShowHist] = useState(false);

  const dq = qQ.data;
  const myAnswer      = dq?.answers[currentUserId];
  const partnerAnswer = dq?.answers[partner.id];

  // If viewer already answered, auto-reveal
  useEffect(() => { if (myAnswer) setRevealed(true); }, [myAnswer]);

  if (qQ.isLoading || !dq) return <SkeletonCard height={200} />;

  const submit = async () => {
    if (!draft.trim()) return;
    await answerDailyQuestion(currentUserId, draft.trim());
    setDraft("");
    // 400ms unblur reveal
    setTimeout(() => setRevealed(true), 400);
    qc.invalidateQueries({ queryKey: ["dailyQuestion"] });
    toast.success("Answered ✨");
  };

  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={14} className="text-[color:var(--gold)]" />
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
          Daily question
        </span>
      </div>
      <h3 className="font-display text-[18px] font-semibold leading-snug text-[color:var(--ink)]">
        {dq.question}
      </h3>

      {/* Partner status line */}
      {partnerAnswer && !myAnswer && (
        <div className="mt-2 text-[12.5px] text-[color:var(--ink-soft)]">
          {partner.name} has answered ✨ — answer to unblur.
        </div>
      )}

      {/* Bubbles */}
      {(myAnswer || partnerAnswer) && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {partnerAnswer && (
            <div className="flex items-start gap-2">
              <Avatar owner={partner.id} emoji={partner.avatarEmoji} size={28} />
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-[13.5px] transition-[filter] duration-[400ms]",
                  "flex-1",
                )}
                style={{
                  background: partner.id === "meera" ? "#E4EEE9" : "var(--blush)",
                  color: "var(--ink)",
                  filter: revealed ? "blur(0px)" : "blur(6px)",
                }}
              >
                {partnerAnswer}
              </div>
            </div>
          )}
          {myAnswer && (
            <div className="flex flex-row-reverse items-start gap-2">
              <Avatar owner={currentUserId} emoji="🌞" size={28} />
              <div
                className="flex-1 rounded-2xl px-3 py-2 text-[13.5px]"
                style={{
                  background: currentUserId === "meera" ? "#E4EEE9" : "var(--blush)",
                  color: "var(--ink)",
                }}
              >
                {myAnswer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      {!myAnswer && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Your answer…"
            className="min-h-11 flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-[14px] outline-none focus:border-[color:var(--accent)]"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="min-h-11 min-w-11 rounded-full bg-[color:var(--accent)] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}

      {/* Past accordion */}
      {(histQ.data?.length ?? 0) > 0 && (
        <div className="mt-3 border-t border-[color:var(--line)] pt-3">
          <button
            onClick={() => setShowHist((s) => !s)}
            className="flex w-full items-center justify-between text-[12.5px] font-semibold text-[color:var(--ink-soft)]"
          >
            Past questions
            {showHist ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showHist && (
            <div className="mt-2 space-y-2">
              {histQ.data!.map((h) => (
                <div key={h.id} className="rounded-xl bg-[color:var(--mist)] p-2.5 text-[12.5px]">
                  <div className="font-semibold text-[color:var(--ink)]">{h.question}</div>
                  <div className="mt-1 space-y-0.5 text-[color:var(--ink-soft)]">
                    {h.answers.aarav && <div>🧡 {h.answers.aarav}</div>}
                    {h.answers.meera && <div>🌿 {h.answers.meera}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============ 2. Gratitude ============
function GratitudeCard() {
  const { currentUserId, partner } = useCurrentUser();
  const qc = useQueryClient();
  const gQ = useQuery({ queryKey: ["gratitude"], queryFn: getGratitudeNotes });

  const [text, setText] = useState("");
  const [opened, setOpened] = useState<GratitudeNote | null>(null);

  const notes = gQ.data ?? [];
  const inbox = notes.filter((n) => n.to === currentUserId);
  const sent  = notes.filter((n) => n.from === currentUserId);

  const openNote = async (n: GratitudeNote) => {
    setOpened(n);
    if (!n.read) {
      await markGratitudeRead(n.id);
      qc.invalidateQueries({ queryKey: ["gratitude"] });
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    await sendGratitude(currentUserId, text.trim());
    setText("");
    qc.invalidateQueries({ queryKey: ["gratitude"] });
    toast.success("delivers tomorrow 8 AM 🤍");
  };

  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Heart size={14} className="text-[color:var(--accent)]" />
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
          Gratitude
        </span>
      </div>
      <div className="mt-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`A tiny thanks for ${partner.name}…`}
          className="w-full min-h-[72px] resize-none rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">delivers tomorrow 8 AM 🤍</span>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="min-h-10 rounded-full bg-[color:var(--accent)] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>

      {/* Inbox envelopes */}
      {inbox.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
            For you
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {inbox.map((n) => (
              <button
                key={n.id}
                onClick={() => openNote(n)}
                className={cn(
                  "relative shrink-0 rounded-2xl px-3 py-2.5 text-left min-w-[160px]",
                  n.read ? "bg-[color:var(--mist)]" : "bg-[color:var(--blush)]",
                )}
              >
                <Mail size={14} className="text-[color:var(--accent)]" />
                <div className="mt-1 text-[11px] text-[color:var(--ink-soft)]">
                  from {n.from === "aarav" ? "Aarav" : "Meera"} · {format(parseISO(n.date), "d MMM")}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[13px] font-medium text-[color:var(--ink)]">
                  {n.read ? n.text : "Tap to open 💌"}
                </div>
                {!n.read && (
                  <span
                    className="absolute right-2 top-2 h-2 w-2 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
            You sent
          </div>
          <div className="space-y-1.5">
            {sent.slice(0, 3).map((n) => (
              <div key={n.id} className="rounded-xl bg-[color:var(--mist)] px-3 py-2 text-[12.5px] text-[color:var(--ink)]">
                <span className="text-[color:var(--ink-soft)]">{format(parseISO(n.date), "d MMM")} · </span>
                {n.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomSheet open={!!opened} onClose={() => setOpened(null)} title="A note for you">
        {opened && (
          <div className="space-y-3">
            <div className="text-[11.5px] uppercase tracking-wide text-[color:var(--ink-soft)]">
              from {opened.from === "aarav" ? "Aarav" : "Meera"} · {format(parseISO(opened.date), "EEEE d MMM")}
            </div>
            <p
              className="rounded-2xl p-4 font-display text-[17px] leading-snug text-[color:var(--ink)]"
              style={{ background: "linear-gradient(135deg, var(--blush) 0%, #F7E6DE 100%)" }}
            >
              {opened.text}
            </p>
          </div>
        )}
      </BottomSheet>
    </Card>
  );
}

// ============ 3. Weekly check-in ============
function WeeklyCheckInCard() {
  const { currentUserId, partner } = useCurrentUser();
  const qc = useQueryClient();
  const cQ = useQuery({ queryKey: ["checkIns"], queryFn: getCheckIns });
  const evQ = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const bQ  = useQuery({ queryKey: ["bills"], queryFn: getBills });
  const tQ  = useQuery({ queryKey: ["tasks"], queryFn: getTasks });

  const [open, setOpen] = useState(false);

  const checkIns = cQ.data ?? [];
  // Group by week (use ISO week start = date)
  const weekly = useMemo(() => {
    const map = new Map<string, { aarav?: CheckIn; meera?: CheckIn }>();
    for (const c of checkIns) {
      const key = c.date.slice(0, 10);
      const cur = map.get(key) ?? {};
      cur[c.ownerId] = c;
      map.set(key, cur);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [checkIns]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
            Sunday ritual · 10 min
          </div>
          <h3 className="mt-0.5 font-display text-[17px] font-semibold text-[color:var(--ink)]">
            Weekly check-in
          </h3>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="min-h-10 rounded-full bg-[color:var(--accent)] px-4 text-[13px] font-semibold text-white"
        >
          Start
        </button>
      </div>

      {weekly.length > 0 && (
        <div className="mt-3 space-y-2">
          {weekly.slice(0, 2).map(([date, pair]) => (
            <div key={date} className="rounded-2xl bg-[color:var(--mist)] p-3">
              <div className="text-[11.5px] font-semibold text-[color:var(--ink-soft)]">
                Week of {format(parseISO(date), "d MMM")}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <CheckInSide who="aarav" c={pair.aarav} />
                <CheckInSide who="meera" c={pair.meera} />
              </div>
            </div>
          ))}
        </div>
      )}

      <WeeklyCheckInSheet
        open={open}
        onClose={() => setOpen(false)}
        events={evQ.data ?? []}
        bills={bQ.data ?? []}
        tasks={tQ.data ?? []}
        viewer={currentUserId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["checkIns"] });
          setOpen(false);
          toast.success("Check-in saved 🌿");
        }}
      />
    </Card>
  );
}

function CheckInSide({ who, c }: { who: "aarav" | "meera"; c?: CheckIn }) {
  const name = who === "aarav" ? "Aarav" : "Meera";
  const color = who === "aarav" ? "var(--accent)" : "var(--accent-2)";
  if (!c) {
    return (
      <div className="rounded-xl bg-[color:var(--surface)] p-2.5 text-[12px] text-[color:var(--ink-soft)]">
        {name} hasn't checked in
      </div>
    );
  }
  const emojis = ["😔", "😐", "🙂", "😊", "🥹"];
  return (
    <div className="rounded-xl bg-[color:var(--surface)] p-2.5">
      <div className="flex items-center gap-1 text-[11.5px] font-semibold" style={{ color }}>
        {name}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[13px]">
        <span>{emojis[c.mood - 1]}</span>
        <span className="text-[color:var(--ink-soft)]">us {c.usScore ?? "—"}/5</span>
      </div>
      {c.highlight && (
        <div className="mt-1 line-clamp-2 text-[11.5px] text-[color:var(--ink)]">
          ✨ {c.highlight}
        </div>
      )}
      {c.need && (
        <div className="mt-0.5 line-clamp-2 text-[11.5px] text-[color:var(--ink-soft)]">
          🙏 {c.need}
        </div>
      )}
    </div>
  );
}

function WeeklyCheckInSheet({
  open, onClose, events, bills, tasks, viewer, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  events: any[]; bills: any[]; tasks: any[];
  viewer: "aarav" | "meera";
  onSaved: () => void;
}) {
  const [step, setStep] = useState(0);
  const [myWeek, setMyWeek] = useState(4);
  const [us,     setUs]     = useState(4);
  const [energy, setEnergy] = useState(3);
  const [highlight, setHighlight] = useState("");
  const [need, setNeed] = useState("");

  useEffect(() => { if (!open) setStep(0); }, [open]);

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400e3);
  const upcomingEvents = events.filter((e) => {
    const d = parseISO(e.date);
    return d >= now && d <= in7;
  });
  const upcomingBills = bills.filter((b) => {
    const d = parseISO(b.dueDate);
    return d >= now && d <= in7 && !b.paid;
  });
  const openTasks = tasks.filter((t) => !t.done && t.status !== "done").slice(0, 3);

  const submit = async () => {
    await saveCheckIn({
      date: new Date().toISOString(),
      ownerId: viewer,
      mood: myWeek as 1 | 2 | 3 | 4 | 5,
      usScore: us as 1 | 2 | 3 | 4 | 5,
      energy: energy as 1 | 2 | 3 | 4 | 5,
      highlight: highlight.trim() || undefined,
      need: need.trim() || undefined,
    });
    onSaved();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Weekly check-in">
      {step === 0 && (
        <div className="space-y-5">
          <Slider label="My week" emoji="🌤️" value={myWeek} onChange={setMyWeek} />
          <Slider label="Us"      emoji="💛" value={us}     onChange={setUs} />
          <Slider label="Energy"  emoji="⚡" value={energy} onChange={setEnergy} />
          <button
            onClick={() => setStep(1)}
            className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white"
          >
            Next
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[color:var(--ink)]">
              A highlight from this week
            </label>
            <input
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              placeholder="A moment that made you smile…"
              className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white"
          >
            Next
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[color:var(--ink)]">
              One thing I need
            </label>
            <input
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              placeholder="A quiet evening, help with laundry, a hug…"
              className="w-full min-h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <button
            onClick={() => setStep(3)}
            className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white"
          >
            See your week ahead
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, var(--blush) 0%, #E4EEE9 100%)" }}
          >
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
              Your week ahead
            </div>
            <div className="mt-2 space-y-1.5 text-[13px] text-[color:var(--ink)]">
              <div>🗓️ {upcomingEvents.length} events — {upcomingEvents.slice(0, 2).map((e) => e.title).join(" · ") || "quiet week"}</div>
              <div>💸 {upcomingBills.length} bills due{upcomingBills.length ? ` — ₹${upcomingBills.reduce((s, b) => s + b.amount, 0)}` : ""}</div>
              <div>✅ {openTasks.length} open tasks — {openTasks.map((t) => t.title).join(", ") || "clear"}</div>
            </div>
          </div>
          <button
            onClick={submit}
            className="w-full min-h-12 rounded-full bg-[color:var(--accent)] text-[15px] font-semibold text-white"
          >
            Finish check-in
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function Slider({
  label, emoji, value, onChange,
}: { label: string; emoji: string; value: number; onChange: (v: number) => void }) {
  const emojis = ["😔", "😐", "🙂", "😊", "🥹"];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[color:var(--ink)]">{emoji} {label}</span>
        <span className="text-[20px]">{emojis[value - 1]}</span>
      </div>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 min-h-11 rounded-2xl text-[16px] transition-colors",
              value === n
                ? "bg-[color:var(--accent)] text-white"
                : "bg-[color:var(--mist)] text-[color:var(--ink-soft)]",
            )}
          >
            {emojis[n - 1]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ 4. Love languages ============
function LoveLanguagesCard() {
  const { currentUserId, partner } = useCurrentUser();
  const me = LOVE_LANGUAGES[currentUserId];
  const them = LOVE_LANGUAGES[partner.id];

  const suggestionFor = partner.id === "meera" ? them : me; // suggest for whoever the "other" is
  return (
    <Card>
      <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
        Love languages
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip tone="me">🌞 You · {me.emoji} {me.primary}</Chip>
        <Chip tone="partner">{partner.avatarEmoji} {partner.name} · {them.emoji} {them.primary}</Chip>
      </div>

      <div
        className="mt-3 rounded-2xl p-3"
        style={{ background: "linear-gradient(135deg, #F7E6DE 0%, #E4EEE9 100%)" }}
      >
        <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[color:var(--gold)]">
          This month for {partner.name}
        </div>
        <div className="mt-1 font-display text-[15px] text-[color:var(--ink)]">
          {them.emoji} {them.primary}: 3 things on her task list you could quietly take over
        </div>
        <Link
          to="/plans"
          className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--accent)]"
        >
          Open tasks <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
}
