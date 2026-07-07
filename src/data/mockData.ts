import type {
  Account, Bill, BriefCard, Category, CheckIn, Couple, DailyQuestion,
  DateIdea, CalendarEvent, Gift, Goal, GoalContribution, GratitudeNote,
  Insight, ListDoc, ListItem, Memory, Occasion, Profile, Recipe, Task,
  Transaction, Trip, TripItem, WishlistItem,
} from "./types";

// ---------- People ----------
export const profiles: Profile[] = [
  { id: "aarav", name: "Aarav", role: "Product Manager", city: "Mumbai", color: "#E2725B", avatarEmoji: "🧑🏽" },
  { id: "meera", name: "Meera", role: "Architect",       city: "Mumbai", color: "#4E8D7C", avatarEmoji: "👩🏽" },
];

export const couple: Couple = {
  id: "us",
  partners: ["aarav", "meera"],
  startedAt: "2023-02-14",
  anniversary: "2025-12-09",
  currency: "INR",
  splitRatio: { aarav: 55, meera: 45 },
};

// ---------- Money ----------
export const accounts: Account[] = [
  { id: "acc_a_hdfc",  owner: "me",      ownerId: "aarav", name: "HDFC Savings",  bank: "HDFC",   balance: 86400,  kind: "bank" },
  { id: "acc_m_icici", owner: "partner", ownerId: "meera", name: "ICICI Savings", bank: "ICICI",  balance: 112750, kind: "bank" },
  { id: "acc_joint",   owner: "ours",                       name: "Joint",         bank: "Kotak",  balance: 204000, kind: "bank" },
  { id: "acc_a_cc",    owner: "me",      ownerId: "aarav", name: "Credit Card",   bank: "HDFC",   balance: -12480, kind: "credit" },
];

export const categories: Category[] = [
  { id: "cat_rent",    name: "Rent",        emoji: "🏠", budget: 32000 },
  { id: "cat_groc",    name: "Groceries",   emoji: "🛒", budget: 9000 },
  { id: "cat_dining",  name: "Dining",      emoji: "🍽️", budget: 4000 },
  { id: "cat_dates",   name: "Date Nights", emoji: "💞", budget: 4000 },
  { id: "cat_food",    name: "Zomato",      emoji: "🥡", budget: 2500 },
  { id: "cat_util",    name: "Utilities",   emoji: "💡", budget: 4000 },
  { id: "cat_sub",     name: "Subscriptions", emoji: "🎬", budget: 2000 },
  { id: "cat_travel",  name: "Travel",      emoji: "✈️" },
  { id: "cat_gift",    name: "Gifts",       emoji: "🎁" },
  { id: "cat_health",  name: "Health",      emoji: "🌿" },
];

// Generate ~40 transactions over 6 weeks
const today = new Date();
function daysAgo(n: number, h = 12, m = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const transactions: Transaction[] = [
  { id: "tx1",  date: daysAgo(1,  9, 20), merchant: "BigBasket",        categoryId: "cat_groc",   amount: 1840, accountId: "acc_joint",   paidBy: "meera", owner: "ours" },
  { id: "tx2",  date: daysAgo(1, 21, 10), merchant: "Bombay Canteen",    categoryId: "cat_dining", amount: 3240, accountId: "acc_a_cc",    paidBy: "aarav", owner: "ours", splits: [{ownerId:"aarav", amount:1620},{ownerId:"meera", amount:1620}] },
  { id: "tx3",  date: daysAgo(2, 11,  0), merchant: "Blue Tokai",       categoryId: "cat_dining", amount: 620,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx4",  date: daysAgo(2, 19, 30), merchant: "Zomato",           categoryId: "cat_food",   amount: 540,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx5",  date: daysAgo(3, 15,  0), merchant: "Pottery Barn Studio", categoryId: "cat_gift", amount: 1600, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me", isGiftHidden: true, hiddenFrom: "meera", note: "Meera's b-day gift 🎁" },
  { id: "tx6",  date: daysAgo(3, 20,  0), merchant: "Netflix",          categoryId: "cat_sub",    amount: 649,  accountId: "acc_joint",   paidBy: "aarav", owner: "ours" },
  { id: "tx7",  date: daysAgo(4, 10,  0), merchant: "Nature's Basket",   categoryId: "cat_groc",   amount: 2140, accountId: "acc_joint",   paidBy: "meera", owner: "ours" },
  { id: "tx8",  date: daysAgo(4, 22,  0), merchant: "Prithvi Cafe",     categoryId: "cat_dates",  amount: 890,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "ours" },
  { id: "tx9",  date: daysAgo(5, 13,  0), merchant: "Zomato",           categoryId: "cat_food",   amount: 720,  accountId: "acc_a_cc",    paidBy: "aarav", owner: "me" },
  { id: "tx10", date: daysAgo(6, 10,  0), merchant: "Uber",             categoryId: "cat_travel", amount: 380,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx11", date: daysAgo(7, 21,  0), merchant: "Soam",             categoryId: "cat_dining", amount: 1420, accountId: "acc_joint",   paidBy: "aarav", owner: "ours" },
  { id: "tx12", date: daysAgo(8, 11,  0), merchant: "Amazon",           categoryId: "cat_sub",    amount: 199,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx13", date: daysAgo(9,  8,  0), merchant: "BigBasket",        categoryId: "cat_groc",   amount: 1620, accountId: "acc_joint",   paidBy: "meera", owner: "ours" },
  { id: "tx14", date: daysAgo(10,19,  0), merchant: "Bandra Cafe",      categoryId: "cat_dates",  amount: 1260, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "ours" },
  { id: "tx15", date: daysAgo(11,10,  0), merchant: "Spotify Premium",  categoryId: "cat_sub",    amount: 119,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx16", date: daysAgo(11,10,  1), merchant: "Spotify Premium",  categoryId: "cat_sub",    amount: 119,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx17", date: daysAgo(12, 9,  0), merchant: "Rent — May",       categoryId: "cat_rent",   amount: 32000,accountId: "acc_joint",   paidBy: "aarav", owner: "ours", splits: [{ownerId:"aarav", amount:17600},{ownerId:"meera", amount:14400}] },
  { id: "tx18", date: daysAgo(13,20,  0), merchant: "Bastian",          categoryId: "cat_dining", amount: 2680, accountId: "acc_a_cc",    paidBy: "aarav", owner: "ours" },
  { id: "tx19", date: daysAgo(14,10,  0), merchant: "Chemist",          categoryId: "cat_health", amount: 420,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx20", date: daysAgo(15,12,  0), merchant: "BigBasket",        categoryId: "cat_groc",   amount: 1240, accountId: "acc_joint",   paidBy: "meera", owner: "ours" },
  { id: "tx21", date: daysAgo(16,18,  0), merchant: "Cinepolis",        categoryId: "cat_dates",  amount: 900,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "ours" },
  { id: "tx22", date: daysAgo(17,10,  0), merchant: "Ola",              categoryId: "cat_travel", amount: 260,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx23", date: daysAgo(18,20,  0), merchant: "Swiggy",           categoryId: "cat_food",   amount: 630,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx24", date: daysAgo(19,10,  0), merchant: "Juhu Chaat",       categoryId: "cat_dates",  amount: 340,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "ours", note: "Beach walk 🌊" },
  { id: "tx25", date: daysAgo(20,14,  0), merchant: "Electricity Bill", categoryId: "cat_util",   amount: 2280, accountId: "acc_joint",   paidBy: "aarav", owner: "ours" },
  { id: "tx26", date: daysAgo(21, 9,  0), merchant: "Grofers",          categoryId: "cat_groc",   amount: 980,  accountId: "acc_joint",   paidBy: "meera", owner: "ours" },
  { id: "tx27", date: daysAgo(23,10,  0), merchant: "Bookshop",         categoryId: "cat_gift",   amount: 780,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx28", date: daysAgo(24,13,  0), merchant: "Coffee Beans",     categoryId: "cat_groc",   amount: 420,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx29", date: daysAgo(26,20,  0), merchant: "Indigo Deli",      categoryId: "cat_dining", amount: 1980, accountId: "acc_joint",   paidBy: "aarav", owner: "ours" },
  { id: "tx30", date: daysAgo(28,10,  0), merchant: "Wifi — ACT",       categoryId: "cat_util",   amount: 1199, accountId: "acc_m_icici", paidBy: "meera", owner: "ours" },
  { id: "tx31", date: daysAgo(29,10,  0), merchant: "Netflix",          categoryId: "cat_sub",    amount: 649,  accountId: "acc_joint",   paidBy: "aarav", owner: "ours" },
  { id: "tx32", date: daysAgo(30,11,  0), merchant: "Zomato",           categoryId: "cat_food",   amount: 480,  accountId: "acc_a_cc",    paidBy: "aarav", owner: "me" },
  { id: "tx33", date: daysAgo(31,10,  0), merchant: "Uber",             categoryId: "cat_travel", amount: 340,  accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
  { id: "tx34", date: daysAgo(33,14,  0), merchant: "Pharmacy",         categoryId: "cat_health", amount: 260,  accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx35", date: daysAgo(34,10,  0), merchant: "Rent — April",     categoryId: "cat_rent",   amount: 32000,accountId: "acc_joint",   paidBy: "meera", owner: "ours", splits: [{ownerId:"aarav", amount:17600},{ownerId:"meera", amount:14400}] },
  { id: "tx36", date: daysAgo(36,21,  0), merchant: "Bombay Canteen",    categoryId: "cat_dining", amount: 3120, accountId: "acc_a_cc",    paidBy: "aarav", owner: "ours" },
  { id: "tx37", date: daysAgo(38,10,  0), merchant: "BigBasket",        categoryId: "cat_groc",   amount: 1720, accountId: "acc_joint",   paidBy: "meera", owner: "ours" },
  { id: "tx38", date: daysAgo(40,20,  0), merchant: "Swiggy",           categoryId: "cat_food",   amount: 690,  accountId: "acc_a_cc",    paidBy: "aarav", owner: "me" },
  { id: "tx39", date: daysAgo(41,10,  0), merchant: "Petrol",           categoryId: "cat_travel", amount: 1200, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me" },
  { id: "tx40", date: daysAgo(42,10,  0), merchant: "Salon",            categoryId: "cat_health", amount: 1800, accountId: "acc_m_icici", paidBy: "meera", owner: "partner" },
];

export const bills: Bill[] = [
  { id: "b1", name: "Electricity", amount: 2340, dueDate: daysAgo(-3, 10),  payer: "joint", autopay: true,  categoryId: "cat_util" },
  { id: "b2", name: "Wifi — ACT",  amount: 1199, dueDate: daysAgo(-6, 10),  payer: "meera", autopay: false, categoryId: "cat_util" },
  { id: "b3", name: "Netflix",     amount: 649,  dueDate: daysAgo(-9, 10),  payer: "joint", autopay: true,  categoryId: "cat_sub" },
  { id: "b4", name: "Rent — June", amount: 32000,dueDate: daysAgo(-12,10),  payer: "joint", autopay: false, categoryId: "cat_rent" },
];

export const goals: Goal[] = [
  { id: "g_home",  emoji: "🏠", name: "Home Down Payment", target: 1200000, saved: 480000, targetDate: "2027-06-01" },
  { id: "g_bali",  emoji: "✈️", name: "Bali Dec 2026",     target: 150000,  saved: 64500,  targetDate: "2026-12-18", linkedTripId: "trip_bali" },
  { id: "g_emerg", emoji: "🛋", name: "Emergency Fund",    target: 300000,  saved: 210000 },
];

export const goalContributions: GoalContribution[] = [
  { id: "gc1", goalId: "g_home",  ownerId: "aarav", amount: 15000, date: daysAgo(2) },
  { id: "gc2", goalId: "g_home",  ownerId: "meera", amount: 12000, date: daysAgo(2) },
  { id: "gc3", goalId: "g_bali",  ownerId: "aarav", amount: 5000,  date: daysAgo(8) },
  { id: "gc4", goalId: "g_bali",  ownerId: "meera", amount: 5000,  date: daysAgo(8) },
  { id: "gc5", goalId: "g_emerg", ownerId: "aarav", amount: 8000,  date: daysAgo(14) },
];

// ---------- Wishlist / Gifts / Occasions ----------
export const wishlist: WishlistItem[] = [
  { id: "w1", ownerId: "meera", title: "Ceramic pottery workshop",     priority: 3, price: 1600,  privacy: "visible", claimedBy: "aarav" },
  { id: "w2", ownerId: "meera", title: "Kindle Paperwhite",             priority: 2, price: 13999, privacy: "visible" },
  { id: "w3", ownerId: "meera", title: "Anything matcha-related",       priority: 1,               privacy: "visible", note: "generic hint" },
  { id: "w4", ownerId: "meera", title: "Linen midi dress",              priority: 2, price: 2499,  privacy: "visible", note: "size M, terracotta please" },
  { id: "w5", ownerId: "meera", title: "Murakami box set",              priority: 2, price: 3200,  privacy: "visible" },
  { id: "w6", ownerId: "aarav", title: "Mechanical keyboard",           priority: 3, price: 8500,  privacy: "visible" },
  { id: "w7", ownerId: "aarav", title: "F1 cap",                        priority: 1, price: 1400,  privacy: "visible" },
  { id: "w8", ownerId: "aarav", title: "A proper massage day",          priority: 2,               privacy: "visible" },
  { id: "w9", ownerId: "aarav", title: "Running shoes (size 10)",       priority: 2, price: 6500,  privacy: "visible" },
  { id: "w10", ownerId: "ours", title: "Air fryer",                     priority: 2, price: 6990,  privacy: "shared" },
  { id: "w11", ownerId: "ours", title: "Balcony plants set",            priority: 1, price: 1800,  privacy: "shared" },
  { id: "w12", ownerId: "ours", title: "Weekend pottery date",          priority: 2,               privacy: "shared" },
];

export const occasions: Occasion[] = [
  { id: "o1", name: "Meera's mom's birthday", date: daysAgo(-12), forWho: "Family", budget: 2500,
    lastGift: { name: "Silk saree", price: 2800, rating: 5 } },
  { id: "o2", name: "Wedding anniversary",     date: daysAgo(-156), forWho: "Us",   budget: 12000 },
  { id: "o3", name: "Rohan & Priya housewarming", date: daysAgo(-26), forWho: "Friends", budget: 2000 },
];

export const gifts: Gift[] = [
  { id: "gift1", wishlistItemId: "w1", title: "Ceramic pottery workshop", price: 1600, from: "aarav", to: "meera", status: "locked" },
];

// ---------- Calendar / Dates / Trips ----------
function inDays(n: number, h = 10, m = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const events: CalendarEvent[] = [
  { id: "e1", title: "Client presentation", date: inDays(1, 11),  owner: "partner", emoji: "📐" },
  { id: "e2", title: "Gym",                 date: inDays(0, 7),   owner: "me",       emoji: "🏋️" },
  { id: "e3", title: "Gym",                 date: inDays(2, 7),   owner: "me",       emoji: "🏋️" },
  { id: "e4", title: "Gym",                 date: inDays(4, 7),   owner: "me",       emoji: "🏋️" },
  { id: "e5", title: "Dinner @ Rohan's",    date: inDays(5, 20),  owner: "ours",     emoji: "🍝", location: "Bandra" },
  { id: "e6", title: "Bali",                date: inDays(164, 6), owner: "ours",     emoji: "🌴", countdown: true },
];

export const dateIdeas: DateIdea[] = [
  { id: "d1", title: "Bandra café (from reel)",   vibe: "chill",    price: 2, location: "Bandra", source: "instagram" },
  { id: "d2", title: "Sunset cycling Marine Dr.", vibe: "active",   price: 1, location: "Marine Drive" },
  { id: "d3", title: "Home ramen night",           vibe: "at-home",  price: 1 },
  { id: "d4", title: "Prithvi Theatre play",       vibe: "romantic", price: 2, location: "Juhu" },
  { id: "d5", title: "Pottery date",               vibe: "at-home",  price: 3 },
];

export const trips: Trip[] = [
  { id: "trip_bali", destination: "Bali", emoji: "🌴", startDate: inDays(164), endDate: inDays(170), status: "planning", budget: 150000, linkedGoalId: "g_bali" },
];

export const tripItems: TripItem[] = [
  { id: "ti1", tripId: "trip_bali", kind: "stay",     title: "Ubud villa — 3 nights" },
  { id: "ti2", tripId: "trip_bali", kind: "activity", title: "Sunrise Mt. Batur trek" },
  { id: "ti3", tripId: "trip_bali", kind: "activity", title: "Cooking class in Seminyak" },
];

// ---------- Tasks & Lists ----------
export const tasks: Task[] = [
  { id: "t1", title: "Book deep-clean",         assignee: "aarav",    dueDate: daysAgo(1) },
  { id: "t2", title: "Call plumber re: geyser", assignee: "meera",    dueDate: inDays(1) },
  { id: "t3", title: "Renew car insurance",     assignee: "rotating", rotation: "meera", dueDate: inDays(4) },
];

export const lists: ListDoc[] = [
  { id: "l_groc", name: "Groceries", emoji: "🛒", kind: "grocery" },
  { id: "l_home", name: "Home to-dos", emoji: "🧺", kind: "todo" },
];

export const listItems: ListItem[] = [
  { id: "li1",  listId: "l_groc", title: "Milk",         favorite: true },
  { id: "li2",  listId: "l_groc", title: "Eggs",         favorite: true, done: true },
  { id: "li3",  listId: "l_groc", title: "Coffee beans", favorite: true },
  { id: "li4",  listId: "l_groc", title: "Paneer",       favorite: true, done: true },
  { id: "li5",  listId: "l_groc", title: "Tomatoes" },
  { id: "li6",  listId: "l_groc", title: "Basmati rice" },
  { id: "li7",  listId: "l_groc", title: "Yogurt", done: true },
  { id: "li8",  listId: "l_groc", title: "Onions" },
  { id: "li9",  listId: "l_groc", title: "Ginger" },
  { id: "li10", listId: "l_groc", title: "Bananas" },
  { id: "li11", listId: "l_groc", title: "Bread" },
  { id: "li12", listId: "l_groc", title: "Matcha powder" },
  { id: "li13", listId: "l_groc", title: "Cheese" },
  { id: "li14", listId: "l_groc", title: "Detergent" },
];

export const recipes: Recipe[] = [
  { id: "r1", title: "Home Ramen Night", emoji: "🍜", minutes: 40, tags: ["cozy", "date"] },
  { id: "r2", title: "Palak Paneer",     emoji: "🥬", minutes: 30, tags: ["weeknight"] },
];

// ---------- Us / Relationship ----------
export const memories: Memory[] = [
  { id: "m1", title: "Juhu beach walk",      date: daysAgo(19), photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=60", location: "Juhu" },
  { id: "m2", title: "Lonavala weekend",     date: daysAgo(45), photo: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=60" },
  { id: "m3", title: "Anniversary dinner",   date: daysAgo(156),photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=60" },
  { id: "m4", title: "First house key 🔑",    date: daysAgo(300),photo: "https://images.unsplash.com/photo-1505692794403-34cbaa4bcbc5?w=600&q=60" },
  { id: "m5", title: "Diwali 2025",          date: daysAgo(240),photo: "https://images.unsplash.com/photo-1604423043492-41303b1cf1a2?w=600&q=60" },
  { id: "m6", title: "The day we met",       date: "2023-02-14",photo: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60" },
];

export const gratitudeNotes: GratitudeNote[] = [
  { id: "gn1", from: "meera", to: "aarav", date: daysAgo(0, 7), read: false,
    text: "Thank you for making chai without me asking. You noticed I was drowning in deadlines. 🤍" },
];

export const dailyQuestion: DailyQuestion = {
  id: "dq_today",
  date: daysAgo(0),
  question: "What's one tiny habit of mine you secretly find adorable?",
  answers: { meera: "The way you hum while brewing coffee ☕" },
};

export const checkIns: CheckIn[] = [
  { id: "c1", date: daysAgo(0), ownerId: "meera", mood: 4 },
  { id: "c2", date: daysAgo(1), ownerId: "aarav", mood: 5 },
];

// ---------- Insights / Brief ----------
export const insights: Insight[] = [
  { id: "i1", kind: "spend", tone: "caution", title: "Dining is trending up",
    body: "Dining is 38% above your 3-month average. Cook-at-home date this week?" },
  { id: "i2", kind: "subscription", tone: "info", title: "Two Spotify Premiums",
    body: "You could save ₹1,428/year by switching to a Duo plan." },
  { id: "i3", kind: "relationship", tone: "celebrate", title: "4 months of date streak 🔥",
    body: "You've hit your 2-dates-a-month goal for four months straight." },
];

export const brief: BriefCard[] = [
  { id: "bc1", emoji: "💸", title: "You saved ₹4,320 vs last week", body: "Groceries came in under budget." },
  { id: "bc2", emoji: "💞", title: "You had 2 date nights",         body: "Bandra café + Juhu walk." },
  { id: "bc3", emoji: "🌱", title: "Meera cooked 3 times",           body: "Palak paneer twice, ramen once." },
  { id: "bc4", emoji: "🎯", title: "Bali goal hit 43%",              body: "₹5k each this week." },
];

export const runningBalance = { owedTo: "aarav" as const, amount: 2340 };

export const monthBudget = { budget: 85000, spent: 61240 };
