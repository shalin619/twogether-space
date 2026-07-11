import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Coins, CalendarHeart, Users, ListChecks, Mic, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

import { AddExpenseSheet } from "./money/AddExpenseSheet";
import { QuickAddSheet } from "./QuickAdd";
import { VoiceSheet } from "./VoiceSheet";
import { useCurrentUser } from "@/lib/currentUser";
import { isAuthed, hasSeenSpotlight, markSpotlightSeen } from "@/lib/mockAuth";

const tabs = [
  { to: "/",       label: "Home",   Icon: Home },
  { to: "/money",  label: "Money",  Icon: Coins },
  { to: "/plans",  label: "Plans",  Icon: CalendarHeart },
  { to: "/us",     label: "Us",     Icon: Users },
  { to: "/lists",  label: "Lists",  Icon: ListChecks },
] as const;

const fabRoutes = new Set(["/", "/money", "/lists"]);

export function AppShell({ children }: { children: ReactNode }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [spotlight, setSpotlight] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const showFab = fabRoutes.has(location.pathname);
  const onWelcome = location.pathname.startsWith("/welcome");

  // Long-press detection for the mic (tap = voice, hold = quick add)
  const pressTimer = useRef<number | null>(null);
  const longFired = useRef(false);
  const startPress = () => {
    longFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      longFired.current = true;
      setQuickOpen(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.(12); } catch { /* noop */ }
      }
    }, 420);
  };
  const endPress = (fire: boolean) => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    if (fire && !longFired.current) setVoiceOpen(true);
  };

  // Mock-auth guard — send unauthenticated users to /welcome
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthed() && !onWelcome) {
      navigate({ to: "/welcome" });
    }
  }, [location.pathname, onWelcome, navigate]);

  // One-time spotlight on the mic after onboarding
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthed() && !hasSeenSpotlight() && location.pathname === "/") {
      const t = setTimeout(() => setSpotlight(true), 600);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const dismissSpotlight = () => { setSpotlight(false); markSpotlightSeen(); };

  if (onWelcome) {
    return <div className="min-h-[100dvh] w-full">{children}</div>;
  }

  return (
    <div className="min-h-[100dvh] w-full">
      <div
        className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-[color:var(--bg)] shadow-[0_20px_60px_rgba(43,35,64,0.08)] sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:overflow-hidden"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0px)",
        }}
      >
        <main
          className="flex-1 overflow-y-auto pb-[112px]"
          style={{ paddingTop: 8 }}
        >
          {children}
        </main>

        <BottomNav />

        {showFab && (
          <div
            className="pointer-events-none fixed bottom-[92px] left-1/2 z-30 -translate-x-1/2"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="pointer-events-auto relative">
              {/* Mic — tap to talk, long-press for manual quick-add */}
              <button
                onMouseDown={startPress}
                onMouseUp={() => endPress(true)}
                onMouseLeave={() => endPress(false)}
                onTouchStart={startPress}
                onTouchEnd={(e) => { e.preventDefault(); endPress(true); }}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Talk to add (long-press for menu)"
                className="relative grid h-16 w-16 place-items-center rounded-full text-white shadow-[0_12px_28px_rgba(226,114,91,0.4)] transition-transform duration-[180ms] active:scale-95"
                style={{ background: "var(--ours)" }}
              >
                {/* breathing gradient ring */}
                <span
                  className="pointer-events-none absolute -inset-1.5 rounded-full opacity-70 animate-pulse"
                  style={{ background: "var(--ours)", filter: "blur(10px)" }}
                />
                <Mic className="relative h-6 w-6" />
              </button>

              {spotlight && (
                <>
                  <div
                    className="pointer-events-auto fixed inset-0 z-40"
                    style={{ background: "rgba(43,35,64,0.55)" }}
                    onClick={dismissSpotlight}
                  />
                  <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center">
                    <span
                      className="absolute inset-0 -m-2 animate-ping rounded-full"
                      style={{ background: "rgba(226,114,91,0.35)" }}
                    />
                  </div>
                  <div
                    className="fixed left-1/2 z-50 w-[260px] -translate-x-1/2 rounded-2xl bg-[color:var(--surface)] p-3 text-center card-shadow animate-[fade-in_220ms_ease-out]"
                    style={{ bottom: 172 }}
                  >
                    <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">
                      Just say it 🎙️
                    </div>
                    <div className="mt-0.5 text-[12px] text-[color:var(--ink-soft)]">
                      Tap to talk. Long-press for the manual menu.
                    </div>
                    <button
                      onClick={dismissSpotlight}
                      className="mt-2 min-h-9 rounded-full bg-[color:var(--accent)] px-4 text-[12.5px] font-semibold text-white"
                    >
                      Got it
                    </button>
                    <span
                      className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[color:var(--surface)]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <VoiceSheet    open={voiceOpen}   onClose={() => setVoiceOpen(false)} />
        <QuickAddSheet open={quickOpen}   onClose={() => setQuickOpen(false)} />
        <AddExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-[color:var(--line)] bg-[color:var(--surface)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-1 flex-col items-center justify-center gap-1"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid h-8 w-10 place-items-center rounded-full transition-colors duration-[180ms]",
                      isActive && "bg-[color:var(--blush)]",
                    )}
                  >
                    <Icon
                      className="h-[18px] w-[18px]"
                      style={{ color: isActive ? "var(--accent)" : "var(--ink-soft)" }}
                    />
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isActive ? "var(--accent)" : "var(--ink-soft)" }}
                  >
                    {label}
                  </span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

