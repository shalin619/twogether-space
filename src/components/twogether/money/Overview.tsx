import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";
import { AmountText, Card, ProgressBar } from "@/components/twogether/primitives";
import { BottomSheet } from "@/components/twogether/BottomSheet";
import {
  getMonthBudget, getRunningBalance, getTransactions, getInsights,
} from "@/data/service";
import { useCurrentUser } from "@/lib/currentUser";

export function Overview() {
  const { partner, currentUser } = useCurrentUser();
  const budgetQ = useQuery({ queryKey: ["monthBudget"], queryFn: getMonthBudget });
  const balQ    = useQuery({ queryKey: ["runningBalance"], queryFn: getRunningBalance });
  const txQ     = useQuery({ queryKey: ["transactions"], queryFn: getTransactions });
  const insQ    = useQuery({ queryKey: ["insights"], queryFn: getInsights });

  const budget = budgetQ.data?.budget ?? 85000;
  const spent  = budgetQ.data?.spent  ?? 61240;
  const left   = budget - spent;
  const daysLeft = 8;

  const txs = txQ.data ?? [];
  const meSpent      = txs.filter((t) => t.paidBy === currentUser.id && t.owner === "me").reduce((s,t)=>s+t.amount,0);
  const partnerSpent = txs.filter((t) => t.paidBy === partner.id     && t.owner === "partner").reduce((s,t)=>s+t.amount,0);
  const oursSpent    = txs.filter((t) => t.owner === "ours").reduce((s,t)=>s+t.amount,0);

  const [expanded, setExpanded] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);

  const insights = insQ.data ?? [];
  const subCard = insights.find((i) => i.kind === "subscription");

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      {/* Hero */}
      <Card className="p-5">
        <div className="text-[12.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
          Left to spend this month
        </div>
        <div className="mt-2">
          <AmountText value={left} size={34} />
        </div>
        <div className="mt-1 text-[12.5px] text-[color:var(--ink-soft)]">
          of ₹{budget.toLocaleString("en-IN")} · {daysLeft} days left
        </div>
        <div className="mt-4">
          <ProgressBar value={spent} max={budget} height={6} tone="ours" />
        </div>

        {/* Combined-first row */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-[14px] bg-[color:var(--mist)] px-3 py-2.5 text-left"
        >
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-[color:var(--ink)]">
            <span><Dot color="var(--accent)" /> You ₹{fmt(meSpent)}</span>
            <span><Dot color="var(--accent-2)" /> {partner.name} ₹{fmt(partnerSpent)}</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-ours" />
              Ours ₹{fmt(oursSpent)}
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[color:var(--ink-soft)] transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : undefined }}
          />
        </button>
        {expanded && (
          <div className="mt-2 space-y-2 animate-[fade-in_240ms_ease-out]">
            <MiniBar label="You"           value={meSpent}      max={meSpent+partnerSpent+oursSpent} tone="me" />
            <MiniBar label={partner.name}  value={partnerSpent} max={meSpent+partnerSpent+oursSpent} tone="partner" />
            <MiniBar label="Ours"          value={oursSpent}    max={meSpent+partnerSpent+oursSpent} tone="ours" />
          </div>
        )}
      </Card>

      {/* Settle-up */}
      <div
        className="rounded-[20px] border p-4"
        style={{ background: "#E4EEE9", borderColor: "#CFE0D8" }}
      >
        <div className="text-[12.5px] uppercase tracking-[0.08em] text-[color:var(--accent-2)]">
          Running balance
        </div>
        <div className="mt-1 text-[15.5px] font-bold text-[color:var(--ink)]">
          {partner.name} owes you{" "}
          <span className="font-display text-[20px] text-[color:var(--accent-2)]">
            ₹{(balQ.data?.amount ?? 2340).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            className="flex-1 rounded-[12px] py-2.5 text-[13px] font-bold text-white"
            style={{ background: "var(--accent-2)" }}
          >
            Settle via UPI
          </button>
          <button className="flex-1 rounded-[12px] border border-[color:var(--accent-2)]/40 bg-white/60 py-2.5 text-[13px] font-bold text-[color:var(--accent-2)]">
            History
          </button>
        </div>
      </div>

      {/* Insights carousel */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {subCard && (
          <InsightCard
            emoji="🎧"
            title="Two Spotify Premiums"
            body="Save ₹1,428/yr by switching to a Duo plan."
            cta="Fix this"
          />
        )}
        <InsightCard
          emoji="📈"
          title="Dining trending up"
          body="38% above your 3-month average."
          cta="See breakdown"
        />
        <InsightCard
          emoji="🌱"
          title="Groceries under budget"
          body="You've saved ₹1,240 vs last month."
          cta="Nice"
        />
        <div className="w-2 shrink-0" />
      </div>

      {/* Money Date */}
      <div
        className="rounded-[20px] border p-4"
        style={{ background: "#F7EAD1", borderColor: "#EBD9AE" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[12.5px] uppercase tracking-[0.08em] text-[color:var(--gold)]">
              Next Money Date
            </div>
            <div className="mt-1 font-display text-[18px] font-bold leading-tight text-[color:var(--ink)]">
              Sun, 13 July ☕
            </div>
            <div className="mt-1 text-[12.5px] text-[color:var(--ink-soft)]">
              3-week streak 🔥
            </div>
          </div>
          <span className="text-3xl">📚</span>
        </div>
        <button
          onClick={() => setAgendaOpen(true)}
          className="mt-3 flex w-full items-center justify-between rounded-[12px] bg-white/70 px-3 py-2.5 text-[13px] font-bold text-[color:var(--ink)]"
        >
          Preview agenda <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <MoneyDateAgenda open={agendaOpen} onClose={() => setAgendaOpen(false)} partnerName={partner.name} />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: color }} />;
}

function MiniBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "me"|"partner"|"ours" }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px] text-[color:var(--ink-soft)]">
        <span>{label}</span><span>₹{fmt(value)}</span>
      </div>
      <div className="mt-1"><ProgressBar value={value} max={max} tone={tone} height={6} /></div>
    </div>
  );
}

function InsightCard({ emoji, title, body, cta }: { emoji: string; title: string; body: string; cta: string }) {
  return (
    <div className="w-[260px] shrink-0 snap-start rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 card-shadow">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--blush)] text-lg">{emoji}</span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-[color:var(--ink)]">{title}</div>
          <div className="mt-0.5 text-[12px] leading-snug text-[color:var(--ink-soft)]">{body}</div>
        </div>
      </div>
      <button className="mt-3 flex w-full items-center justify-between rounded-[10px] bg-[color:var(--mist)] px-3 py-2 text-[12.5px] font-bold text-[color:var(--ink)]">
        {cta} <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MoneyDateAgenda({ open, onClose, partnerName }: { open: boolean; onClose: () => void; partnerName: string }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Money Date · Sun, 13 July">
      <ol className="flex flex-col gap-3">
        <AgendaBlock n={1} title="Last month's story" body="You spent ₹61,240 of ₹85,000. Rent, groceries, and one big dinner shaped the month." />
        <AgendaBlock n={2} title="3 wins" body="• Groceries under budget · • Emergency fund crossed 70% · • 2 date nights logged" />
        <AgendaBlock n={3} title="1 watch-out" body="Dining is 38% above your 3-month usual — mostly weekday lunches." />
        <AgendaBlock n={4} title="Upcoming big expenses" body="Rent (₹32,000), Meera's mom's birthday gift (~₹2,500), Bali deposit next month." />
        <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">Decision</div>
          <div className="mt-1 text-[14.5px] font-semibold text-[color:var(--ink)]">
            Move ₹5,000/mo from Dining to Bali fund?
          </div>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-[12px] py-2.5 text-[13px] font-bold text-white" style={{ background: "var(--accent-2)" }}>
              Agree
            </button>
            <button className="flex-1 rounded-[12px] border border-[color:var(--line)] bg-[color:var(--surface)] py-2.5 text-[13px] font-bold text-[color:var(--ink)]">
              Discuss with {partnerName}
            </button>
          </div>
        </div>
      </ol>
    </BottomSheet>
  );
}

function AgendaBlock({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <div className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--blush)] text-[10px] font-bold text-[color:var(--accent)]">{n}</span>
        {title}
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--ink)]">{body}</p>
    </div>
  );
}

function fmt(n: number) { return n.toLocaleString("en-IN"); }
