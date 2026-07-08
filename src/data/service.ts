// Mock service layer — every UI call goes through here. Later this will be
// swapped for Supabase without touching components.
//
// Privacy filtering happens here (mirrors Supabase RLS):
//   - getTransactions hides isGiftHidden rows whose ownerId !== viewer
//   - getWishlist strips claim info from items whose list owner IS the viewer
//   - getEvents replaces surprise event title with teaser for non-creators

import * as seed from "./mockData";
import type {
  Bill, CalendarEvent, CheckIn, DailyQuestion, DateIdea, Gift, Goal,
  GoalContribution, GratitudeNote, Insight, ListDoc, ListItem, MealPlanEntry,
  Memory, Occasion, OwnerId, Recipe, Settlement, Task, Transaction, Trip,
  TripItem, TxComment, WishlistItem,
} from "./types";

const DELAY = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY));
}

// ---------- Viewer (mirrors auth.uid()) ----------
let viewer: OwnerId = "aarav";
export function setViewer(id: OwnerId) { viewer = id; }
export function getViewer(): OwnerId { return viewer; }

// ---------- In-memory store ----------
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
  dateStats: { ...seed.dateStats },
  trips: [...seed.trips],
  tripItems: [...seed.tripItems],
  tasks: [...seed.tasks],
  lists: [...seed.lists],
  listItems: [...seed.listItems],
  recipes: [...seed.recipes],
  mealPlan: [...seed.mealPlan],
  memories: [...seed.memories],
  gratitudeNotes: [...seed.gratitudeNotes],
  dailyQuestion: { ...seed.dailyQuestion },
  dailyQuestionHistory: [...seed.dailyQuestionHistory],
  checkIns: [...seed.checkIns],
  insights: [...seed.insights],
  brief: [...seed.brief],
  runningBalance: { ...seed.runningBalance },
  monthBudget: { ...seed.monthBudget },
  settlements: [...seed.settlements],
};

// ---------- Reads (privacy-aware) ----------
export const getProfiles       = () => delay(store.profiles);
export const getCouple         = () => delay(store.couple);
export const getAccounts       = () => delay(store.accounts);
export const getCategories     = () => delay(store.categories);

export const getTransactions = () =>
  delay(
    store.transactions.filter((t) => {
      if (!t.isGiftHidden) return true;
      // Only the creator sees a hidden gift transaction
      return (t.ownerId ?? t.paidBy) === viewer;
    }),
  );

export const getBills             = () => delay(store.bills);
export const getGoals             = () => delay(store.goals);
export const getGoalContributions = () => delay(store.goalContributions);

export const getWishlist = () =>
  delay(
    store.wishlist.map((w) => {
      // If the viewer IS the list owner, hide claim info (surprise!).
      if (w.ownerId === viewer) {
        const { claimedBy: _c, claimedForOccasionId: _o, ...rest } = w;
        void _c; void _o;
        return rest as WishlistItem;
      }
      return w;
    }),
  );

export const getOccasions = () => delay(store.occasions);
export const getGifts     = () => delay(store.gifts);

export const getEvents = () =>
  delay(
    store.events.map((e) => {
      if (e.surprise && e.createdBy && e.createdBy !== viewer) {
        return { ...e, title: e.teaser ?? "Surprise 🎁", location: undefined, emoji: "📦" };
      }
      return e;
    }),
  );

export const getDateIdeas            = () => delay(store.dateIdeas);
export const getDateStats            = () => delay(store.dateStats);
export const getTrips                = () => delay(store.trips);
export const getTripItems            = () => delay(store.tripItems);
export const getTasks                = () => delay(store.tasks);
export const getLists                = () => delay(store.lists);
export const getListItems            = () => delay(store.listItems);
export const getRecipes              = () => delay(store.recipes);
export const getMealPlan             = () => delay(store.mealPlan);
export const getMemories             = () => delay(store.memories);
export const getGratitudeNotes       = () => delay(store.gratitudeNotes);
export const getDailyQuestion        = () => delay(store.dailyQuestion);
export const getDailyQuestionHistory = () => delay(store.dailyQuestionHistory);
export const getCheckIns             = () => delay(store.checkIns);
export const getInsights             = () => delay(store.insights.filter((i) => !i.dismissed));
export const getBrief                = () => delay(store.brief);
export const getRunningBalance       = () => delay(store.runningBalance);
export const getMonthBudget          = () => delay(store.monthBudget);
export const getSettlements          = () => delay(store.settlements);

// ---------- Writes: transactions ----------
export async function addTransaction(tx: Omit<Transaction, "id">) {
  const record: Transaction = { ...tx, id: `tx_${Date.now()}` };
  store.transactions = [record, ...store.transactions];
  return delay(record);
}

export async function updateTransaction(id: string, patch: Partial<Transaction>) {
  store.transactions = store.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t));
  return delay(true);
}

export async function deleteTransaction(id: string) {
  store.transactions = store.transactions.filter((t) => t.id !== id);
  return delay(true);
}

export async function addComment(txId: string, byUserId: OwnerId, text: string) {
  const comment: TxComment = {
    id: `cm_${Date.now()}`, by: byUserId, text, date: new Date().toISOString(),
  };
  store.transactions = store.transactions.map((t) =>
    t.id === txId ? { ...t, comments: [...(t.comments ?? []), comment] } : t,
  );
  return delay(comment);
}

// ---------- Writes: settle-up ----------
export async function settleUp(amount: number, method = "UPI") {
  const bal = store.runningBalance;
  const settlement: Settlement = {
    id: `s_${Date.now()}`,
    date: new Date().toISOString(),
    from: bal.owedTo === "aarav" ? "meera" : "aarav",
    to: bal.owedTo,
    amount,
    method,
  };
  store.settlements = [settlement, ...store.settlements];
  store.runningBalance = { ...bal, amount: 0 };
  return delay(settlement);
}

// ---------- Writes: bills ----------
export async function addBill(bill: Omit<Bill, "id">) {
  const record: Bill = { ...bill, id: `b_${Date.now()}` };
  store.bills = [record, ...store.bills];
  return delay(record);
}
export async function toggleBillPaid(id: string) {
  store.bills = store.bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b));
  return delay(true);
}

// ---------- Writes: goals ----------
export async function addGoal(goal: Omit<Goal, "id" | "saved">) {
  const record: Goal = { ...goal, id: `g_${Date.now()}`, saved: 0 };
  store.goals = [...store.goals, record];
  return delay(record);
}

export async function addGoalContribution(goalId: string, byUserId: OwnerId, amount: number) {
  const record: GoalContribution = {
    id: `gc_${Date.now()}`, goalId, ownerId: byUserId, amount, date: new Date().toISOString(),
  };
  store.goalContributions = [record, ...store.goalContributions];
  store.goals = store.goals.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g));
  return delay(record);
}

// ---------- Writes: wishlist ----------
export async function addWishlistItem(item: Omit<WishlistItem, "id">) {
  const record: WishlistItem = { ...item, id: `w_${Date.now()}` };
  store.wishlist = [record, ...store.wishlist];
  return delay(record);
}

export async function updateWishlistItem(id: string, patch: Partial<WishlistItem>) {
  store.wishlist = store.wishlist.map((w) => (w.id === id ? { ...w, ...patch } : w));
  return delay(true);
}

export async function claimWishlistItem(id: string, by: OwnerId, forOccasionId?: string) {
  store.wishlist = store.wishlist.map((w) =>
    w.id === id ? { ...w, claimedBy: by, claimedForOccasionId: forOccasionId } : w,
  );
  return delay(true);
}

export async function unclaimWishlistItem(id: string) {
  store.wishlist = store.wishlist.map((w) => {
    if (w.id !== id) return w;
    const { claimedBy: _c, claimedForOccasionId: _o, ...rest } = w;
    void _c; void _o;
    return rest as WishlistItem;
  });
  return delay(true);
}

export async function markGiftPurchased(itemId: string) {
  const item = store.wishlist.find((w) => w.id === itemId);
  if (!item || !item.claimedBy) return delay(false);

  // create a hidden transaction for the buyer
  const tx: Transaction = {
    id: `tx_${Date.now()}`,
    date: new Date().toISOString(),
    merchant: `Gift — ${item.title}`,
    categoryId: "cat_gift",
    amount: item.price ?? 0,
    accountId: item.claimedBy === "aarav" ? "acc_a_hdfc" : "acc_m_icici",
    paidBy: item.claimedBy,
    owner: "me",
    ownerId: item.claimedBy,
    isGiftHidden: true,
    hiddenFrom: item.claimedBy === "aarav" ? "meera" : "aarav",
    note: `Purchased from ${item.ownerId}'s wishlist`,
  };
  store.transactions = [tx, ...store.transactions];

  store.gifts = [
    ...store.gifts,
    {
      id: `gift_${Date.now()}`, wishlistItemId: item.id,
      occasionId: item.claimedForOccasionId,
      title: item.title, price: item.price ?? 0,
      from: item.claimedBy, to: (item.ownerId === "ours" ? "meera" : item.ownerId) as OwnerId,
      status: "purchased", date: tx.date,
    },
  ];
  return delay(tx);
}

// ---------- Writes: occasions & gifts ----------
export async function addOccasion(o: Omit<Occasion, "id">) {
  const record: Occasion = { ...o, id: `o_${Date.now()}` };
  store.occasions = [...store.occasions, record];
  return delay(record);
}

export async function addGiftToVault(g: Omit<Gift, "id">) {
  const record: Gift = { ...g, id: `gift_${Date.now()}` };
  store.gifts = [record, ...store.gifts];
  return delay(record);
}

// ---------- Writes: events ----------
export async function addEvent(e: Omit<CalendarEvent, "id">) {
  const record: CalendarEvent = { ...e, id: `e_${Date.now()}` };
  store.events = [record, ...store.events];
  return delay(record);
}
export async function updateEvent(id: string, patch: Partial<CalendarEvent>) {
  store.events = store.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
  return delay(true);
}

// ---------- Writes: date ideas ----------
export async function addDateIdea(d: Omit<DateIdea, "id">) {
  const record: DateIdea = { ...d, id: `di_${Date.now()}` };
  store.dateIdeas = [record, ...store.dateIdeas];
  return delay(record);
}
export async function markIdeaDone(id: string) {
  const idea = store.dateIdeas.find((d) => d.id === id);
  store.dateIdeas = store.dateIdeas.map((d) => (d.id === id ? { ...d, done: true } : d));
  if (idea) {
    store.dateStats = {
      ...store.dateStats,
      lastDate: { date: new Date().toISOString(), title: idea.title },
      streak: store.dateStats.streak + 1,
    };
  }
  return delay(true);
}

// ---------- Writes: trips ----------
export async function addTrip(t: Omit<Trip, "id">) {
  const record: Trip = { ...t, id: `trip_${Date.now()}` };
  store.trips = [...store.trips, record];
  return delay(record);
}
export async function addTripItem(t: Omit<TripItem, "id">) {
  const record: TripItem = { ...t, id: `ti_${Date.now()}` };
  store.tripItems = [...store.tripItems, record];
  return delay(record);
}
export async function togglePackingItem(id: string) {
  store.tripItems = store.tripItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
  return delay(true);
}

// ---------- Writes: tasks ----------
export async function addTask(t: Omit<Task, "id">) {
  const record: Task = { ...t, id: `t_${Date.now()}` };
  store.tasks = [record, ...store.tasks];
  return delay(record);
}
export async function toggleTask(id: string) {
  store.tasks = store.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  return delay(true);
}

// ---------- Writes: lists ----------
export async function addList(l: Omit<ListDoc, "id">) {
  const record: ListDoc = { ...l, id: `l_${Date.now()}` };
  store.lists = [...store.lists, record];
  return delay(record);
}
export async function addListItem(i: Omit<ListItem, "id">) {
  const record: ListItem = { ...i, id: `li_${Date.now()}` };
  store.listItems = [record, ...store.listItems];
  return delay(record);
}
export async function toggleListItem(id: string) {
  store.listItems = store.listItems.map((li) =>
    li.id === id ? { ...li, done: !li.done } : li,
  );
  return delay(true);
}
export async function deleteListItem(id: string) {
  store.listItems = store.listItems.filter((li) => li.id !== id);
  return delay(true);
}

// ---------- Writes: recipes / meal plan ----------
export async function addRecipe(r: Omit<Recipe, "id">) {
  const record: Recipe = { ...r, id: `r_${Date.now()}` };
  store.recipes = [record, ...store.recipes];
  return delay(record);
}
export async function addMealPlanEntry(e: Omit<MealPlanEntry, "id">) {
  const record: MealPlanEntry = { ...e, id: `mp_${Date.now()}` };
  store.mealPlan = [...store.mealPlan, record];
  return delay(record);
}

// ---------- Writes: memories ----------
export async function addMemory(m: Omit<Memory, "id">) {
  const record: Memory = { ...m, id: `m_${Date.now()}` };
  store.memories = [record, ...store.memories];
  return delay(record);
}
export async function updateMemoryNote(id: string, byUserId: OwnerId, text: string) {
  const key = byUserId === "aarav" ? "privateNoteAarav" : "privateNoteMeera";
  store.memories = store.memories.map((m) =>
    m.id === id ? { ...m, [key]: text } : m,
  );
  return delay(true);
}


// ---------- Writes: relationship ----------
export async function sendGratitude(byUserId: OwnerId, text: string) {
  const record: GratitudeNote = {
    id: `gn_${Date.now()}`,
    from: byUserId,
    to: byUserId === "aarav" ? "meera" : "aarav",
    text,
    date: new Date().toISOString(),
    read: false,
  };
  store.gratitudeNotes = [record, ...store.gratitudeNotes];
  return delay(record);
}
export async function markGratitudeRead(id: string) {
  store.gratitudeNotes = store.gratitudeNotes.map((g) =>
    g.id === id ? { ...g, read: true } : g,
  );
  return delay(true);
}
export async function answerDailyQuestion(byUserId: OwnerId, text: string) {
  store.dailyQuestion = {
    ...store.dailyQuestion,
    answers: { ...store.dailyQuestion.answers, [byUserId]: text },
  };
  return delay(store.dailyQuestion);
}
export async function saveCheckIn(c: Omit<CheckIn, "id">) {
  const record: CheckIn = { ...c, id: `ci_${Date.now()}` };
  store.checkIns = [record, ...store.checkIns];
  return delay(record);
}
export async function dismissInsight(id: string) {
  store.insights = store.insights.map((i) =>
    i.id === id ? { ...i, dismissed: true } : i,
  );
  return delay(true);
}

// Re-export types
export type {
  Bill, CalendarEvent, CheckIn, DailyQuestion, DateIdea, Gift, Goal,
  GoalContribution, GratitudeNote, Insight, ListDoc, ListItem, MealPlanEntry,
  Memory, Occasion, Recipe, Settlement, Task, Transaction, Trip, TripItem,
  WishlistItem,
};
