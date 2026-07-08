import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { OwnerId, Profile } from "@/data/types";
import { profiles as seedProfiles } from "@/data/mockData";
import { setViewer } from "@/data/service";

interface CurrentUserCtx {
  currentUserId: OwnerId;
  currentUser: Profile;
  partner: Profile;
  swap: () => void;
  setCurrentUser: (id: OwnerId) => void;
}

const Ctx = createContext<CurrentUserCtx | null>(null);

const STORAGE_KEY = "twogether.currentUser";

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<OwnerId>("aarav");

  // Read from localStorage AFTER mount to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "aarav" || stored === "meera") setCurrentUserId(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, currentUserId); } catch { /* ignore */ }
    setViewer(currentUserId);
  }, [currentUserId]);

  const currentUser = seedProfiles.find((p) => p.id === currentUserId)!;
  const partner = seedProfiles.find((p) => p.id !== currentUserId)!;

  const swap = () =>
    setCurrentUserId((prev) => (prev === "aarav" ? "meera" : "aarav"));

  return (
    <Ctx.Provider
      value={{ currentUserId, currentUser, partner, swap, setCurrentUser: setCurrentUserId }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}

export function ownerColor(id: OwnerId) {
  return id === "aarav" ? "var(--accent)" : "var(--accent-2)";
}
