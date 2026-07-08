import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { ArrowRight, Check, Copy, MessageCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/twogether/Confetti";
import { completeAuth } from "@/lib/mockAuth";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
  head: () => ({
    meta: [
      { title: "Welcome · Twogether" },
      { name: "description", content: "Start your shared space with your person." },
    ],
  }),
});

type Step = "carousel" | "auth" | "pair" | "quiz-money" | "quiz-occasions" | "quiz-stage";

function WelcomePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("carousel");
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");

  // If already signed in (visited /welcome by mistake), bounce home.
  useEffect(() => {
    try { if (localStorage.getItem("twogether.auth") === "1") navigate({ to: "/" }); } catch { /* */ }
  }, [navigate]);

  const finish = () => {
    completeAuth({ name: name || "You", email: email || "you@example.com" });
    navigate({ to: "/" });
  };

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{
        background:
          "linear-gradient(160deg, var(--blush) 0%, #F7E6DE 50%, #E4EEE9 100%)",
      }}
    >
      <div
        className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        {step === "carousel"     && <Carousel onDone={() => setStep("auth")} />}
        {step === "auth"         && <AuthScreen name={name} email={email} setName={setName} setEmail={setEmail} onContinue={() => setStep("pair")} onBack={() => setStep("carousel")} />}
        {step === "pair"         && <PairScreen onDone={() => setStep("quiz-money")} onBack={() => setStep("auth")} />}
        {step === "quiz-money"   && <MoneyQuiz onDone={() => setStep("quiz-occasions")} onSkip={() => setStep("quiz-occasions")} />}
        {step === "quiz-occasions" && <OccasionsQuiz onDone={() => setStep("quiz-stage")} onSkip={() => setStep("quiz-stage")} />}
        {step === "quiz-stage"   && <LifeStageQuiz onDone={finish} onSkip={finish} />}
      </div>
    </div>
  );
}

// ================ 1. Carousel ================
const SLIDES = [
  { emoji: "🏡", title: "One home for everything you two share",
    body: "Money, plans, wishlists, memories — all in one warm place." },
  { emoji: "💸", title: "Money without the awkward",
    body: "Split, save, and see the big picture — together." },
  { emoji: "🎁", title: "Never miss a moment — or a hint 😉",
    body: "Occasions, gifts, and dates that don't slip through the cracks." },
];

function Carousel({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  return (
    <div className="flex flex-1 flex-col px-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[color:var(--ink-soft)]">Twogether</div>
        <button
          onClick={onDone}
          className="min-h-9 rounded-full px-3 text-[13px] font-semibold text-[color:var(--ink-soft)]"
        >
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="mb-6 grid h-40 w-40 place-items-center rounded-full text-[80px]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #FFFFFF 0%, var(--blush) 40%, #F7E6DE 100%)",
            boxShadow: "0 20px 40px rgba(226,114,91,0.15)",
          }}
          key={i}
        >
          <span className="animate-[fade-in_400ms_ease-out]">{s.emoji}</span>
        </div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.01em] text-[color:var(--ink)]">
          {s.title}
        </h1>
        <p className="mt-3 max-w-[300px] text-[14px] text-[color:var(--ink-soft)]">{s.body}</p>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex justify-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === i ? "w-6" : "w-1.5",
              )}
              style={{ background: idx === i ? "var(--accent)" : "var(--ink-soft)", opacity: idx === i ? 1 : 0.3 }}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {last ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}

// ================ 2. Auth ================
function AuthScreen({
  name, email, setName, setEmail, onContinue, onBack,
}: {
  name: string; email: string;
  setName: (s: string) => void; setEmail: (s: string) => void;
  onContinue: () => void; onBack: () => void;
}) {
  const ok = name.trim().length > 0 && /\S+@\S+/.test(email);
  return (
    <div className="flex flex-1 flex-col px-6 pt-4">
      <Header onBack={onBack} />
      <div className="mt-6">
        <h1 className="font-display text-[26px] font-bold leading-tight text-[color:var(--ink)]">
          Nice to meet you 👋
        </h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
          Just a name and an email — you can change it later.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full min-h-13 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-[15px] outline-none focus:border-[color:var(--accent)]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
          className="w-full min-h-13 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-[15px] outline-none focus:border-[color:var(--accent)]"
        />
      </div>

      <button
        disabled={!ok}
        onClick={onContinue}
        className="mt-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        Continue
      </button>

      <div className="my-4 flex items-center gap-3 text-[12px] text-[color:var(--ink-soft)]">
        <span className="h-px flex-1 bg-[color:var(--line)]" />
        or
        <span className="h-px flex-1 bg-[color:var(--line)]" />
      </div>

      <button
        onClick={onContinue}
        className="w-full min-h-13 rounded-full border border-[color:var(--line)] bg-white/80 text-[14px] font-semibold text-[color:var(--ink)]"
      >
        <span className="mr-2">G</span> Continue with Google
      </button>

      <div className="mt-auto mb-4 text-center text-[11px] text-[color:var(--ink-soft)]">
        By continuing you agree to our tiny terms 💛
      </div>
    </div>
  );
}

// ================ 3. Create or Join ================
function PairScreen({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [mode, setMode] = useState<"choose" | "create" | "join" | "success">("choose");
  const [code, setCode] = useState("");

  const roomCode = "LUV-482";

  if (mode === "success") {
    return <PairSuccess onDone={onDone} />;
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-4">
      <Header onBack={mode === "choose" ? onBack : () => setMode("choose")} />
      {mode === "choose" && (
        <>
          <h1 className="mt-6 font-display text-[24px] font-bold leading-tight text-[color:var(--ink)]">
            Set up your shared space
          </h1>
          <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
            You can start solo — invite your person any time.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-3xl border border-[color:var(--line)] bg-white/80 p-5 text-left transition-transform active:scale-[0.98]"
            >
              <div className="text-[32px]">💫</div>
              <div className="mt-2 font-display text-[18px] font-bold text-[color:var(--ink)]">
                Start our space
              </div>
              <div className="mt-1 text-[13px] text-[color:var(--ink-soft)]">
                Get a code to share with your person.
              </div>
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-3xl border border-[color:var(--line)] bg-white/80 p-5 text-left transition-transform active:scale-[0.98]"
            >
              <div className="text-[32px]">🔑</div>
              <div className="mt-2 font-display text-[18px] font-bold text-[color:var(--ink)]">
                I have an invite code
              </div>
              <div className="mt-1 text-[13px] text-[color:var(--ink-soft)]">
                Type it in and we'll pair you up.
              </div>
            </button>
          </div>
        </>
      )}

      {mode === "create" && (
        <>
          <h1 className="mt-6 font-display text-[22px] font-bold text-[color:var(--ink)]">
            Share this with your person
          </h1>
          <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
            When they enter it, your space unlocks together.
          </p>

          <div className="mt-6 rounded-3xl bg-white/80 p-5 text-center">
            <div className="font-display text-[42px] font-bold tracking-[0.15em] text-[color:var(--accent)]">
              {roomCode}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(roomCode); }}
              className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full bg-[color:var(--mist)] px-4 text-[12.5px] font-semibold text-[color:var(--ink)]"
            >
              <Copy size={13} /> Copy code
            </button>
          </div>

          <button
            className="mt-4 flex w-full min-h-13 items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold text-white"
            style={{ background: "#25D366" }}
            onClick={() => {}}
          >
            <MessageCircle size={16} /> Share via WhatsApp
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-[color:var(--ink-soft)]">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--accent)", animation: "pulse 1.6s ease-in-out infinite" }}
            />
            waiting for your person…
          </div>

          <button
            onClick={() => setMode("success")}
            className="mt-auto mb-4 text-center text-[13.5px] font-semibold text-[color:var(--ink-soft)] underline underline-offset-2"
          >
            Continue solo
          </button>
        </>
      )}

      {mode === "join" && (
        <>
          <h1 className="mt-6 font-display text-[22px] font-bold text-[color:var(--ink)]">
            Enter your invite code
          </h1>
          <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
            Ask your person for the 6-character code.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LUV-482"
            className="mt-6 w-full min-h-14 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-center font-display text-[24px] font-bold tracking-[0.15em] outline-none focus:border-[color:var(--accent)]"
          />
          <button
            disabled={code.replace(/\W/g, "").length < 6}
            onClick={() => setMode("success")}
            className="mt-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            Pair up
          </button>
        </>
      )}
    </div>
  );
}

function PairSuccess({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 100);
    const t2 = setTimeout(() => onDone(), 2200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #FFFFFF 0%, var(--blush) 40%, #E4EEE9 100%)",
      }}
    >
      <Confetti fireKey="pair-success" count={40} />
      <div className="relative mb-6 flex h-24 items-center justify-center">
        <div
          className="absolute grid h-20 w-20 place-items-center rounded-full bg-white text-[36px] transition-transform duration-[900ms] ease-out"
          style={{ transform: shown ? "translateX(-14px)" : "translateX(-120px)" }}
        >
          🧡
        </div>
        <div
          className="absolute grid h-20 w-20 place-items-center rounded-full bg-white text-[36px] transition-transform duration-[900ms] ease-out"
          style={{ transform: shown ? "translateX(14px)" : "translateX(120px)" }}
        >
          🌿
        </div>
      </div>
      <h1 className="font-display text-[26px] font-bold text-[color:var(--ink)]">
        You're in this together 🎉
      </h1>
      <p className="mt-2 text-[13.5px] text-[color:var(--ink-soft)]">
        Setting up your space…
      </p>
    </div>
  );
}

// ================ 4. Quizzes ================
function QuizShell({
  step, total, title, onSkip, children,
}: { step: number; total: number; title: string; onSkip: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col px-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 22 : 6,
                background: i <= step ? "var(--accent)" : "var(--ink-soft)",
                opacity:    i <= step ? 1 : 0.25,
              }}
            />
          ))}
        </div>
        <button
          onClick={onSkip}
          className="min-h-9 rounded-full px-3 text-[13px] font-semibold text-[color:var(--ink-soft)]"
        >
          Skip
        </button>
      </div>
      <h1 className="mt-6 font-display text-[22px] font-bold leading-tight text-[color:var(--ink)]">
        {title}
      </h1>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

const MONEY_QS: { q: string; a: string; b: string; av: "yours" | "one-pot" | "hybrid"; bv: "yours" | "one-pot" | "hybrid" }[] = [
  { q: "Weekend brunch — who pays?",     a: "One of us grabs it 🤝",  b: "Split every time 🧮",    av: "hybrid",  bv: "yours" },
  { q: "Salaries land — where do they go?", a: "One joint pot 🍯",   b: "Ours + separate ✨",     av: "one-pot", bv: "hybrid" },
  { q: "A ₹5,000 spontaneous purchase…", a: "Just do it 💫",         b: "Text first 📱",          av: "one-pot", bv: "hybrid" },
  { q: "Vacation savings live…",         a: "In a shared goal 🌴",   b: "Split between us 🎒",    av: "one-pot", bv: "hybrid" },
  { q: "Personal spending is…",          a: "Totally private 🔒",    b: "Loosely visible 👀",     av: "yours",   bv: "hybrid" },
];

function MoneyQuiz({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [i, setI] = useState(0);
  const [scores, setScores] = useState({ yours: 0, "one-pot": 0, hybrid: 0 });
  const [result, setResult] = useState<null | "yours" | "one-pot" | "hybrid">(null);

  const pick = (v: "yours" | "one-pot" | "hybrid") => {
    const next = { ...scores, [v]: scores[v] + 1 };
    setScores(next);
    if (i === MONEY_QS.length - 1) {
      const winner = (Object.entries(next).sort((a, b) => b[1] - a[1])[0][0]) as typeof result;
      setResult(winner);
    } else setI(i + 1);
  };

  if (result) {
    const meta = {
      hybrid:   { title: "You're a Hybrid couple 🤝", body: "Yours, mine, and ours — each with its own place." },
      "one-pot": { title: "You're a One-pot couple 🍯", body: "Everything flows together, no counting." },
      yours:    { title: "You're a Yours & Mine couple 🧮", body: "Independent finances, teamwork on the shared stuff." },
    }[result];
    return (
      <QuizShell step={0} total={3} title="Your money style" onSkip={onDone}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 text-[64px]">🤝</div>
          <div className="font-display text-[22px] font-bold text-[color:var(--ink)]">{meta.title}</div>
          <p className="mt-2 max-w-[280px] text-[13.5px] text-[color:var(--ink-soft)]">{meta.body}</p>
        </div>
        <button
          onClick={onDone}
          className="mb-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Continue
        </button>
      </QuizShell>
    );
  }

  const cur = MONEY_QS[i];
  return (
    <QuizShell step={0} total={3} title={cur.q} onSkip={onSkip}>
      <div className="flex flex-1 flex-col gap-3">
        {[
          { label: cur.a, v: cur.av },
          { label: cur.b, v: cur.bv },
        ].map((o) => (
          <button
            key={o.label}
            onClick={() => pick(o.v)}
            className="flex-1 rounded-3xl border border-[color:var(--line)] bg-white/80 p-5 text-left transition-transform active:scale-[0.98]"
          >
            <div className="font-display text-[18px] font-semibold text-[color:var(--ink)]">
              {o.label}
            </div>
          </button>
        ))}
      </div>
      <div className="mb-4 mt-3 text-center text-[11.5px] text-[color:var(--ink-soft)]">
        Question {i + 1} of {MONEY_QS.length}
      </div>
    </QuizShell>
  );
}

function OccasionsQuiz({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [anniv, setAnniv] = useState("");
  const [rows, setRows] = useState<{ name: string; date: string }[]>([
    { name: "", date: "" },
  ]);

  return (
    <QuizShell step={1} total={3} title="Dates that matter" onSkip={onSkip}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-soft)]">
            💍 Anniversary
          </label>
          <input
            type="date"
            value={anniv}
            onChange={(e) => setAnniv(e.target.value)}
            className="w-full min-h-13 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-[15px] outline-none focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <div className="mb-1 text-[12px] font-semibold text-[color:var(--ink-soft)]">
            🎂 Birthdays
          </div>
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={r.name}
                  onChange={(e) => {
                    const next = [...rows]; next[idx] = { ...r, name: e.target.value }; setRows(next);
                  }}
                  placeholder="Name"
                  className="min-h-11 flex-1 rounded-2xl border border-[color:var(--line)] bg-white/80 px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
                />
                <input
                  type="date"
                  value={r.date}
                  onChange={(e) => {
                    const next = [...rows]; next[idx] = { ...r, date: e.target.value }; setRows(next);
                  }}
                  className="min-h-11 w-[160px] rounded-2xl border border-[color:var(--line)] bg-white/80 px-3 text-[14px] outline-none focus:border-[color:var(--accent)]"
                />
              </div>
            ))}
            <button
              onClick={() => setRows([...rows, { name: "", date: "" }])}
              className="min-h-10 rounded-full bg-[color:var(--mist)] px-4 text-[12.5px] font-semibold text-[color:var(--ink)]"
            >
              + Add birthday
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <button
        onClick={onDone}
        className="mb-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        Continue
      </button>
    </QuizShell>
  );
}

const STAGES = [
  { v: "dating",       label: "Dating", emoji: "💞" },
  { v: "engaged",      label: "Engaged", emoji: "💍" },
  { v: "newly-married", label: "Newly married", emoji: "🎉" },
  { v: "old-pros",     label: "Old pros 😄", emoji: "🌿" },
  { v: "long-distance", label: "Long-distance", emoji: "✈️" },
  { v: "parents",      label: "Parents", emoji: "👶" },
];

function LifeStageQuiz({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (v: string) =>
    setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <QuizShell step={2} total={3} title="Where are you two right now?" onSkip={onSkip}>
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const on = picked.includes(s.v);
          return (
            <button
              key={s.v}
              onClick={() => toggle(s.v)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-[14px] font-semibold transition-colors",
                on
                  ? "border-transparent bg-[color:var(--accent)] text-white"
                  : "border-[color:var(--line)] bg-white/80 text-[color:var(--ink)]",
              )}
            >
              {s.emoji} {s.label} {on && <Check size={12} className="ml-1 inline" />}
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <button
        onClick={onDone}
        className="mb-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        Enter our space
      </button>
    </QuizShell>
  );
}

// ================ Bits ================
function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="grid h-9 w-9 place-items-center rounded-full bg-white/70"
        aria-label="Back"
      >
        <ChevronLeft size={18} className="text-[color:var(--ink)]" />
      </button>
      <div className="text-[13px] font-semibold text-[color:var(--ink-soft)]">Twogether</div>
      <span className="w-9" />
    </div>
  );
}
