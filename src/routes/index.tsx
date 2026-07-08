import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow, isToday } from "date-fns";

import {
  AmountText, Card, Chip, PairedAvatar, ProgressBar, SkeletonCard,
} from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import { Confetti } from "@/components/twogether/Confetti";
import { useCurrentUser } from "@/lib/currentUser";
import { cn } from "@/lib/utils";
import {
  getBills, getBrief, getDateIdeas, getEvents, getGoals, getGratitudeNotes,
  getInsights, getMemories, getTasks, getTransactions,
} from "@/data/service";
import { profiles } from "@/data/mockData";

export const Route = createFileRoute("/")({
  component: HomeFeed,
});

function HomeFeed() {
  const { currentUser, partner, currentUserId } = useCurrentUser();
  const now = new Date();

  const gratitudeQ = useQuery({ queryKey: ["gratitude"],    queryFn: getGratitudeNotes });
  const billsQ     = useQuery({ queryKey: ["bills"],        queryFn: getBills });
  const eventsQ    = useQuery({ queryKey: ["events"],       queryFn: getEvents });
  const tasksQ     = useQuery({ queryKey: ["tasks"],        queryFn: getTasks });
  const briefQ     = useQuery({ queryKey: ["brief"],        queryFn: getBrief });
  const ideasQ     = useQuery({ queryKey: ["dateIdeas"],    queryFn: getDateIdeas });
  const goalsQ     = useQuery({ queryKey: ["goals"],        queryFn: getGoals });
  const memsQ      = useQuery({ queryKey: ["memories"],     queryFn: getMemories });
  const insightsQ  = useQuery({ queryKey: ["insights"],     queryFn: getInsights });
  const txQ        = useQuery({ queryKey: ["transactions"], queryFn: getTransactions });

  const loading =
    gratitudeQ.isLoading || briefQ.isLoading || goalsQ.isLoading;

  // Gratitude waiting for the CURRENT user (from partner)
  const gratitudeForMe = (gratitudeQ.data ?? []).find(
    (g) => g.to === currentUserId && !g.read,
  );

  // Today strip items: upcoming bill soon, overdue task, partner's event today/next
  const partnerObj = profiles.find((p) => p.id !== currentUserId)!;
  const partnerEventToday = (eventsQ.data ?? []).find((e) => {
    if (e.owner !== "partner" && e.owner !== "ours") {
      // owner labels are relative to Aarav in seed; check via emoji + text isn't reliable
    }
    // For demo, pick Meera's client presentation regardless
    return e.title === "Client presentation";
  });
  const nextBill = (billsQ.data ?? [])[0];
  const overdueTask = (tasksQ.data ?? []).find(
    (t) => t.dueDate && new Date(t.dueDate) < now && !t.done,
  );

  // Date envelope: last date days-ago from transactions category cat_dates
  const lastDateTx = (txQ.data ?? []).find((t) => t.categoryId === "cat_dates");
  const daysSinceDate = lastDateTx
    ? Math.max(0, Math.floor((now.getTime() - new Date(lastDateTx.date).getTime()) / 86400000))
    : 19;
  const dateBudget = 4000;
  const dateSpent = (txQ.data ?? [])
    .filter((t) => t.categoryId === "cat_dates")
    .slice(0, 6) // this month-ish
    .reduce((s, t) => s + t.amount, 0);
  const dateLeft = Math.max(0, dateBudget - dateSpent);

  // Goal moment: Home fund
  const homeGoal = (goalsQ.data ?? []).find((g) => g.id === "g_home");

  // On this day / recent memory
  const featuredMemory = (memsQ.data ?? []).find((m) => m.title.includes("Lonavala"))
    ?? (memsQ.data ?? [])[1];

  // Insight: dining
  const diningInsight = (insightsQ.data ?? []).find((i) => i.kind === "spend");

  const [gratOpen, setGratOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [memOpen, setMemOpen]   = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);


  const notifications = useMemo(
    () => [
      { id: "n1", who: partner.name, text: "added 2 wishlist items", when: "2h" },
      { id: "n2", who: partner.name, text: "logged ₹1,840 to Groceries",            when: "5h" },
      { id: "n3", who: partner.name, text: `sent you a gratitude note 💌`,          when: "6h" },
      { id: "n4", who: "Twogether",  text: "Weekly Brief is ready",                 when: "1d" },
    ],
    [partner.name],
  );

  return (
    <div className="pb-6">
      {/* ---- Header moment ---- */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-full transition-transform active:scale-[0.96]"
            aria-label="Settings"
          >
            <PairedAvatar a={currentUser.avatarEmoji} b={partner.avatarEmoji} size={44} />
          </button>
          <button
            onClick={() => setBellOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-[color:var(--surface)] card-shadow"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px] text-[color:var(--ink)]" />
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
          </button>
        </div>

        <h1 className="mt-5 font-display text-[28px] font-bold leading-[1.15] tracking-[-0.01em] text-[color:var(--ink)]">
          Good {greeting(now)}, {currentUser.name} <span className="text-[color:var(--gold)]">☀️</span>
        </h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
          {format(now, "EEEE, d MMMM")} · You &amp; {partner.name}
        </p>
      </div>

      {/* ---- Gratitude waiting ---- */}
      {gratitudeForMe && (
        <div className="mt-5 px-4">
          <button
            onClick={() => setGratOpen(true)}
            className="flex w-full items-center gap-4 rounded-[20px] border border-[color:var(--accent)]/15 bg-[color:var(--blush)] p-4 text-left transition-transform duration-[180ms] active:scale-[0.99]"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl text-white"
              style={{ background: "var(--ours)" }}
            >
              💌
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display text-[16px] font-bold text-[color:var(--ink)]">
                A note from {partner.name} is waiting
              </span>
              <span className="mt-0.5 block text-[12.5px] text-[color:var(--ink-soft)]">
                Tap to open · sealed for your eyes
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--ink-soft)]" />
          </button>
        </div>
      )}

      {/* ---- Today strip ---- */}
      <SoftSectionHeader>Today</SoftSectionHeader>
      {loading ? (
        <div className="px-4">
          <SkeletonCard height={72} />
        </div>
      ) : (
        <div
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
          style={{ scrollPadding: "0 16px" }}
        >
          {nextBill && (
            <TodayCard
              tone="neutral"
              icon="⚡"
              title={`${nextBill.name} ${inrShort(nextBill.amount)}`}
              meta={`${format(new Date(nextBill.dueDate), "EEE")} · ${nextBill.autopay ? "autopay ✓" : "manual"}`}
            />
          )}
          {overdueTask && (
            <TodayCard
              tone="alert"
              icon="📋"
              title={overdueTask.title}
              meta="overdue"
            />
          )}
          {partnerEventToday && (
            <TodayCard
              tone="partner"
              icon="🧘"
              title={`${partnerObj.name}: ${partnerEventToday.title.toLowerCase()}`}
              meta={format(new Date(partnerEventToday.date), "h:mm a")}
            />
          )}
          <div className="w-4 shrink-0" />
        </div>
      )}

      {/* ---- Weekly Brief (signature) ---- */}
      <SoftSectionHeader>Weekly Brief</SoftSectionHeader>
      <div className="px-4">
        <div className="relative rounded-[22px] p-[1.5px] bg-ours">
          <div className="rounded-[20px] bg-[color:var(--surface)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-[20px] font-bold leading-tight text-[color:var(--ink)]">
                  Your Week Together
                </div>
                <div className="mt-0.5 text-[12px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
                  {format(now, "d MMM")} — {format(addDays(now, 6), "d MMM")}
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
            </div>

            <ul className="flex flex-col divide-y divide-[color:var(--line)]/70">
              <BriefRow icon="🗓" text={<><b>2 free evenings</b> this week — Thu &amp; Sat</>} />
              <BriefRow icon="💸" text={<>{`₹4,188 in bills due`}</>} />
              <BriefRow icon="🎁" text={<><b>Meera's mom's birthday</b> in 12 days</>} />
              <BriefRow icon="🌴" text={<><b>Bali fund</b> +₹8,000 → 43%</>} />
            </ul>

            <button className="mt-3 flex w-full items-center justify-between rounded-[14px] bg-[color:var(--blush)] px-4 py-3 text-[13.5px] font-bold text-[color:var(--ink)]">
              Plan something for Saturday
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---- Date nudge ---- */}
      <SoftSectionHeader>Us time</SoftSectionHeader>
      <div className="px-4">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-[17px] font-bold leading-snug text-[color:var(--ink)]">
                It's been {daysSinceDate} days since your last date <span>🌙</span>
              </div>
              <div className="mt-1 text-[12.5px] text-[color:var(--ink-soft)]">
                ₹{formatShort(dateLeft)} left in the date fund this month
              </div>
            </div>
            <span className="text-2xl">🌙</span>
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {(ideasQ.data ?? []).slice(0, 3).map((idea) => (
              <button
                key={idea.id}
                className="shrink-0 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-[12.5px] font-semibold text-[color:var(--ink)]"
              >
                {vibeEmoji(idea.vibe)} {idea.title}
              </button>
            ))}
          </div>

          <button
            className="mt-4 w-full rounded-[14px] py-3 text-[14px] font-bold text-white transition-transform duration-[180ms] active:scale-[0.99]"
            style={{ background: "var(--accent)" }}
          >
            Find us a time
          </button>
        </Card>
      </div>

      {/* ---- Goal moment ---- */}
      {homeGoal && (
        <>
          <SoftSectionHeader>Goal moment</SoftSectionHeader>
          <div className="px-4">
            <Card className="relative overflow-hidden">
              <Confetti fireKey={`goal_${homeGoal.id}_40`} />
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--blush)] text-xl">
                  {homeGoal.emoji}
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-[color:var(--ink)]">{homeGoal.name}</div>
                  <div className="text-[12px] text-[color:var(--ink-soft)]">Crossed 40% this week 🎉</div>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <AmountText value={homeGoal.saved} size={26} />
                <span className="text-[12.5px] text-[color:var(--ink-soft)]">
                  of ₹{formatShort(homeGoal.target)}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={homeGoal.saved} max={homeGoal.target} height={10} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-[color:var(--ink-soft)]">
                <span>40% saved</span>
                <span className="font-semibold text-[color:var(--gold)]">🎉 milestone</span>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ---- On this day ---- */}
      {featuredMemory && (
        <>
          <SoftSectionHeader>On this day</SoftSectionHeader>
          <div className="px-4">
            <button
              onClick={() => setMemOpen(true)}
              className="relative block h-[200px] w-full overflow-hidden rounded-[20px] card-shadow text-left"
            >
              <img
                src={featuredMemory.photo}
                alt={featuredMemory.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-2/3"
                style={{
                  background:
                    "linear-gradient(to top, rgba(43,35,64,0.75) 0%, rgba(43,35,64,0) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-[11.5px] uppercase tracking-[0.08em] opacity-80">
                  {relativeYears(featuredMemory.date)}
                </div>
                <div className="font-display text-[20px] font-bold leading-tight">
                  {featuredMemory.title}
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* ---- Insight ---- */}
      {diningInsight && (
        <>
          <SoftSectionHeader>A gentle pattern</SoftSectionHeader>
          <div className="px-4">
            <button
              onClick={() => setInsightOpen(true)}
              className="flex w-full items-start gap-3 rounded-[20px] bg-[color:var(--mist)] p-4 text-left"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--surface)] text-lg">
                👀
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] leading-snug text-[color:var(--ink)]">
                  Dining out is <b>38% above your usual</b> — mostly weekday lunches.
                  No judgment, just a pattern.
                </div>
                <div className="mt-2 flex items-center gap-1 text-[12.5px] font-bold text-[color:var(--accent-2)]">
                  See breakdown <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* ---- All calm (only if literally nothing else) ---- */}
      {!gratitudeForMe && !loading && (briefQ.data?.length ?? 0) === 0 && (
        <div className="mt-6 px-4">
          <Card className="text-center">
            <div className="text-3xl">🤍</div>
            <div className="mt-2 font-display text-[17px] font-bold text-[color:var(--ink)]">
              All calm today
            </div>
            <div className="mt-1 text-[13px] text-[color:var(--ink-soft)]">
              Nothing pressing. Go be together.
            </div>
          </Card>
        </div>
      )}

      {/* ================= Sheets ================= */}
      <BottomSheet
        open={gratOpen}
        onClose={() => setGratOpen(false)}
        title={`From ${partner.name}`}
        primaryCta={
          <div className="flex items-center gap-2">
            <input
              placeholder={`Send one back to ${partner.name}…`}
              className="flex-1 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
            />
            <button
              className="rounded-full px-4 py-3 text-[13px] font-bold text-white"
              style={{ background: "var(--ours)" }}
            >
              Send 💌
            </button>
          </div>
        }
      >
        <div className="rounded-[20px] bg-[color:var(--blush)] p-5 animate-[fade-in_400ms_ease-out]">
          <div className="mb-3 text-2xl">💌</div>
          <p className="font-display text-[19px] leading-snug text-[color:var(--ink)]">
            {gratitudeForMe?.text ?? "—"}
          </p>
          <div className="mt-4 text-[12px] text-[color:var(--ink-soft)]">
            — {partner.name}, {gratitudeForMe ? relativeShort(gratitudeForMe.date) : ""}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={bellOpen} onClose={() => setBellOpen(false)} title="This week's digest">
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface)] p-3"
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: n.who === partner.name ? "var(--accent-2)" : "var(--gold)" }}
              />
              <div className="flex-1">
                <div className="text-[13.5px] text-[color:var(--ink)]">
                  <b>{n.who}</b> {n.text}
                </div>
                <div className="mt-0.5 text-[11.5px] text-[color:var(--ink-soft)]">{n.when} ago</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[11.5px] text-[color:var(--ink-soft)]">
          Private items are never shown here.
        </p>
      </BottomSheet>

      <BottomSheet open={memOpen} onClose={() => setMemOpen(false)} title={featuredMemory?.title}>
        {featuredMemory && (
          <>
            <img
              src={featuredMemory.photo}
              alt={featuredMemory.title}
              className="h-56 w-full rounded-[16px] object-cover"
            />
            <div className="mt-3 text-[12.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
              {format(new Date(featuredMemory.date), "d MMMM yyyy")}
            </div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[color:var(--ink)]">
              A weekend that felt like a small vacation from ourselves. Rain, chai, and long
              conversations we forgot we needed.
            </p>
          </>
        )}
      </BottomSheet>

      <BottomSheet
        open={insightOpen}
        onClose={() => setInsightOpen(false)}
        title="Dining, this month"
      >
        <p className="text-[14px] leading-relaxed text-[color:var(--ink)]">
          You've spent <b>₹5,420</b> on dining so far. Your 3-month average is <b>₹3,930</b>.
          Most of the spike is weekday lunches near Aarav's office.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {["Bombay Canteen · ₹3,240","Bastian · ₹2,680","Soam · ₹1,420","Indigo Deli · ₹1,980"].map((r) => (
            <li key={r} className="flex items-center justify-between rounded-[12px] bg-[color:var(--mist)] px-3 py-2 text-[13px]">
              <span>{r.split(" · ")[0]}</span>
              <span className="font-semibold">{r.split(" · ")[1]}</span>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}

// ---------- Little building blocks ----------

function SoftSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-2 px-4">
      <span className="section-header">{children}</span>
    </div>
  );
}

function BriefRow({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="w-6 text-center text-[15px]">{icon}</span>
      <span className="flex-1 text-[13.5px] leading-snug text-[color:var(--ink)]">{text}</span>
    </li>
  );
}

function TodayCard({
  icon, title, meta, tone,
}: {
  icon: string; title: string; meta: string;
  tone: "neutral" | "partner" | "me" | "alert";
}) {
  const dot =
    tone === "partner" ? "var(--accent-2)" :
    tone === "me"      ? "var(--accent)" :
    tone === "alert"   ? "var(--alert)" :
    "var(--ink-soft)";
  return (
    <div className="w-[240px] shrink-0 snap-start rounded-[16px] bg-[color:var(--surface)] card-shadow border border-[color:var(--line)]/60 p-3 first:ml-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
        <span
          className={cn(
            "ml-auto text-[10.5px] font-bold uppercase tracking-[0.06em]",
            tone === "alert" ? "text-[color:var(--alert)]" : "text-[color:var(--ink-soft)]",
          )}
        >
          {tone === "alert" ? "overdue" : meta}
        </span>
      </div>
      <div className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-snug text-[color:var(--ink)]">
        {title}
      </div>
      {tone !== "alert" && (
        <div className="mt-1 text-[11.5px] text-[color:var(--ink-soft)]">{meta}</div>
      )}
    </div>
  );
}

// ---------- helpers ----------

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 5)  return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function addDays(d: Date, n: number) {
  const c = new Date(d); c.setDate(c.getDate() + n); return c;
}

function formatShort(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

function inrShort(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function vibeEmoji(v: string) {
  return v === "chill" ? "☕" : v === "active" ? "🚴" : v === "at-home" ? "🏠" : "🎭";
}

function relativeYears(iso: string) {
  const then = new Date(iso);
  const now = new Date();
  const years = now.getFullYear() - then.getFullYear();
  if (years >= 1) return `${years} year${years > 1 ? "s" : ""} ago`;
  return formatDistanceToNow(then, { addSuffix: true });
}

function relativeShort(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "this morning";
  return formatDistanceToNow(d, { addSuffix: true });
}
