import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Check, Copy, MessageCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/twogether/Confetti";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/currentUser";
import { toast } from "sonner";

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
  const { isLoading, isAuthenticated, coupleId, refreshCouple } = useAuth();
  const [step, setStep] = useState<Step>("carousel");
  const [pickedMoney, setPickedMoney] = useState<"yours" | "one-pot" | "hybrid" | null>(null);

  // Route bootstrap based on real auth state
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && coupleId) {
      // fully onboarded — leave welcome
      navigate({ to: "/" });
    } else if (isAuthenticated && !coupleId) {
      // signed in but no space yet → jump straight to pair step
      setStep((s) => (s === "carousel" || s === "auth" ? "pair" : s));
    }
  }, [isLoading, isAuthenticated, coupleId, navigate]);

  const finish = () => navigate({ to: "/" });

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
        {step === "auth"         && <AuthScreen onContinue={() => setStep("pair")} onBack={() => setStep("carousel")} />}
        {step === "pair"         && <PairScreen onDone={async () => { await refreshCouple(); setStep("quiz-money"); }} onBack={() => setStep("auth")} />}
        {step === "quiz-money"   && <MoneyQuiz onDone={(pick) => { setPickedMoney(pick); setStep("quiz-occasions"); }} onSkip={() => setStep("quiz-occasions")} coupleId={coupleId} moneyPick={pickedMoney} />}
        {step === "quiz-occasions" && <OccasionsQuiz onDone={() => setStep("quiz-stage")} onSkip={() => setStep("quiz-stage")} coupleId={coupleId} />}
        {step === "quiz-stage"   && <LifeStageQuiz onDone={finish} onSkip={finish} coupleId={coupleId} />}
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
function AuthScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const ok =
    /\S+@\S+/.test(email) &&
    password.length >= 6 &&
    (mode === "signin" || name.trim().length > 0);

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/welcome`,
          },
        });
        if (error) throw error;

        if (!data.session) {
          toast.success("Check your email to confirm your account 💌");
          setBusy(false);
          return;
        }
        // Best-effort profile name write (profiles row is auto-created by trigger)
        if (data.user) {
          await supabase.from("profiles").update({ name }).eq("id", data.user.id);
        }
        onContinue();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onContinue();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col px-6 pt-4">
      <Header onBack={onBack} />
      <div className="mt-6">
        <h1 className="font-display text-[26px] font-bold leading-tight text-[color:var(--ink)]">
          {mode === "signup" ? "Nice to meet you 👋" : "Welcome back 💛"}
        </h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
          {mode === "signup"
            ? "Just a name, email, and password — you can change it later."
            : "Sign in to your shared space."}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full min-h-13 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-[15px] outline-none focus:border-[color:var(--accent)]"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          className="w-full min-h-13 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-[15px] outline-none focus:border-[color:var(--accent)]"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full min-h-13 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 text-[15px] outline-none focus:border-[color:var(--accent)]"
        />
      </div>

      <button
        disabled={!ok || busy}
        onClick={submit}
        className="mt-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>

      <button
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        className="mt-3 min-h-10 text-center text-[13px] font-semibold text-[color:var(--ink-soft)]"
      >
        {mode === "signup" ? "I already have an account" : "Create a new account instead"}
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
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const startCreate = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("create_couple", { p_status: "dating" });
      if (error) throw error;
      setCreatedCode(String(data));
      setMode("create");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create your space");
    } finally {
      setCreating(false);
    }
  };

  const pairUp = async () => {
    if (joining) return;
    setJoining(true);
    try {
      const { error } = await supabase.rpc("join_couple", { p_code: code.toUpperCase() });
      if (error) throw error;
      setMode("success");
    } catch {
      toast.error("Invalid or expired code");
    } finally {
      setJoining(false);
    }
  };

  // Poll for partner join
  useEffect(() => {
    if (mode !== "create" || !createdCode) return;
    let stop = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("couple_members")
        .select("couple_id, user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      const { data: members } = await supabase
        .from("couple_members")
        .select("user_id")
        .eq("couple_id", data.couple_id);
      if (!stop && members && members.length >= 2) setMode("success");
    };
    const id = window.setInterval(check, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [mode, createdCode]);

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
              disabled={creating}
              onClick={startCreate}
              className="w-full rounded-3xl border border-[color:var(--line)] bg-white/80 p-5 text-left transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <div className="text-[32px]">💫</div>
              <div className="mt-2 font-display text-[18px] font-bold text-[color:var(--ink)]">
                {creating ? "Creating…" : "Start our space"}
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

      {mode === "create" && createdCode && (
        <>
          <h1 className="mt-6 font-display text-[22px] font-bold text-[color:var(--ink)]">
            Share this with your person
          </h1>
          <p className="mt-1 text-[13.5px] text-[color:var(--ink-soft)]">
            When they enter it, your space unlocks together.
          </p>

          <div className="mt-6 rounded-3xl bg-white/80 p-5 text-center">
            <div className="font-display text-[42px] font-bold tracking-[0.15em] text-[color:var(--accent)]">
              {createdCode}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(createdCode); toast.success("Code copied"); }}
              className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full bg-[color:var(--mist)] px-4 text-[12.5px] font-semibold text-[color:var(--ink)]"
            >
              <Copy size={13} /> Copy code
            </button>
          </div>

          <a
            className="mt-4 flex w-full min-h-13 items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold text-white"
            style={{ background: "#25D366" }}
            href={`https://wa.me/?text=${encodeURIComponent(`Join our Twogether space with this code: ${createdCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} /> Share via WhatsApp
          </a>

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
            disabled={code.replace(/\W/g, "").length < 6 || joining}
            onClick={pairUp}
            className="mt-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {joining ? "Pairing…" : "Pair up"}
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

type MoneyModel = "yours" | "one-pot" | "hybrid";

const MONEY_QS: { q: string; a: string; b: string; av: MoneyModel; bv: MoneyModel }[] = [
  { q: "Weekend brunch — who pays?",     a: "One of us grabs it 🤝",  b: "Split every time 🧮",    av: "hybrid",  bv: "yours" },
  { q: "Salaries land — where do they go?", a: "One joint pot 🍯",   b: "Ours + separate ✨",     av: "one-pot", bv: "hybrid" },
  { q: "A ₹5,000 spontaneous purchase…", a: "Just do it 💫",         b: "Text first 📱",          av: "one-pot", bv: "hybrid" },
  { q: "Vacation savings live…",         a: "In a shared goal 🌴",   b: "Split between us 🎒",    av: "one-pot", bv: "hybrid" },
  { q: "Personal spending is…",          a: "Totally private 🔒",    b: "Loosely visible 👀",     av: "yours",   bv: "hybrid" },
];

const SPLIT_RULE: Record<MoneyModel, string> = {
  yours: "each-pays-own",
  hybrid: "50-50",
  "one-pot": "shared-pool",
};

function MoneyQuiz({ onDone, onSkip, coupleId, moneyPick }: { onDone: (pick: MoneyModel) => void; onSkip: () => void; coupleId: string | null; moneyPick: MoneyModel | null }) {
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<Record<MoneyModel, number>>({ yours: 0, "one-pot": 0, hybrid: 0 });
  const [result, setResult] = useState<MoneyModel | null>(moneyPick);

  const pick = (v: MoneyModel) => {
    const next = { ...scores, [v]: scores[v] + 1 };
    setScores(next);
    if (i === MONEY_QS.length - 1) {
      const winner = (Object.entries(next).sort((a, b) => b[1] - a[1])[0][0]) as MoneyModel;
      setResult(winner);
      if (coupleId) {
        supabase.from("couples")
          .update({ money_model: winner, split_rule: SPLIT_RULE[winner] })
          .eq("id", coupleId)
          .then(({ error }) => { if (error) toast.error(error.message); });
      }
    } else setI(i + 1);
  };

  if (result) {
    const meta = {
      hybrid:   { title: "You're a Hybrid couple 🤝", body: "Yours, mine, and ours — each with its own place." },
      "one-pot": { title: "You're a One-pot couple 🍯", body: "Everything flows together, no counting." },
      yours:    { title: "You're a Yours & Mine couple 🧮", body: "Independent finances, teamwork on the shared stuff." },
    }[result];
    return (
      <QuizShell step={0} total={3} title="Your money style" onSkip={() => onDone(result)}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 text-[64px]">🤝</div>
          <div className="font-display text-[22px] font-bold text-[color:var(--ink)]">{meta.title}</div>
          <p className="mt-2 max-w-[280px] text-[13.5px] text-[color:var(--ink-soft)]">{meta.body}</p>
        </div>
        <button
          onClick={() => onDone(result)}
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

function OccasionsQuiz({ onDone, onSkip, coupleId }: { onDone: () => void; onSkip: () => void; coupleId: string | null }) {
  const [anniv, setAnniv] = useState("");
  const [rows, setRows] = useState<{ name: string; date: string }[]>([
    { name: "", date: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!coupleId) return onDone();
    setSaving(true);
    try {
      const payload: { couple_id: string; kind: string; label: string; date: string }[] = [];
      if (anniv) payload.push({ couple_id: coupleId, kind: "anniversary", label: "Anniversary", date: anniv });
      for (const r of rows) {
        if (r.name.trim() && r.date) {
          payload.push({ couple_id: coupleId, kind: "birthday", label: r.name.trim(), date: r.date });
        }
      }
      if (payload.length) {
        const { error } = await supabase.from("occasions").insert(payload);
        if (error) throw error;
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save occasions");
      onDone();
    } finally {
      setSaving(false);
    }
  };

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
        disabled={saving}
        onClick={save}
        className="mb-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {saving ? "Saving…" : "Continue"}
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

function LifeStageQuiz({ onDone, onSkip, coupleId }: { onDone: () => void; onSkip: () => void; coupleId: string | null }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const toggle = (v: string) =>
    setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const save = async () => {
    if (!coupleId || picked.length === 0) return onDone();
    setSaving(true);
    try {
      const { error } = await supabase.from("couples")
        .update({ status: picked[0] })
        .eq("id", coupleId);
      if (error) throw error;
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your stage");
      onDone();
    } finally {
      setSaving(false);
    }
  };

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
        disabled={saving}
        onClick={save}
        className="mb-4 w-full min-h-13 rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {saving ? "Saving…" : "Enter our space"}
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
