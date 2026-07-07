import { Link, useLocation } from "@tanstack/react-router";
import { Home, Coins, CalendarHeart, Users, ListChecks, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FAB } from "./primitives";
import { BottomSheet } from "./BottomSheet";
import { useCurrentUser } from "@/lib/currentUser";

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
  const [expenseOpen, setExpenseOpen] = useState(false);
  const location = useLocation();
  const showFab = fabRoutes.has(location.pathname);
  const onMoney = location.pathname === "/money";


  return (
    <div className="min-h-[100dvh] w-full">
      <div
        className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-[color:var(--bg)] shadow-[0_20px_60px_rgba(43,35,64,0.08)] sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[32px] sm:overflow-hidden"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0px)",
        }}
      >
        <main
          className="flex-1 overflow-y-auto pb-[104px]"
          style={{ paddingTop: 8 }}
        >
          {children}
        </main>

        <BottomNav />

        {showFab && (
          <div
            className="pointer-events-none fixed bottom-[76px] left-1/2 z-30 -translate-x-1/2"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="pointer-events-auto">
              <FAB onClick={() => (onMoney ? setExpenseOpen(true) : setQuickOpen(true))}>
                <Plus className="h-6 w-6" />
              </FAB>
            </div>

          </div>
        )}

        <QuickAddSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
        <AddExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} />
        <DevUserToggle />
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

function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows = [
    { icon: "💸", title: "Expense",       hint: "Log a transaction" },
    { icon: "🎁", title: "Wishlist item", hint: "Add to your wishlist" },
    { icon: "💞", title: "Date idea",     hint: "Save for later" },
    { icon: "✅", title: "Task",          hint: "Assign to you or partner" },
    { icon: "⏰", title: "Reminder",      hint: "Bill, occasion, anything" },
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title="Quick add">
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.title}>
            <button
              onClick={onClose}
              className="flex w-full items-center gap-4 rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-left transition-colors duration-[180ms] active:bg-[color:var(--mist)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--blush)] text-xl">
                {r.icon}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-bold text-[color:var(--ink)]">{r.title}</span>
                <span className="block text-[12.5px] text-[color:var(--ink-soft)]">{r.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

// Dev-only floating toggle: swap current user between Aarav / Meera
function DevUserToggle() {
  const { currentUser, swap } = useCurrentUser();
  const isA = currentUser.id === "aarav";
  return (
    <button
      onClick={swap}
      className="fixed bottom-24 left-3 z-40 flex items-center gap-2 rounded-full bg-[color:var(--ink)]/85 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur"
      title="Dev: switch current user"
    >
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-[10px]"
        style={{ background: isA ? "var(--accent)" : "var(--accent-2)" }}
      >
        {isA ? "A" : "M"}
      </span>
      <span className="opacity-80">{currentUser.name}</span>
      <X className="h-3 w-3 rotate-45 opacity-40" />
    </button>
  );
}
