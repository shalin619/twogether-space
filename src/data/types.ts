// Twogether domain types (v1 — mock; mirrors future Supabase schema)

export type OwnerId = "aarav" | "meera";
export type Ownership = "me" | "partner" | "ours";
export type Privacy = "private" | "visible" | "shared";

export interface Profile {
  id: OwnerId;
  name: string;
  role: string;
  city: string;
  color: string;
  avatarEmoji: string;
}

export interface Couple {
  id: string;
  partners: [OwnerId, OwnerId];
  startedAt: string;      // ISO
  anniversary: string;    // ISO (wedding)
  currency: "INR";
  splitRatio: { aarav: number; meera: number };
}

export interface Account {
  id: string;
  owner: Ownership;
  ownerId?: OwnerId;
  name: string;
  bank: string;
  balance: number;
  kind: "bank" | "credit";
}

export interface Split {
  ownerId: OwnerId;
  amount: number;
}

export interface Transaction {
  id: string;
  date: string;             // ISO
  merchant: string;
  categoryId: string;
  amount: number;           // positive = expense
  accountId: string;
  paidBy: OwnerId;
  owner: Ownership;
  splits?: Split[];
  note?: string;
  isGiftHidden?: boolean;   // hidden from partner (gift locker)
  hiddenFrom?: OwnerId;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  budget?: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  payer: OwnerId | "joint";
  autopay: boolean;
  categoryId?: string;
}

export interface Goal {
  id: string;
  emoji: string;
  name: string;
  target: number;
  saved: number;
  targetDate?: string;
  linkedTripId?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  ownerId: OwnerId;
  amount: number;
  date: string;
}

export interface WishlistItem {
  id: string;
  ownerId: OwnerId | "ours";
  title: string;
  priority: 1 | 2 | 3;
  price?: number;
  note?: string;
  url?: string;
  claimedBy?: OwnerId;      // hidden from ownerId
  privacy: Privacy;
}

export interface Occasion {
  id: string;
  name: string;
  date: string;
  forWho: string;
  budget?: number;
  lastGift?: { name: string; price: number; rating: number };
}

export interface Gift {
  id: string;
  occasionId?: string;
  wishlistItemId?: string;
  title: string;
  price: number;
  from: OwnerId;
  to: OwnerId | "family";
  status: "idea" | "locked" | "purchased" | "given";
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;             // ISO datetime
  endDate?: string;
  owner: Ownership;
  location?: string;
  surprise?: boolean;
  countdown?: boolean;
  emoji?: string;
}

export interface DateIdea {
  id: string;
  title: string;
  vibe: "chill" | "active" | "romantic" | "at-home";
  price: 1 | 2 | 3;
  location?: string;
  source?: string;
  done?: boolean;
}

export interface Trip {
  id: string;
  destination: string;
  emoji: string;
  startDate: string;
  endDate: string;
  status: "planning" | "booked" | "past";
  budget: number;
  linkedGoalId?: string;
}

export interface TripItem {
  id: string;
  tripId: string;
  kind: "flight" | "stay" | "activity" | "packing";
  title: string;
  done?: boolean;
}

export interface Task {
  id: string;
  title: string;
  assignee: OwnerId | "rotating";
  dueDate?: string;
  done?: boolean;
  rotation?: OwnerId;
}

export interface ListDoc {
  id: string;
  name: string;
  emoji: string;
  kind: "grocery" | "todo" | "custom";
}

export interface ListItem {
  id: string;
  listId: string;
  title: string;
  done?: boolean;
  favorite?: boolean;
  qty?: string;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  minutes: number;
  tags: string[];
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  photo: string;
  note?: string;
  location?: string;
}

export interface GratitudeNote {
  id: string;
  from: OwnerId;
  to: OwnerId;
  text: string;
  date: string;
  read?: boolean;
}

export interface DailyQuestion {
  id: string;
  date: string;
  question: string;
  answers: Partial<Record<OwnerId, string>>;
}

export interface CheckIn {
  id: string;
  date: string;
  ownerId: OwnerId;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

export interface Insight {
  id: string;
  kind: "spend" | "save" | "relationship" | "subscription";
  title: string;
  body: string;
  tone: "info" | "caution" | "celebrate";
}

export interface BriefCard {
  id: string;
  title: string;
  body: string;
  emoji: string;
}
