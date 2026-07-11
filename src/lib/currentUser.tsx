import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { OwnerId, Profile } from "@/data/types";
import { profiles as seedProfiles } from "@/data/mockData";

// ---------- Real auth context ----------
interface AuthCtx {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  coupleId: string | null;
  hasCouple: boolean;
  refreshCouple: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

const PUBLIC_ROUTES = ["/welcome", "/auth", "/reset-password"];

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [coupleLoaded, setCoupleLoaded] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const userIdRef = useRef<string | null>(null);

  const loadCouple = useCallback(async (userId: string | null) => {
    if (!userId) { setCoupleId(null); setCoupleLoaded(true); return; }
    const { data } = await supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", userId)
      .maybeSingle();
    setCoupleId(data?.couple_id ?? null);
    setCoupleLoaded(true);
  }, []);

  useEffect(() => {
    // Register listener first, then hydrate — avoids missed events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoading(false);
      const nextId = next?.user?.id ?? null;
      if (nextId !== userIdRef.current) {
        userIdRef.current = nextId;
        setCoupleLoaded(false);
        loadCouple(nextId);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
      const id = data.session?.user?.id ?? null;
      userIdRef.current = id;
      loadCouple(id);
    });

    return () => { sub.subscription.unsubscribe(); };
  }, [loadCouple]);

  const refreshCouple = useCallback(async () => {
    await loadCouple(userIdRef.current);
  }, [loadCouple]);

  // Route bootstrap
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
    if (!session && !isPublic) {
      navigate({ to: "/welcome", replace: true });
      return;
    }
    if (session && coupleLoaded && !coupleId && !isPublic) {
      navigate({ to: "/welcome", replace: true });
    }
  }, [session, isLoading, coupleId, coupleLoaded, pathname, navigate]);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    isLoading,
    isAuthenticated: !!session,
    coupleId,
    hasCouple: !!coupleId,
    refreshCouple,
  };

  // Splash while we hydrate the session (avoids protected-content flash)
  if (isLoading) {
    return (
      <AuthContext.Provider value={value}>
        <div
          className="grid min-h-[100dvh] w-full place-items-center"
          style={{ background: "linear-gradient(160deg, var(--blush) 0%, #F7E6DE 50%, #E4EEE9 100%)" }}
        >
          <div className="text-[13px] font-semibold text-[color:var(--ink-soft)]">
            twogether…
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <CompatProvider>{children}</CompatProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within CurrentUserProvider");
  return ctx;
}

// ---------- Back-compat shim for existing screens ----------
// Screens still read { currentUserId, currentUser, partner } to render owner
// colors, avatars and labels. Privacy is now enforced by the database, so the
// dev A/M toggle is gone — the viewer is fixed to the first seed profile
// until screens are migrated to a real profile lookup.
interface CompatCtx {
  currentUserId: OwnerId;
  currentUser: Profile;
  partner: Profile;
}

const CompatContext = createContext<CompatCtx | null>(null);

function CompatProvider({ children }: { children: ReactNode }) {
  const currentUserId: OwnerId = "aarav";
  const currentUser = seedProfiles.find((p) => p.id === currentUserId)!;
  const partner = seedProfiles.find((p) => p.id !== currentUserId)!;
  return (
    <CompatContext.Provider value={{ currentUserId, currentUser, partner }}>
      {children}
    </CompatContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CompatContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}

export function ownerColor(id: OwnerId) {
  return id === "aarav" ? "var(--accent)" : "var(--accent-2)";
}
