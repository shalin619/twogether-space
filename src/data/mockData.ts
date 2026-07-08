import type {
  Account, Bill, BriefCard, Category, CheckIn, Couple, DailyQuestion,
  DateIdea, CalendarEvent, Gift, Goal, GoalContribution, GratitudeNote,
  Insight, ListDoc, ListItem, Memory, MealPlanEntry, Occasion, Profile,
  Recipe, Settlement, Task, Transaction, Trip, TripItem, WishlistItem,
} from "./types";

// ---------- People ----------
export const profiles: Profile[] = [
  { id: "aarav", name: "Aarav", role: "Product Manager", city: "Mumbai", color: "#E2725B", avatarEmoji: "🧑🏽", age: 29 },
  { id: "meera", name: "Meera", role: "Architect",       city: "Mumbai", color: "#4E8D7C", avatarEmoji: "👩🏽", age: 28 },
];

export const couple: Couple = {
  id: "us",
  partners: ["aarav", "meera"],
  startedAt: "2023-02-14",
  anniversary: "2025-12-09",
  currency: "INR",
  splitRatio: { aarav: 55, meera: 45 },
  moneyStyle: "hybrid",
  lifeStage: "Newly married",
};

// ---------- Accounts ----------
export const accounts: Account[] = [
  { id: "acc_a_hdfc",  owner: "me",      ownerId: "aarav", name: "HDFC Savings",  bank: "HDFC",   balance: 86400,  kind: "bank" },
  { id: "acc_m_icici", owner: "partner", ownerId: "meera", name: "ICICI Savings", bank: "ICICI",  balance: 112750, kind: "bank" },
  { id: "acc_joint",   owner: "ours",                       name: "Joint",         bank: "Kotak",  balance: 204000, kind: "bank" },
  { id: "acc_a_cc",    owner: "me",      ownerId: "aarav", name: "Credit Card",   bank: "HDFC",   balance: -12480, kind: "credit" },
];

export const categories: Category[] = [
  { id: "cat_rent",    name: "Rent",          emoji: "🏠", budget: 32000 },
  { id: "cat_groc",    name: "Groceries",     emoji: "🛒", budget: 8000 },
  { id: "cat_dining",  name: "Dining",        emoji: "🍽️", budget: 4500 },
  { id: "cat_dates",   name: "Date Nights",   emoji: "💞", budget: 4000 },
  { id: "cat_food",    name: "Zomato/Swiggy", emoji: "🥡", budget: 2500 },
  { id: "cat_travel",  name: "Transport",     emoji: "🚕", budget: 5000 },
  { id: "cat_util",    name: "Utilities",     emoji: "💡", budget: 5000 },
  { id: "cat_shop",    name: "Shopping",      emoji: "🛍️", budget: 6000 },
  { id: "cat_sub",     name: "Subscriptions", emoji: "🎬", budget: 2000 },
  { id: "cat_gift",    name: "Gifts",         emoji: "🎁", budget: 3000 },
  { id: "cat_health",  name: "Health",        emoji: "🌿", budget: 3000 },
  { id: "cat_income",  name: "Income",        emoji: "💰" },
];

// ---------- Date helpers ----------
const today = new Date();
function daysAgo(n: number, h = 12, m = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function inDays(n: number, h = 10, m = 0) {
  return daysAgo(-n, h, m);
}
function onDate(y: number, mo: number, d: number, h = 10) {
  return new Date(y, mo - 1, d, h).toISOString();
}

// ---------- Transactions ----------
// Current-month spend targeted ≈ ₹61,240. Dining this month ≈ ₹5,420 (38% above prior avg).
export const transactions: Transaction[] = [
  // Salary credits
  { id: "tx_s1", date: daysAgo(30, 10), merchant: "Salary — Aarav", categoryId: "cat_income", amount: 142000, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me",      ownerId: "aarav", isIncome: true },
  { id: "tx_s2", date: daysAgo(30, 10), merchant: "Salary — Meera", categoryId: "cat_income", amount: 116000, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera", isIncome: true },

  // Rent — current + prior month
  { id: "tx_r1", date: daysAgo(6,  9),  merchant: "Rent — July",  categoryId: "cat_rent", amount: 32000, accountId: "acc_joint", paidBy: "aarav", owner: "ours", ownerId: "aarav",
    splits: [{ownerId:"aarav", amount:17600},{ownerId:"meera", amount:14400}], note: "Alternating payer" },
  { id: "tx_r2", date: daysAgo(36, 9),  merchant: "Rent — June",  categoryId: "cat_rent", amount: 32000, accountId: "acc_joint", paidBy: "meera", owner: "ours", ownerId: "meera",
    splits: [{ownerId:"aarav", amount:17600},{ownerId:"meera", amount:14400}] },

  // Groceries — 8 entries
  { id: "tx_g1", date: daysAgo(1,  20), merchant: "BigBasket", categoryId: "cat_groc", amount: 1840, accountId: "acc_joint",  paidBy: "meera", owner: "ours",    ownerId: "meera" },
  { id: "tx_g2", date: daysAgo(4,  10), merchant: "DMart",     categoryId: "cat_groc", amount: 2140, accountId: "acc_joint",  paidBy: "meera", owner: "ours",    ownerId: "meera" },
  { id: "tx_g3", date: daysAgo(8,  11), merchant: "BigBasket", categoryId: "cat_groc", amount: 1620, accountId: "acc_joint",  paidBy: "aarav", owner: "ours",    ownerId: "aarav" },
  { id: "tx_g4", date: daysAgo(12, 12), merchant: "Nature's Basket", categoryId: "cat_groc", amount: 980, accountId: "acc_joint", paidBy: "meera", owner: "ours", ownerId: "meera" },
  { id: "tx_g5", date: daysAgo(15, 12), merchant: "DMart",     categoryId: "cat_groc", amount: 640, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me",      ownerId: "aarav" },
  { id: "tx_g6", date: daysAgo(19, 12), merchant: "Local sabziwala", categoryId: "cat_groc", amount: 410, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_g7", date: daysAgo(23, 12), merchant: "BigBasket", categoryId: "cat_groc", amount: 1180, accountId: "acc_joint", paidBy: "meera", owner: "ours", ownerId: "meera" },
  { id: "tx_g8", date: daysAgo(27, 12), merchant: "Coffee beans — Blue Tokai", categoryId: "cat_groc", amount: 420, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me", ownerId: "aarav" },

  // Dining — this month 7 entries, sum ≈ 5,420
  { id: "tx_d1", date: daysAgo(2,  21), merchant: "Social",         categoryId: "cat_dining", amount: 1240, accountId: "acc_a_cc",   paidBy: "aarav", owner: "ours", ownerId: "aarav",
    splits: [{ownerId:"aarav", amount:620},{ownerId:"meera", amount:620}] },
  { id: "tx_d2", date: daysAgo(5,  20), merchant: "Bastian",        categoryId: "cat_dining", amount: 2680, accountId: "acc_a_cc",   paidBy: "aarav", owner: "ours", ownerId: "aarav" },
  { id: "tx_d3", date: daysAgo(9,  13), merchant: "Blue Tokai",     categoryId: "cat_dining", amount: 380,  accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me",   ownerId: "aarav" },
  { id: "tx_d4", date: daysAgo(13, 13), merchant: "Kala Ghoda Cafe",categoryId: "cat_dining", amount: 420,  accountId: "acc_m_icici",paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_d5", date: daysAgo(16, 21), merchant: "Soam",           categoryId: "cat_dining", amount: 340,  accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me",   ownerId: "aarav" },
  { id: "tx_d6", date: daysAgo(20, 13), merchant: "Suzette",        categoryId: "cat_dining", amount: 220,  accountId: "acc_m_icici",paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_d7", date: daysAgo(24, 20), merchant: "Bombay Canteen", categoryId: "cat_dining", amount: 140,  accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me",   ownerId: "aarav" },

  // Zomato / Swiggy — 6 entries
  { id: "tx_f1", date: daysAgo(3,  20), merchant: "Zomato", categoryId: "cat_food", amount: 540, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_f2", date: daysAgo(7,  13), merchant: "Swiggy", categoryId: "cat_food", amount: 620, accountId: "acc_a_cc",    paidBy: "aarav", owner: "me",      ownerId: "aarav" },
  { id: "tx_f3", date: daysAgo(11, 20), merchant: "Zomato", categoryId: "cat_food", amount: 480, accountId: "acc_a_cc",    paidBy: "aarav", owner: "me",      ownerId: "aarav" },
  { id: "tx_f4", date: daysAgo(14, 20), merchant: "Swiggy", categoryId: "cat_food", amount: 390, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_f5", date: daysAgo(18, 20), merchant: "Zomato", categoryId: "cat_food", amount: 560, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_f6", date: daysAgo(25, 20), merchant: "Swiggy", categoryId: "cat_food", amount: 410, accountId: "acc_a_cc",    paidBy: "aarav", owner: "me",      ownerId: "aarav" },

  // Transport — Uber ×4 + fuel ×2
  { id: "tx_t1", date: daysAgo(2,  9),  merchant: "Uber",   categoryId: "cat_travel", amount: 260, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me",      ownerId: "aarav" },
  { id: "tx_t2", date: daysAgo(6,  19), merchant: "Uber",   categoryId: "cat_travel", amount: 380, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_t3", date: daysAgo(10, 9),  merchant: "Uber",   categoryId: "cat_travel", amount: 220, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me",      ownerId: "aarav" },
  { id: "tx_t4", date: daysAgo(17, 19), merchant: "Uber",   categoryId: "cat_travel", amount: 340, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_t5", date: daysAgo(12, 11), merchant: "HP Petrol", categoryId: "cat_travel", amount: 1200, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me",   ownerId: "aarav" },
  { id: "tx_t6", date: daysAgo(28, 11), merchant: "HP Petrol", categoryId: "cat_travel", amount: 1100, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "me",   ownerId: "aarav" },

  // Utilities
  { id: "tx_u1", date: daysAgo(20, 14), merchant: "BEST Electricity", categoryId: "cat_util", amount: 2340, accountId: "acc_joint",   paidBy: "aarav", owner: "ours", ownerId: "aarav" },
  { id: "tx_u2", date: daysAgo(22, 10), merchant: "ACT Wifi",         categoryId: "cat_util", amount: 1199, accountId: "acc_m_icici", paidBy: "meera", owner: "ours", ownerId: "meera" },
  { id: "tx_u3", date: daysAgo(24, 10), merchant: "Mahanagar Gas",    categoryId: "cat_util", amount: 800,  accountId: "acc_joint",   paidBy: "meera", owner: "ours", ownerId: "meera" },

  // Subscriptions
  { id: "tx_sub1", date: daysAgo(9, 10),  merchant: "Netflix",         categoryId: "cat_sub", amount: 649, accountId: "acc_joint",   paidBy: "aarav", owner: "ours",    ownerId: "aarav" },
  { id: "tx_sub2", date: daysAgo(11, 10), merchant: "Spotify Premium", categoryId: "cat_sub", amount: 149, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me",      ownerId: "aarav" },
  { id: "tx_sub3", date: daysAgo(11, 10), merchant: "Spotify Premium", categoryId: "cat_sub", amount: 149, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },

  // Shopping
  { id: "tx_sh1", date: daysAgo(4, 18),  merchant: "Zara",     categoryId: "cat_shop", amount: 1499, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },

  // Gifts (the hidden one)
  { id: "tx_gift1", date: daysAgo(3, 15), merchant: "Clayhouse Studio", categoryId: "cat_gift", amount: 1600, accountId: "acc_a_hdfc",
    paidBy: "aarav", owner: "me", ownerId: "aarav",
    isGiftHidden: true, hiddenFrom: "meera", revealDate: "2026-12-09",
    note: "Pottery workshop — anniversary gift 🎁" },

  // Health
  { id: "tx_h1", date: daysAgo(14, 10), merchant: "Apollo Pharmacy", categoryId: "cat_health", amount: 420, accountId: "acc_m_icici", paidBy: "meera", owner: "partner", ownerId: "meera" },
  { id: "tx_h2", date: daysAgo(21, 8),  merchant: "Cult.fit Gym",    categoryId: "cat_health", amount: 380, accountId: "acc_a_hdfc",  paidBy: "aarav", owner: "me",      ownerId: "aarav" },

  // Date nights (current month = 2,150)
  { id: "tx_dt1", date: daysAgo(10, 22), merchant: "Prithvi Cafe",  categoryId: "cat_dates", amount: 890, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "ours", ownerId: "aarav",
    note: "Play + café", comments: [{ id: "cm1", by: "meera", text: "That falooda though 😍", date: daysAgo(10, 23) }] },
  { id: "tx_dt2", date: daysAgo(19, 19), merchant: "Juhu Chaat",    categoryId: "cat_dates", amount: 340, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "ours", ownerId: "aarav",
    note: "Beach walk 🌊" },
  { id: "tx_dt3", date: daysAgo(26, 20), merchant: "Cinepolis",     categoryId: "cat_dates", amount: 920, accountId: "acc_a_hdfc", paidBy: "aarav", owner: "ours", ownerId: "aarav" },

  // Previous-month dining tail (for the 38% comparison narrative)
  { id: "tx_pd1", date: daysAgo(34, 21), merchant: "Bombay Canteen", categoryId: "cat_dining", amount: 1320, accountId: "acc_a_cc",  paidBy: "aarav", owner: "ours", ownerId: "aarav" },
  { id: "tx_pd2", date: daysAgo(38, 20), merchant: "Indigo Deli",    categoryId: "cat_dining", amount: 980,  accountId: "acc_joint", paidBy: "aarav", owner: "ours", ownerId: "aarav" },
  { id: "tx_pd3", date: daysAgo(42, 21), merchant: "Trishna",        categoryId: "cat_dining", amount: 1620, accountId: "acc_a_cc",  paidBy: "aarav", owner: "ours", ownerId: "aarav" },
];

// ---------- Bills ----------
export const bills: Bill[] = [
  { id: "b1", name: "Electricity",   amount: 2340,  dueDate: inDays(3,  10), payer: "joint",     autopay: true,  categoryId: "cat_util", repeat: "monthly" },
  { id: "b2", name: "Wifi — ACT",    amount: 1199,  dueDate: inDays(6,  10), payer: "meera",     autopay: false, categoryId: "cat_util", repeat: "monthly" },
  { id: "b3", name: "Netflix",       amount: 649,   dueDate: inDays(9,  10), payer: "joint",     autopay: true,  categoryId: "cat_sub",  repeat: "monthly" },
  { id: "b4", name: "SIP — Mirae Asset", amount: 15000, dueDate: inDays(2, 10), payer: "aarav",  autopay: true,  categoryId: "cat_gift", repeat: "monthly", note: "5th of every month" },
  { id: "b5", name: "Rent",          amount: 32000, dueDate: inDays(25, 10), payer: "alternate", autopay: false, categoryId: "cat_rent", repeat: "monthly", note: "We alternate 🔁" },
  { id: "b6", name: "Gym — Cult.fit",amount: 1800,  dueDate: inDays(12, 10), payer: "aarav",     autopay: true,  categoryId: "cat_health", repeat: "monthly" },
  { id: "b7", name: "House help",    amount: 4000,  dueDate: inDays(23, 10), payer: "joint",     autopay: false, repeat: "monthly" },
];

// ---------- Goals ----------
export const goals: Goal[] = [
  { id: "g_home",  emoji: "🏠", name: "Home Down Payment", target: 1200000, saved: 480000, targetDate: "2027-06-01", privacy: "shared" },
  { id: "g_bali",  emoji: "🌴", name: "Bali Dec 2026",     target: 150000,  saved: 64500,  targetDate: "2026-12-18", linkedTripId: "trip_bali", privacy: "shared" },
  { id: "g_emerg", emoji: "🛟", name: "Emergency Fund",    target: 300000,  saved: 210000, privacy: "shared" },
];

export const goalContributions: GoalContribution[] = [
  // Home
  { id: "gc_h1", goalId: "g_home", ownerId: "aarav", amount: 20000, date: daysAgo(60) },
  { id: "gc_h2", goalId: "g_home", ownerId: "meera", amount: 15000, date: daysAgo(60) },
  { id: "gc_h3", goalId: "g_home", ownerId: "aarav", amount: 25000, date: daysAgo(30) },
  { id: "gc_h4", goalId: "g_home", ownerId: "meera", amount: 18000, date: daysAgo(30) },
  { id: "gc_h5", goalId: "g_home", ownerId: "aarav", amount: 15000, date: daysAgo(2) },
  { id: "gc_h6", goalId: "g_home", ownerId: "meera", amount: 12000, date: daysAgo(2) },
  // Bali
  { id: "gc_b1", goalId: "g_bali", ownerId: "aarav", amount: 8000, date: daysAgo(60) },
  { id: "gc_b2", goalId: "g_bali", ownerId: "meera", amount: 6000, date: daysAgo(60) },
  { id: "gc_b3", goalId: "g_bali", ownerId: "aarav", amount: 8000, date: daysAgo(30) },
  { id: "gc_b4", goalId: "g_bali", ownerId: "meera", amount: 6500, date: daysAgo(30) },
  { id: "gc_b5", goalId: "g_bali", ownerId: "aarav", amount: 5000, date: daysAgo(8) },
  { id: "gc_b6", goalId: "g_bali", ownerId: "meera", amount: 5000, date: daysAgo(8) },
  // Emergency
  { id: "gc_e1", goalId: "g_emerg", ownerId: "aarav", amount: 30000, date: daysAgo(90) },
  { id: "gc_e2", goalId: "g_emerg", ownerId: "meera", amount: 25000, date: daysAgo(90) },
  { id: "gc_e3", goalId: "g_emerg", ownerId: "aarav", amount: 20000, date: daysAgo(45) },
  { id: "gc_e4", goalId: "g_emerg", ownerId: "meera", amount: 20000, date: daysAgo(45) },
  { id: "gc_e5", goalId: "g_emerg", ownerId: "aarav", amount: 8000, date: daysAgo(14) },
];

// ---------- Wishlist ----------
const IMG = (kw: string) =>
  `https://source.unsplash.com/400x400/?${encodeURIComponent(kw)}`;

export const wishlist: WishlistItem[] = [
  // Meera's list
  { id: "w1", ownerId: "meera", title: "Ceramic pottery workshop", priority: 3, price: 1600, privacy: "visible",
    claimedBy: "aarav", claimedForOccasionId: "o2",
    image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&q=60",
    note: "Clayhouse Studio, Bandra" },
  { id: "w2", ownerId: "meera", title: "Kindle Paperwhite", priority: 2, price: 13999, privacy: "visible",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=60" },
  { id: "w3", ownerId: "meera", title: "Anything matcha-related 🍵", priority: 1, privacy: "visible", generic: true,
    note: "Powder, whisk, cute cups — anything!" },
  { id: "w4", ownerId: "meera", title: "Linen midi dress", priority: 2, price: 2499, privacy: "visible",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=60",
    note: "size M, terracotta please" },
  { id: "w5", ownerId: "meera", title: "Murakami box set", priority: 2, price: 3200, privacy: "visible",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=60" },

  // Aarav's list
  { id: "w6", ownerId: "aarav", title: "Mechanical keyboard (Keychron K2)", priority: 3, price: 8500, privacy: "visible",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=60" },
  { id: "w7", ownerId: "aarav", title: "F1 cap", priority: 1, price: 1299, privacy: "visible",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=60" },
  { id: "w8", ownerId: "aarav", title: "A proper massage day", priority: 2, privacy: "visible", generic: true },
  { id: "w9", ownerId: "aarav", title: "Running shoes (size 10)", priority: 2, price: 5999, privacy: "visible",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=60" },

  // Ours
  { id: "w10", ownerId: "ours", title: "Air fryer", priority: 2, price: 6990, privacy: "shared",
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=60" },
  { id: "w11", ownerId: "ours", title: "Balcony plants set", priority: 1, price: 1500, privacy: "shared",
    image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=60" },
  { id: "w12", ownerId: "ours", title: "Weekend pottery date", priority: 2, privacy: "shared" },
];

// ---------- Occasions & Gift Vault ----------
export const occasions: Occasion[] = [
  { id: "o_mom",  name: "Meera's mom's birthday",  date: inDays(12), forWho: "Family",  budget: 2500,  emoji: "🎂",
    lastGift: { name: "Silk saree", price: 2800, rating: 5 },
    giftIdeas: ["Handmade photo album", "Kanjeevaram stole"] },
  { id: "o2",     name: "Wedding anniversary",      date: "2026-12-09", forWho: "Us",   budget: 12000, emoji: "💍" },
  { id: "o_rp",   name: "Rohan & Priya housewarming", date: inDays(26), forWho: "Friends", budget: 2000, emoji: "🏡",
    giftIdeas: ["Fiddle leaf fig", "Aromatic candle set"] },
  { id: "o_dad",  name: "Aarav's dad's birthday",   date: inDays(41), forWho: "Family",  budget: 3500, emoji: "🎁",
    lastGift: { name: "Leather wallet", price: 3200, rating: 4 } },
];

export const gifts: Gift[] = [
  // Current locker
  { id: "gift_pot", wishlistItemId: "w1", occasionId: "o2", title: "Ceramic pottery workshop", price: 1600, from: "aarav", to: "meera", status: "locked", date: daysAgo(3) },
  // Past vault
  { id: "gift_v1", title: "Silk saree",       price: 2800, from: "aarav", to: "family",  status: "given", date: daysAgo(377), rating: 5, recipient: "Meera's mom" },
  { id: "gift_v2", title: "Leather wallet",   price: 3200, from: "meera", to: "family",  status: "given", date: daysAgo(400), rating: 4, recipient: "Aarav's dad" },
  { id: "gift_v3", title: "Fountain pen",     price: 1800, from: "meera", to: "aarav",   status: "given", date: daysAgo(156), rating: 5 },
  { id: "gift_v4", title: "Vinyl record set", price: 4500, from: "aarav", to: "meera",   status: "given", date: daysAgo(156), rating: 5 },
  { id: "gift_v5", title: "Cast iron pan",    price: 2400, from: "aarav", to: "friends", status: "given", date: daysAgo(290), rating: 4, recipient: "Rohan & Priya" },
];

// ---------- Calendar ----------
export const events: CalendarEvent[] = [
  { id: "e_pres",  title: "Client presentation", date: inDays(1, 15),  owner: "partner", emoji: "📐", createdBy: "meera", location: "BKC" },
  { id: "e_gym1",  title: "Gym",  date: inDays(0, 7),   owner: "me", emoji: "🏋️", createdBy: "aarav" },
  { id: "e_gym2",  title: "Gym",  date: inDays(2, 7),   owner: "me", emoji: "🏋️", createdBy: "aarav" },
  { id: "e_gym3",  title: "Gym",  date: inDays(4, 7),   owner: "me", emoji: "🏋️", createdBy: "aarav" },
  { id: "e_rohan", title: "Dinner @ Rohan's", date: inDays(3, 20), owner: "ours", emoji: "🍝", createdBy: "aarav", location: "Bandra" },
  { id: "e_dent",  title: "Dentist", date: inDays(6, 11), owner: "me", emoji: "🦷", createdBy: "aarav" },
  { id: "e_lunch", title: "Lunch at in-laws", date: inDays(5, 13), owner: "ours", emoji: "🍛", createdBy: "meera", location: "Powai" },
  { id: "e_book",  title: "Book club", date: inDays(8, 19), owner: "partner", emoji: "📚", createdBy: "meera" },
  { id: "e_surp",  title: "Pottery date 🎁", date: inDays(4, 19), owner: "ours", emoji: "🎁",
    surprise: true, createdBy: "aarav", teaser: "📦 Saturday 7 PM — dress warm" },
  { id: "e_bali",  title: "Bali ✈️", date: "2026-12-18T06:00:00.000Z", owner: "ours", emoji: "🌴", countdown: true, createdBy: "aarav" },
  { id: "e_anniv", title: "Wedding anniversary", date: "2026-12-09T20:00:00.000Z", owner: "ours", emoji: "💍", countdown: true, createdBy: "aarav" },
  { id: "e_mom",   title: "Meera's mom's birthday", date: inDays(12, 19), owner: "ours", emoji: "🎂", createdBy: "meera" },
];

// ---------- Date ideas ----------
export const dateIdeas: DateIdea[] = [
  { id: "di1", title: "Bandra café hop",       vibe: "chill",    price: 2, location: "Bandra",       tags: ["café", "walk"],
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=60" },
  { id: "di2", title: "Sunset cycling Marine Dr.", vibe: "active", price: 1, location: "Marine Drive", tags: ["outdoors", "cycle"],
    image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&q=60" },
  { id: "di3", title: "Home ramen night",       vibe: "at-home",  price: 1, tags: ["cook", "cozy"],
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=60" },
  { id: "di4", title: "Prithvi Theatre play",   vibe: "romantic", price: 2, location: "Juhu", tags: ["theatre"],
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&q=60" },
  { id: "di5", title: "Pottery workshop",       vibe: "romantic", price: 3, location: "Bandra", tags: ["make"],
    image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&q=60" },
  { id: "di6", title: "Drive-in movie",         vibe: "romantic", price: 2, location: "Sunset Drive-in", tags: ["movie"],
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=60" },
  { id: "di7", title: "Sassoon Dock photowalk", vibe: "active",   price: 1, location: "Colaba", tags: ["photo"],
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=60" },
  { id: "di8", title: "Board-game café",        vibe: "chill",    price: 2, location: "Andheri", tags: ["games"],
    image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&q=60" },
];

export const dateStats = {
  lastDate: { date: daysAgo(19), title: "Juhu beach walk + chaat" },
  monthlyGoal: 2,
  streak: 4,
};

// ---------- Trips ----------
export const trips: Trip[] = [
  { id: "trip_bali", destination: "Bali", emoji: "🌴", startDate: "2026-12-18", endDate: "2026-12-24",
    status: "planning", budget: 150000, spent: 12400, linkedGoalId: "g_bali",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=60" },
  { id: "trip_kyoto",   destination: "Kyoto",     emoji: "🗾", startDate: "", endDate: "", status: "dream", budget: 0,
    image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=60" },
  { id: "trip_ladakh",  destination: "Ladakh",    emoji: "🏔️", startDate: "", endDate: "", status: "dream", budget: 0,
    image: "https://images.unsplash.com/photo-1587922546925-fa5ff3b7ed57?w=800&q=60" },
  { id: "trip_santorini", destination: "Santorini", emoji: "🇬🇷", startDate: "", endDate: "", status: "dream", budget: 0,
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=60" },
];

export const tripItems: TripItem[] = [
  // Bali itinerary
  { id: "ti_fl",  tripId: "trip_bali", kind: "flight",   title: "Mumbai → Denpasar (Singapore Airlines)", price: 46000, status: "booked", done: true },
  { id: "ti_st",  tripId: "trip_bali", kind: "stay",     title: "Ubud villa — 3 nights",  price: 38000, status: "idea" },
  { id: "ti_a1",  tripId: "trip_bali", kind: "activity", title: "Uluwatu sunset + Kecak", price: 2400,  status: "idea" },
  { id: "ti_a2",  tripId: "trip_bali", kind: "activity", title: "Snorkeling — Nusa Penida", price: 4800, status: "idea" },
  { id: "ti_a3",  tripId: "trip_bali", kind: "activity", title: "Balinese cooking class",  price: 3000,  status: "idea" },
  // Packing — 24 items
  ...[
    "Passports", "INR + USD cash", "Travel insurance printout", "Sunscreen SPF 50",
    "Swimsuits", "Beach cover-up", "Linen shirts x3", "Shorts x3",
    "Sneakers", "Sandals", "Toiletries kit", "Meds strip",
    "Universal adapter", "Portable charger", "GoPro + mounts", "Kindle",
    "Reusable bottles", "Snorkel mask (Aarav)", "Journal (Meera)", "Sarong",
    "Sunglasses", "Cap", "Insect repellent", "Copies of docs",
  ].map((title, i) => ({
    id: `ti_pk${i + 1}`, tripId: "trip_bali", kind: "packing" as const, title,
    assignee: (i % 2 === 0 ? "aarav" : "meera") as "aarav" | "meera", done: false,
  })),
];

// ---------- Tasks ----------
export const tasks: Task[] = [
  { id: "t1", title: "Book deep-clean service",       assignee: "aarav",   dueDate: daysAgo(1),  status: "todo" },
  { id: "t2", title: "Call plumber re: geyser",       assignee: "meera",   dueDate: inDays(1),   status: "waiting" },
  { id: "t3", title: "Renew car insurance",           assignee: "rotating", rotation: "meera", dueDate: inDays(6), recurring: "yearly" },
  { id: "t4", title: "Buy AC filter",                 assignee: "aarav",   dueDate: inDays(3) },
  { id: "t5", title: "Return Amazon package",         assignee: "meera",   dueDate: inDays(2) },
  { id: "t6", title: "Frame our wedding photo",       assignee: "ours",    dueDate: inDays(9) },
];

// ---------- Lists ----------
export const lists: ListDoc[] = [
  { id: "l_groc",   name: "Groceries",       emoji: "🛒", kind: "grocery" },
  { id: "l_home",   name: "Home to-dos",     emoji: "🧺", kind: "todo" },
  { id: "l_movies", name: "Movies together", emoji: "🎬", kind: "movies" },
];

export const listItems: ListItem[] = [
  // Grocery — 14, aisle-tagged, 3 checked, favorites: milk/eggs/coffee/paneer
  { id: "li1",  listId: "l_groc", title: "Milk",         favorite: true,  aisle: "Dairy",  addedBy: "meera" },
  { id: "li2",  listId: "l_groc", title: "Eggs",         favorite: true,  aisle: "Dairy",  addedBy: "aarav", done: true },
  { id: "li3",  listId: "l_groc", title: "Coffee beans", favorite: true,  aisle: "Pantry", addedBy: "aarav" },
  { id: "li4",  listId: "l_groc", title: "Paneer",       favorite: true,  aisle: "Dairy",  addedBy: "meera" },
  { id: "li5",  listId: "l_groc", title: "Tomatoes",     aisle: "Produce", addedBy: "meera" },
  { id: "li6",  listId: "l_groc", title: "Basmati rice", aisle: "Pantry",  addedBy: "aarav", qty: "1kg" },
  { id: "li7",  listId: "l_groc", title: "Yogurt",       aisle: "Dairy",   addedBy: "meera", done: true },
  { id: "li8",  listId: "l_groc", title: "Onions",       aisle: "Produce", addedBy: "aarav" },
  { id: "li9",  listId: "l_groc", title: "Ginger",       aisle: "Produce", addedBy: "meera" },
  { id: "li10", listId: "l_groc", title: "Bananas",      aisle: "Produce", addedBy: "aarav" },
  { id: "li11", listId: "l_groc", title: "Bread",        aisle: "Bakery",  addedBy: "meera", done: true },
  { id: "li12", listId: "l_groc", title: "Matcha powder",aisle: "Pantry",  addedBy: "meera" },
  { id: "li13", listId: "l_groc", title: "Cheddar",      aisle: "Dairy",   addedBy: "aarav" },
  { id: "li14", listId: "l_groc", title: "Detergent",    aisle: "Home",    addedBy: "meera" },

  // Movies together
  { id: "mv1", listId: "l_movies", title: "Past Lives",           addedBy: "meera" },
  { id: "mv2", listId: "l_movies", title: "Everything Everywhere All At Once", addedBy: "aarav", done: true },
  { id: "mv3", listId: "l_movies", title: "Anatomy of a Fall",    addedBy: "meera" },
  { id: "mv4", listId: "l_movies", title: "Laapataa Ladies",      addedBy: "aarav", done: true },
  { id: "mv5", listId: "l_movies", title: "Perfect Days",         addedBy: "meera" },
  { id: "mv6", listId: "l_movies", title: "Dune: Part Two",       addedBy: "aarav" },
];

// ---------- Recipes ----------
export const recipes: Recipe[] = [
  { id: "r1", title: "Paneer butter masala", emoji: "🍛", minutes: 35, tags: ["weeknight", "veg"],
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=60",
    ingredients: ["Paneer 250g", "Tomatoes 4", "Cream 100ml", "Ginger", "Butter", "Cashews", "Kasuri methi"] },
  { id: "r2", title: "Home ramen night",     emoji: "🍜", minutes: 40, tags: ["cozy", "date"],
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=60",
    ingredients: ["Ramen noodles", "Miso paste", "Eggs", "Scallions", "Nori", "Corn", "Sesame oil"] },
  { id: "r3", title: "Overnight oats",       emoji: "🥣", minutes: 5,  tags: ["breakfast", "quick"],
    image: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=60",
    ingredients: ["Rolled oats", "Milk", "Chia seeds", "Honey", "Banana", "Berries"] },
  { id: "r4", title: "Hyderabadi biryani (Sunday project 😄)", emoji: "🍚", minutes: 120, tags: ["weekend", "project"],
    image: "https://images.unsplash.com/photo-1631452180568-2eb8b3f3ab60?w=400&q=60",
    ingredients: ["Basmati rice 500g", "Chicken 1kg", "Yogurt", "Saffron", "Fried onions", "Whole spices", "Mint"] },
];

export const mealPlan: MealPlanEntry[] = [
  { id: "mp1", date: inDays(0), recipeId: "r2", meal: "dinner" },
  { id: "mp2", date: inDays(1), recipeId: "r1", meal: "dinner" },
  { id: "mp3", date: inDays(2), recipeId: "r3", meal: "breakfast" },
  { id: "mp4", date: inDays(6), recipeId: "r4", meal: "lunch" },
];

// ---------- Memories ----------
export const memories: Memory[] = [
  { id: "m1", title: "Juhu beach walk",     date: daysAgo(19),  photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=60", location: "Juhu" },
  { id: "m2", title: "Lonavala weekend",    date: daysAgo(45),  photo: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=60", location: "Lonavala" },
  { id: "m3", title: "Anniversary dinner",  date: daysAgo(156), photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=60", location: "The Table" },
  { id: "m4", title: "First house key",     date: daysAgo(300), photo: "https://images.unsplash.com/photo-1505692794403-34cbaa4bcbc5?w=600&q=60", milestone: true, note: "3 Mar 2025 🚩" },
  { id: "m5", title: "Diwali 2025",         date: daysAgo(240), photo: "https://images.unsplash.com/photo-1604423043492-41303b1cf1a2?w=600&q=60" },
  { id: "m6", title: "The day we met",      date: "2023-02-14",  photo: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60", milestone: true, location: "Prithvi Café" },
];

// ---------- Gratitude ----------
export const gratitudeNotes: GratitudeNote[] = [
  { id: "gn_now", from: "meera", to: "aarav", date: daysAgo(0, 7), read: false,
    text: "Thank you for making chai without me asking… 🤍" },
  { id: "gn1", from: "aarav", to: "meera", date: daysAgo(4, 22), read: true, text: "You always know which playlist I need." },
  { id: "gn2", from: "meera", to: "aarav", date: daysAgo(11, 8), read: true, text: "You picked up the entire grocery run silently. Saw it. 💚" },
  { id: "gn3", from: "aarav", to: "meera", date: daysAgo(20, 21), read: true, text: "Your laugh at Prithvi last night — best sound." },
  { id: "gn4", from: "meera", to: "aarav", date: daysAgo(33, 9), read: true, text: "Thanks for handling the plumber saga." },
];

// ---------- Daily question ----------
export const dailyQuestion: DailyQuestion = {
  id: "dq_today",
  date: daysAgo(0),
  question: "What's one tiny habit of mine you secretly find adorable?",
  answers: { meera: "The way you narrate cricket to the cat 🐈" },
};

export const dailyQuestionHistory: DailyQuestion[] = [
  { id: "dq_1", date: daysAgo(1), question: "One thing you're proud of us for this week?",
    answers: { aarav: "We stayed under grocery budget without noticing", meera: "We finally called the plumber together" } },
  { id: "dq_2", date: daysAgo(2), question: "A song that reminds you of us right now?",
    answers: { aarav: "Anuv Jain — Husn", meera: "Prateek Kuhad — Cold/Mess" } },
];

// ---------- Check-ins ----------
export const checkIns: CheckIn[] = [
  { id: "ci1", date: daysAgo(0),  ownerId: "meera", mood: 4 },
  { id: "ci2", date: daysAgo(1),  ownerId: "aarav", mood: 5 },
  { id: "ci3", date: daysAgo(7),  ownerId: "meera", mood: 4 },
  { id: "ci4", date: daysAgo(7),  ownerId: "aarav", mood: 4 },
  { id: "ci5", date: daysAgo(14), ownerId: "meera", mood: 3, note: "Deadline week" },
  { id: "ci6", date: daysAgo(14), ownerId: "aarav", mood: 4 },
];

// ---------- Insights ----------
export const insights: Insight[] = [
  { id: "i_dining", kind: "spend", tone: "caution", title: "Dining trending up",
    body: "38% above your 3-month average — mostly weekday lunches." },
  { id: "i_spotify", kind: "subscription", tone: "info", title: "Two Spotify Premiums 🎧",
    body: "Switch to a Duo plan and save ₹1,428/yr.", savings: 1428 },
  { id: "i_elec", kind: "save", tone: "celebrate", title: "Electricity back to normal",
    body: "Last month was 2× usual — this month is back on track. Nice." },
  { id: "i_bali", kind: "save", tone: "celebrate", title: "Bali goal on track",
    body: "43% saved and ₹8k added this month — pace looks great for Dec." },
];

// ---------- Brief ----------
export const brief: BriefCard[] = [
  { id: "bc1", emoji: "🗓️", title: "2 free evenings this week", body: "You're both open Thu & Sat — plan something?" },
  { id: "bc2", emoji: "💸", title: "₹4,188 in bills due",         body: "Electricity, Wifi, Netflix, SIP." },
  { id: "bc3", emoji: "🎂", title: "Mom's birthday in 12 days",   body: "Budget ₹2,500 — gift ideas in the vault." },
  { id: "bc4", emoji: "🌴", title: "Bali hit 43%",                body: "₹8,000 saved this month toward the trip." },
];

// ---------- Summary / balance ----------
export const runningBalance = { owedTo: "aarav" as const, amount: 2340 };
export const monthBudget = { budget: 85000, spent: 61240 };

// ---------- Settlements ledger ----------
export const settlements: Settlement[] = [
  { id: "s_prev", date: daysAgo(35), from: "meera", to: "aarav", amount: 1820, method: "UPI" },
];
