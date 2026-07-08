// Mock intent engine for Whisper v0.
// Pattern-matches free-text (voice or typed) into a Draft that the
// VoiceSheet renders as a confirm-card. Nothing here writes to the service —
// commits happen only after the user taps "Confirm" in the sheet.
//
// Privacy: read-queries call the same service reads the UI uses, which are
// already viewer-scoped (hidden gifts filtered out, surprise events masked).
// Voice therefore inherits RLS behavior — it cannot become the privacy hole.

import type { OwnerId } from "@/data/types";
import {
  getTransactions, getCategories, getRunningBalance, getWishlist,
} from "@/data/service";

// ---------- Draft types ----------
export type ExpenseDraft = {
  kind: "expense";
  amount: number;
  merchant: string;
  categoryId: string;
  categoryName: string;
  emoji: string;
  owner: "me" | "partner" | "ours";
  splitLabel?: string;   // e.g. "Split 50/50" or "You paid all"
  hidden?: boolean;      // gift route → isGiftHidden
  hiddenReason?: string; // "Meera won't see this"
};
export type WishlistDraft = {
  kind: "wishlist";
  title: string;
  ownerId: OwnerId | "ours";
  price?: number;
  note?: string;
  priority: 1 | 2 | 3;
};
export type GroceryDraft = {
  kind: "grocery";
  items: string[];
};
export type TaskDraft = {
  kind: "task";
  title: string;
  assignee: OwnerId | "ours";
  dueDate?: string;
};
export type ReminderDraft = {
  kind: "reminder";
  name: string;
  dueDate: string;
  amount?: number;
};
export type DateIdeaDraft = {
  kind: "date";
  title: string;
  vibe: "chill" | "active" | "romantic" | "at-home";
  price: 1 | 2 | 3;
};
export type EventDraft = {
  kind: "event";
  title: string;
  date: string;
  owner: "me" | "partner" | "ours";
  location?: string;
};
export type MemoryDraft = {
  kind: "memory";
  title: string;
  date: string;
};
export type QueryDraft = {
  kind: "query";
  question: string;
  answer: string;
  detail?: string;
};
export type UnknownDraft = {
  kind: "unknown";
  transcript: string;
  hint: string;
};

export type Draft =
  | ExpenseDraft | WishlistDraft | GroceryDraft | TaskDraft
  | ReminderDraft | DateIdeaDraft | EventDraft | MemoryDraft
  | QueryDraft | UnknownDraft;

// ---------- Example chips (double as demo script) ----------
export const EXAMPLES: string[] = [
  "Spent 480 on coffee at Blue Tokai, split it",
  "Add 1600 for Meera's birthday gift, hide it",
  "Meera wants a linen dress, size M, around 3500",
  "Add milk, eggs, bread and coffee to groceries",
  "Remind me to renew insurance on Aug 15",
  "Task: book the plumber, assign to me",
  "Save a date idea: sunset walk at Bandra Bandstand",
  "Add dinner with parents on Saturday 8pm",
  "New memory: Goa weekend",
  "How much did we spend on dining this month?",
  "What do I owe Meera?",
];

// ---------- Category resolver ----------
const CAT_KEYWORDS: Array<{ ids: string[]; words: string[]; emoji: string }> = [
  { ids: ["cat_dining"], words: ["dining", "dinner", "lunch", "restaurant", "cafe", "coffee", "brunch", "bar", "drinks"], emoji: "🍽️" },
  { ids: ["cat_food"],   words: ["zomato", "swiggy", "takeout", "takeaway", "delivery"], emoji: "🥡" },
  { ids: ["cat_groc"],   words: ["grocery", "groceries", "bigbasket", "dmart", "supermarket"], emoji: "🛒" },
  { ids: ["cat_travel"], words: ["uber", "ola", "cab", "auto", "taxi", "petrol", "fuel", "metro"], emoji: "🚕" },
  { ids: ["cat_rent"],   words: ["rent"], emoji: "🏠" },
  { ids: ["cat_util"],   words: ["electricity", "water", "wifi", "internet", "gas bill", "utility", "utilities"], emoji: "💡" },
  { ids: ["cat_shop"],   words: ["shopping", "amazon", "myntra", "clothes", "shoes"], emoji: "🛍️" },
  { ids: ["cat_sub"],    words: ["netflix", "spotify", "prime", "subscription", "youtube"], emoji: "🎬" },
  { ids: ["cat_gift"],   words: ["gift", "present", "birthday gift", "anniversary gift"], emoji: "🎁" },
  { ids: ["cat_health"], words: ["pharmacy", "doctor", "gym", "yoga", "health", "medicine"], emoji: "🌿" },
  { ids: ["cat_dates"],  words: ["date night", "movie"], emoji: "💞" },
];

function resolveCategory(text: string): { id: string; name: string; emoji: string } {
  const lower = text.toLowerCase();
  for (const c of CAT_KEYWORDS) {
    if (c.words.some((w) => lower.includes(w))) {
      return { id: c.ids[0], name: prettyCat(c.ids[0]), emoji: c.emoji };
    }
  }
  return { id: "cat_shop", name: "Shopping", emoji: "🛍️" };
}

function prettyCat(id: string): string {
  switch (id) {
    case "cat_dining": return "Dining";
    case "cat_food":   return "Zomato/Swiggy";
    case "cat_groc":   return "Groceries";
    case "cat_travel": return "Transport";
    case "cat_rent":   return "Rent";
    case "cat_util":   return "Utilities";
    case "cat_shop":   return "Shopping";
    case "cat_sub":    return "Subscriptions";
    case "cat_gift":   return "Gifts";
    case "cat_health": return "Health";
    case "cat_dates":  return "Date Nights";
    default: return "Shopping";
  }
}

// ---------- Small parsers ----------
function parseAmount(text: string): number | null {
  // ₹1,600 or 1600 or "1.6k"
  const m1 = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
  if (m1) return Math.round(parseFloat(m1[1].replace(/,/g, "")));
  const m2 = text.match(/(\d[\d,]*)\s*(k|thousand)?/i);
  if (m2) {
    const n = parseFloat(m2[1].replace(/,/g, ""));
    return Math.round(m2[2] ? n * 1000 : n);
  }
  return null;
}

function parseMerchant(text: string): string {
  // "at <name>" or "on <name>"
  const m = text.match(/\b(?:at|from)\s+([A-Z][A-Za-z0-9' &\-]{1,30})/);
  if (m) return m[1].trim();
  const m2 = text.match(/\bon\s+([a-z][a-z0-9' &\-]{2,20})/i);
  if (m2) return titleCase(m2[1].trim());
  return "Cash";
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDateHint(text: string): string {
  const now = new Date();
  const lower = text.toLowerCase();
  const dayIdx = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]
    .findIndex((d) => lower.includes(d));
  if (dayIdx >= 0) {
    const d = new Date(now);
    const diff = (dayIdx - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString();
  }
  if (lower.includes("tomorrow")) {
    const d = new Date(now); d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  if (lower.includes("today")) return now.toISOString();
  // "Aug 15" style
  const m = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/);
  if (m) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const mo = months.indexOf(m[1]);
    const day = parseInt(m[2]);
    const y = now.getFullYear();
    const d = new Date(y, mo, day, 10);
    if (d < now) d.setFullYear(y + 1);
    return d.toISOString();
  }
  const d = new Date(now); d.setDate(d.getDate() + 7);
  return d.toISOString();
}

// ---------- Intent matchers ----------
export async function parseIntent(text: string, viewer: OwnerId): Promise<Draft> {
  const raw = text.trim();
  const lower = raw.toLowerCase();
  if (!raw) return { kind: "unknown", transcript: "", hint: "Say what you want to add." };

  // 1. Read-queries ------------------------------------------------------
  if (/how much|what.*owe|balance/i.test(lower)) {
    return handleQuery(raw, viewer);
  }

  // 2. Hidden gift (before wishlist / expense) ---------------------------
  if (/(gift|present|surprise)/.test(lower) && /hide|hidden|don'?t (tell|let)/.test(lower)) {
    const amount = parseAmount(raw) ?? 0;
    const partner = viewer === "aarav" ? "meera" : "aarav";
    return {
      kind: "expense",
      amount,
      merchant: extractGiftMerchant(raw),
      categoryId: "cat_gift",
      categoryName: "Gifts",
      emoji: "🎁",
      owner: "me",
      splitLabel: "You paid — hidden",
      hidden: true,
      hiddenReason: `${titleCase(partner)} won't see this until you unhide it.`,
    };
  }

  // 3. Wishlist ("<name> wants …") ---------------------------------------
  const wl = raw.match(/^(meera|aarav|i|we)\s+want[s]?\s+(?:a |an |some )?(.+)$/i);
  if (wl) {
    const who = wl[1].toLowerCase();
    const rest = wl[2];
    const price = parseAmount(rest) ?? undefined;
    const title = rest
      .replace(/(?:₹|rs\.?|inr)?\s*[\d,]+(?:\.\d+)?\s*(k|thousand)?/i, "")
      .replace(/\baround\b|\bapprox\b|\babout\b|\bfor\b/gi, "")
      .replace(/,\s*(size|colou?r)[^,]*/gi, (m) => m)
      .trim().replace(/\s{2,}/g, " ");
    const ownerId: OwnerId | "ours" =
      who === "meera" ? "meera" :
      who === "aarav" ? "aarav" :
      who === "i" ? viewer : "ours";
    const noteM = rest.match(/(size\s+[a-z0-9]+|colou?r\s+[a-z]+)/i);
    return {
      kind: "wishlist",
      title: titleCase(title || "Wishlist item"),
      ownerId,
      price,
      note: noteM?.[0],
      priority: 2,
    };
  }

  // 4. Grocery multi-add -------------------------------------------------
  const groc = raw.match(/add\s+(.+?)\s+to\s+groc/i);
  if (groc) {
    const items = splitItems(groc[1]);
    return { kind: "grocery", items };
  }

  // 5. Task --------------------------------------------------------------
  const task = raw.match(/^(?:task[:\s]+|remind me to\s+)(.+)$/i);
  if (task) {
    const rest = task[1];
    // "…, assign to me/meera/aarav"
    const asg = rest.match(/assign(?:ed)?\s+to\s+(me|you|meera|aarav|us)/i);
    let assignee: OwnerId | "ours" = viewer;
    if (asg) {
      const w = asg[1].toLowerCase();
      assignee =
        w === "meera" ? "meera" :
        w === "aarav" ? "aarav" :
        w === "us" ? "ours" :
        w === "you" ? (viewer === "aarav" ? "meera" : "aarav") : viewer;
    }
    // "remind me to" → reminder-shaped when a date is present
    if (/^remind me to/i.test(raw) && /\b(on|by|next|tomorrow|today)\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(rest)) {
      return {
        kind: "reminder",
        name: titleCase(cleanTaskTitle(rest)),
        dueDate: parseDateHint(rest),
        amount: parseAmount(rest) ?? undefined,
      };
    }
    return {
      kind: "task",
      title: titleCase(cleanTaskTitle(rest)),
      assignee,
      dueDate: /\b(on|by|next|tomorrow|today)\b|jan|feb|mar/i.test(rest) ? parseDateHint(rest) : undefined,
    };
  }

  // 6. Reminder (bill/renewal) -------------------------------------------
  if (/\brenew|\brenewal|insurance|premium|licen[cs]e|lease\b/i.test(lower)) {
    return {
      kind: "reminder",
      name: titleCase(raw.replace(/^remind me( to)?/i, "").trim()) || "Reminder",
      dueDate: parseDateHint(raw),
      amount: parseAmount(raw) ?? undefined,
    };
  }

  // 7. Date idea ---------------------------------------------------------
  if (/^(save (a )?date idea|date idea)[:\s]/i.test(raw)) {
    const title = raw.replace(/^(save (a )?date idea|date idea)[:\s]+/i, "").trim();
    return {
      kind: "date",
      title: titleCase(title || "Date idea"),
      vibe: /walk|beach|sunset|romantic|dinner/i.test(title) ? "romantic" :
            /hike|run|active|climb/i.test(title) ? "active" :
            /home|cook|movie night/i.test(title) ? "at-home" : "chill",
      price: parseAmount(title) && parseAmount(title)! > 2000 ? 3 : 1,
    };
  }

  // 8. Calendar event ----------------------------------------------------
  if (/^add\s+.+\bon\b/i.test(raw) || /\btomorrow|tonight|next\b/i.test(lower)) {
    if (!/grocer/i.test(lower)) {
      const title = raw.replace(/^add\s+/i, "").replace(/\bon\s+.+$/i, "").trim();
      return {
        kind: "event",
        title: titleCase(title || "Event"),
        date: parseDateHint(raw),
        owner: /both|us|our/i.test(lower) ? "ours" : "me",
      };
    }
  }

  // 9. Memory ------------------------------------------------------------
  if (/^(new )?memory[:\s]/i.test(raw)) {
    const title = raw.replace(/^(new )?memory[:\s]+/i, "").trim();
    return {
      kind: "memory",
      title: titleCase(title || "Memory"),
      date: new Date().toISOString(),
    };
  }

  // 10. Expense (default when we see money) ------------------------------
  const amount = parseAmount(raw);
  if (amount != null && /(spent|paid|bought|for|on|at)/i.test(lower)) {
    const cat = resolveCategory(raw);
    const shouldSplit = /\bsplit\b|\bshare\b|\btogether\b|\bwith\b/i.test(lower);
    return {
      kind: "expense",
      amount,
      merchant: parseMerchant(raw),
      categoryId: cat.id,
      categoryName: cat.name,
      emoji: cat.emoji,
      owner: shouldSplit ? "ours" : "me",
      splitLabel: shouldSplit ? "Split 50/50" : "You paid all",
    };
  }

  // Unknown --------------------------------------------------------------
  return {
    kind: "unknown",
    transcript: raw,
    hint: "Try: \"Spent 480 on coffee, split it\" or \"Add milk to groceries\".",
  };
}

function extractGiftMerchant(text: string): string {
  const m = text.match(/for\s+([A-Z][a-z]+)(?:'s)?\s+(?:birthday|anniversary|gift)/i);
  if (m) return `Gift — ${m[1]}`;
  return "Gift";
}
function cleanTaskTitle(rest: string) {
  return rest
    .replace(/,?\s*assign(?:ed)?\s+to\s+\w+/i, "")
    .replace(/\bon\s+(mon|tue|wed|thu|fri|sat|sun|tomorrow|today|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z0-9\s]*/i, "")
    .trim();
}
function splitItems(raw: string): string[] {
  return raw
    .split(/,| and /i)
    .map((s) => titleCase(s.trim()))
    .filter(Boolean);
}

// ---------- Query handler (privacy-safe) ----------
async function handleQuery(raw: string, viewer: OwnerId): Promise<QueryDraft> {
  const lower = raw.toLowerCase();

  // "what do I owe" → running balance (already viewer-scoped in service)
  if (/owe|balance|settle/.test(lower)) {
    const bal = await getRunningBalance();
    if (bal.amount === 0) {
      return { kind: "query", question: raw, answer: "You're all square 💛", detail: "No open balance." };
    }
    const partner: OwnerId = viewer === "aarav" ? "meera" : "aarav";
    const partnerName = partner === "aarav" ? "Aarav" : "Meera";
    if (bal.owedTo === viewer) {
      return { kind: "query", question: raw, answer: `${partnerName} owes you ₹${bal.amount.toLocaleString("en-IN")}` };
    }
    return { kind: "query", question: raw, answer: `You owe ${partnerName} ₹${bal.amount.toLocaleString("en-IN")}` };
  }

  // "how much on <cat> this month" — uses viewer-filtered getTransactions
  const [tx, cats] = await Promise.all([getTransactions(), getCategories()]);
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const inMonth = tx.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === y && d.getMonth() === m && !t.isIncome;
  });

  let matchedCat = cats.find((c) => lower.includes(c.name.toLowerCase()));
  if (!matchedCat) {
    for (const c of CAT_KEYWORDS) {
      if (c.words.some((w) => lower.includes(w))) {
        matchedCat = cats.find((cc) => cc.id === c.ids[0]);
        if (matchedCat) break;
      }
    }
  }

  if (matchedCat) {
    const spent = inMonth
      .filter((t) => t.categoryId === matchedCat!.id)
      .reduce((s, t) => s + t.amount, 0);
    const share = matchedCat.budget
      ? `${Math.round((spent / matchedCat.budget) * 100)}% of ₹${matchedCat.budget.toLocaleString("en-IN")} budget`
      : "no budget set";
    return {
      kind: "query",
      question: raw,
      answer: `${matchedCat.emoji} ₹${spent.toLocaleString("en-IN")} on ${matchedCat.name} this month`,
      detail: share,
    };
  }

  const total = inMonth.reduce((s, t) => s + t.amount, 0);
  return {
    kind: "query",
    question: raw,
    answer: `₹${total.toLocaleString("en-IN")} spent this month`,
    detail: "Ask about a category, e.g. \"dining\" or \"groceries\".",
  };
}

// ---------- Wishlist claim visibility (agent-only helper) ----------
// If someone voice-adds to a partner's wishlist, we still route through the
// same service, which already strips claim info for the list owner viewer.
export async function wishlistOwnerVisibleTo(viewer: OwnerId, ownerId: OwnerId | "ours") {
  void viewer;
  const wl = await getWishlist();
  return wl.some((w) => w.ownerId === ownerId);
}
