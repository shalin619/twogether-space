// Mock-auth helper — a real Supabase session will replace this later.
const AUTH_KEY     = "twogether.auth";
const PROFILE_KEY  = "twogether.authProfile";
const SPOTLIGHT_KEY = "twogether.spotlightSeen";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return true; // avoid SSR redirect flash
  try { return localStorage.getItem(AUTH_KEY) === "1"; } catch { return true; }
}

export function completeAuth(profile: { name: string; email: string }) {
  try {
    localStorage.setItem(AUTH_KEY, "1");
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

export function signOut() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SPOTLIGHT_KEY);
  } catch { /* ignore */ }
}

export function readAuthProfile(): { name: string; email: string } | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasSeenSpotlight(): boolean {
  try { return localStorage.getItem(SPOTLIGHT_KEY) === "1"; } catch { return true; }
}
export function markSpotlightSeen() {
  try { localStorage.setItem(SPOTLIGHT_KEY, "1"); } catch { /* */ }
}
