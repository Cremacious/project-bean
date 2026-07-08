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

// --- Story catalog (global; no per-user access). ---
export const story = pgTable("story", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ageBand: text("age_band"), // "2-4" | "5-7" | "8+" | null
  startPageId: integer("start_page_id"),
  coverImageUrl: text("cover_image_url"),
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
