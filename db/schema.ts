import {
  pgTable, serial, text, integer, boolean, timestamp, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";

// --- BetterAuth core tables. `user` is the PARENT account. ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Child profiles (nested under a parent; no login). ---
export const child = pgTable("child", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  readingMode: text("reading_mode").notNull().default("read_to_me"), // read_to_me | can_read
  readerFont: text("reader_font").notNull().default("rounded"),
  readerFontSize: text("reader_font_size").notNull().default("md"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Parent subscription entitlement (issue #33). ONE row per PARENT. ---
// Entitlements belong to the adult account, never to a child. COPPA
// (docs/COMPLIANCE-COPPA.md section 6c): no child name, id, or attributes are
// stored here or sent to RevenueCat. The RevenueCat `app_user_id` is the
// parent's own account id (`user.id`), which is a parent scoped, non child
// identifier. Deleting the parent cascades this row away with the rest of the
// account (see the account deletion note in lib/auth.ts).
export const subscription = pgTable("subscription", {
  parentId: text("parent_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  // Entitlement state. A parent with no row is implicitly "none" (not subscribed).
  status: text("status").notNull().default("none"), // none | trialing | active | grace | canceled | expired
  productId: text("product_id"), // plan identifier, e.g. "monthly" | "yearly"; null until known
  source: text("source").notNull().default("internal"), // internal | revenuecat
  // End of the paid or trial period. null means no expiry (e.g. an internal comp grant).
  currentPeriodEnd: timestamp("current_period_end"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- First-time parent tutorial completion (issue #73). ONE row per PARENT,
// created when the parent finishes or skips the walkthrough. Kept in its own
// table (like `subscription`) rather than as a column on `user`, because
// BetterAuth's Drizzle adapter selects every `user` column on each account
// lookup, so an app-only field there would couple auth to this migration. The
// presence of a row means "completed"; there is no row until then. Storing this
// per parent account (never per child, never per device) is what stops the tour
// repeating on a new device and keeps it from greeting a returning parent.
// Deleting the parent cascades this row away with the rest of the account. ---
export const parentOnboarding = pgTable("parent_onboarding", {
  parentId: text("parent_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

// --- "What's new" seen marker (issue #74). ONE row per PARENT, recording the id
// of the newest changelog entry they have opened the "What's new" panel on. Kept
// in its own table (like `parent_onboarding`) rather than as a column on `user`,
// because BetterAuth's Drizzle adapter selects every `user` column on each
// account lookup, so an app-only field there would couple auth to this migration.
// The shared core (hasUnseenWhatsNew) compares this id against the latest entry
// id to decide whether to show the unseen dot; storing it per parent account
// (never per child, never per device) keeps the dot honest across devices.
// Deleting the parent cascades this row away with the rest of the account. ---
export const whatsNewSeen = pgTable("whats_new_seen", {
  parentId: text("parent_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  // The id of the newest changelog entry this parent has seen (e.g. "2026-07").
  lastSeenEntryId: text("last_seen_entry_id").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Story catalog (global; no per-user access). ---
export const story = pgTable("story", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ageBand: text("age_band"), // "2-4" | "5-7" | "8+" | null
  startPageId: integer("start_page_id"),
  coverImageUrl: text("cover_image_url"),
  coverMotif: text("cover_motif"), // null = auto-derived from slug; else a StoryCover motif key
  // Free-tier gating (issue #34). Premium stories are locked for parents without an
  // active entitlement; a small sampler set (one per age band plus a spare) is free.
  // Defaults to true so newly authored stories (incl. the monthly cadence) are premium
  // unless an admin marks them free.
  premium: boolean("premium").notNull().default(true),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const page = pgTable(
  "page",
  {
    id: serial("id").primaryKey(),
    storyId: integer("story_id").notNull().references(() => story.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    isEnding: boolean("is_ending").notNull().default(false),
    endingLabel: text("ending_label"),
    endingType: text("ending_type").notNull().default("good"), // "good" | "game_over"
  },
  (t) => ({ storyKeyUnq: uniqueIndex("page_story_key_unq").on(t.storyId, t.key) }),
);

export const choice = pgTable("choice", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
  toPageKey: text("to_page_key").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

// --- Marketing waitlist (issue #68). A PARENT (never a child) opting in to be
// emailed at launch from the public /welcome page. Email is unique so a repeat
// signup is a graceful no-op, not a duplicate. Name is optional. `source` records
// where the signup came from (e.g. "welcome") for future attribution. This holds
// only an adult's email + optional name; no child data ever lands here. ---
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  source: text("source").notNull().default("welcome"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Per-child ending progress. ---
export const endingFound = pgTable(
  "ending_found",
  {
    childId: integer("child_id").notNull().references(() => child.id, { onDelete: "cascade" }),
    storyId: integer("story_id").notNull().references(() => story.id, { onDelete: "cascade" }),
    pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
    foundAt: timestamp("found_at").notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.childId, t.pageId] }) }),
);
