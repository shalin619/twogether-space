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
  age?: number;
}

export interface Couple {
  id: string;
  partners: [OwnerId, OwnerId];
  startedAt: string;
  anniversary: string;
  currency: "INR";
  splitRatio: { aarav: number; meera: number };
  moneyStyle?: "yours-mine-ours" | "one-pot" | "hybrid";
  lifeStage?: string;
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

export interface TxComment {
  id: string;
  by: OwnerId;
  text: string;
  date: string;
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  categoryId: string;
  amount: number;
  accountId: string;
  paidBy: OwnerId;
  owner: Ownership;
  splits?: Split[];
  note?: string;
  isGiftHidden?: boolean;
  hiddenFrom?: OwnerId;
  ownerId?: OwnerId;          // creator of the row (used for hidden filtering)
  revealDate?: string;        // when hidden tx unhides
  comments?: TxComment[];
  isIncome?: boolean;
  isSettlement?: boolean;
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
  payer: OwnerId | "joint" | "alternate";
  autopay: boolean;
  categoryId?: string;
  paid?: boolean;
  repeat?: "monthly" | "yearly" | "weekly" | "none";
  note?: string;
}

export interface Goal {
  id: string;
  emoji: string;
  name: string;
  target: number;
  saved: number;
  targetDate?: string;
  linkedTripId?: string;
  privacy?: Privacy;
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
  image?: string;
  claimedBy?: OwnerId;
  claimedForOccasionId?: string;
  privacy: Privacy;
  generic?: boolean;
}

export interface Occasion {
  id: string;
  name: string;
  date: string;
  forWho: string;
  budget?: number;
  lastGift?: { name: string; price: number; rating: number };
  emoji?: string;
  giftIdeas?: string[];
}

export interface Gift {
  id: string;
  occasionId?: string;
  wishlistItemId?: string;
  title: string;
  price: number;
  from: OwnerId;
  to: OwnerId | "family" | "friends";
  status: "idea" | "locked" | "purchased" | "given";
  date?: string;
  rating?: number;
  recipient?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  owner: Ownership;
  location?: string;
  surprise?: boolean;
  countdown?: boolean;
  emoji?: string;
  teaser?: string;
  createdBy?: OwnerId;
  note?: string;
}

export interface DateIdea {
  id: string;
  title: string;
  vibe: "chill" | "active" | "romantic" | "at-home";
  price: 1 | 2 | 3;
  location?: string;
  source?: string;
  done?: boolean;
  image?: string;
  tags?: string[];
}

export interface Trip {
  id: string;
  destination: string;
  emoji: string;
  startDate: string;
  endDate: string;
  status: "planning" | "booked" | "past" | "dream";
  budget: number;
  spent?: number;
  linkedGoalId?: string;
  image?: string;
}

export interface TripItem {
  id: string;
  tripId: string;
  kind: "flight" | "stay" | "activity" | "packing" | "doc";
  title: string;
  done?: boolean;
  assignee?: OwnerId;
  price?: number;
  status?: "idea" | "booked" | "paid";
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: OwnerId | "rotating" | "ours";
  dueDate?: string;
  done?: boolean;
  rotation?: OwnerId;
  status?: "todo" | "waiting" | "done";
  recurring?: "monthly" | "yearly" | "quarterly";
}

export interface ListDoc {
  id: string;
  name: string;
  emoji: string;
  kind: "grocery" | "todo" | "custom" | "movies";
}

export interface ListItem {
  id: string;
  listId: string;
  title: string;
  done?: boolean;
  favorite?: boolean;
  qty?: string;
  aisle?: string;
  addedBy?: OwnerId;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  minutes: number;
  tags: string[];
  image?: string;
  ingredients?: string[];
}

export interface MealPlanEntry {
  id: string;
  date: string;
  recipeId: string;
  meal: "breakfast" | "lunch" | "dinner";
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  photo: string;
  note?: string;
  location?: string;
  milestone?: boolean;
  privateNoteAarav?: string;
  privateNoteMeera?: string;
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
  usScore?: 1 | 2 | 3 | 4 | 5;
  energy?: 1 | 2 | 3 | 4 | 5;
  highlight?: string;
  need?: string;
  note?: string;
}


export interface Insight {
  id: string;
  kind: "spend" | "save" | "relationship" | "subscription";
  title: string;
  body: string;
  tone: "info" | "caution" | "celebrate";
  savings?: number;
  dismissed?: boolean;
}

export interface BriefCard {
  id: string;
  title: string;
  body: string;
  emoji: string;
}

export interface Settlement {
  id: string;
  date: string;
  from: OwnerId;
  to: OwnerId;
  amount: number;
  method?: string;
}
