// Mock service layer — every UI call goes through here. Later this will be
// swapped for Supabase without touching components.

import * as seed from "./mockData";
import type {
  Bill, CalendarEvent, CheckIn, DailyQuestion, DateIdea, Gift, Goal,
  GoalContribution, GratitudeNote, Insight, ListDoc, ListItem, Memory,
  Occasion, OwnerId, Recipe, Task, Transaction, Trip, TripItem, WishlistItem,
} from "./types";

const DELAY = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY));
}

// In-memory store (mutable copies)
const store = {
  profiles: [...seed.profiles],
  couple: { ...seed.couple },
  accounts: [...seed.accounts],
  categories: [...seed.categories],
  transactions: [...seed.transactions],
  bills: [...seed.bills],
  goals: [...seed.goals],
  goalContributions: [...seed.goalContributions],
  wishlist: [...seed.wishlist],
  occasions: [...seed.occasions],
  gifts: [...seed.gifts],
  events: [...seed.events],
  dateIdeas: [...seed.dateIdeas],
  trips: [...seed.trips],
  tripItems: [...seed.tripItems],
  tasks: [...seed.tasks],
  lists: [...seed.lists],
  listItems: [...seed.listItems],
  recipes: [...seed.recipes],
  memories: [...seed.memories],
  gratitudeNotes: [...seed.gratitudeNotes],
  dailyQuestion: { ...seed.dailyQuestion },
  checkIns: [...seed.checkIns],
  insights: [...seed.insights],
  brief: [...seed.brief],
  runningBalance: { ...seed.runningBalance },
  monthBudget: { ...seed.monthBudget },
};

// -------- Reads --------
export const getProfiles       = () => delay(store.profiles);
export const getCouple         = () => delay(store.couple);
export const getAccounts       = () => delay(store.accounts);
export const getCategories     = () => delay(store.categories);
export const getTransactions   = () => delay(store.transactions);
export const getBills          = () => delay(store.bills);
export const getGoals          = () => delay(store.goals);
export const getGoalContributions = () => delay(store.goalContributions);
export const getWishlist       = () => delay(store.wishlist);
export const getOccasions      = () => delay(store.occasions);
export const getGifts          = () => delay(store.gifts);
export const getEvents         = () => delay(store.events);
export const getDateIdeas      = () => delay(store.dateIdeas);
export const getTrips          = () => delay(store.trips);
export const getTripItems      = () => delay(store.tripItems);
export const getTasks          = () => delay(store.tasks);
export const getLists          = () => delay(store.lists);
export const getListItems      = () => delay(store.listItems);
export const getRecipes        = () => delay(store.recipes);
export const getMemories       = () => delay(store.memories);
export const getGratitudeNotes = () => delay(store.gratitudeNotes);
export const getDailyQuestion  = () => delay(store.dailyQuestion);
export const getCheckIns       = () => delay(store.checkIns);
export const getInsights       = () => delay(store.insights);
export const getBrief          = () => delay(store.brief);
export const getRunningBalance = () => delay(store.runningBalance);
export const getMonthBudget    = () => delay(store.monthBudget);

// -------- Writes (minimal for v1 scaffolding) --------
export async function addTransaction(tx: Omit<Transaction, "id">) {
  const record: Transaction = { ...tx, id: `tx_${Date.now()}` };
  store.transactions = [record, ...store.transactions];
  return delay(record);
}

export async function toggleListItem(id: string) {
  store.listItems = store.listItems.map((li) =>
    li.id === id ? { ...li, done: !li.done } : li,
  );
  return delay(true);
}

export async function toggleTask(id: string) {
  store.tasks = store.tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t,
  );
  return delay(true);
}

export async function addWishlistItem(item: Omit<WishlistItem, "id">) {
  const record: WishlistItem = { ...item, id: `w_${Date.now()}` };
  store.wishlist = [record, ...store.wishlist];
  return delay(record);
}

export async function claimWishlistItem(id: string, by: OwnerId) {
  store.wishlist = store.wishlist.map((w) =>
    w.id === id ? { ...w, claimedBy: by } : w,
  );
  return delay(true);
}

// Re-export a few utility types for convenience
export type {
  Bill, CalendarEvent, CheckIn, DailyQuestion, DateIdea, Gift, Goal,
  GoalContribution, GratitudeNote, Insight, ListDoc, ListItem, Memory,
  Occasion, Recipe, Task, Transaction, Trip, TripItem, WishlistItem,
};
