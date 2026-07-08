// scripts/seed-stories.ts
import "./_env"; // MUST be first: loads .env.local before db/client reads DATABASE_URL
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";
import { validateStory } from "@/lib/stories/validate";
import type { StoryInput } from "@/content/stories/_story-types";

const STORIES_DIR = join(process.cwd(), "content", "stories");

async function loadStories(): Promise<StoryInput[]> {
  const files = readdirSync(STORIES_DIR).filter(
    (f) => f.endsWith(".ts") && !f.startsWith("_"),
  );
  const stories: StoryInput[] = [];
  for (const file of files) {
    // pathToFileURL is required so Windows absolute paths (C:\...) import correctly under ESM.
    const mod = await import(pathToFileURL(join(STORIES_DIR, file)).href);
    stories.push(mod.default as StoryInput);
  }
  return stories;
}

async function seedStory(input: StoryInput) {
  const errors = validateStory(input);
  if (errors.length > 0) {
    throw new Error(`Story "${input.slug}" is invalid:\n - ${errors.join("\n - ")}`);
  }

  // Upsert story row.
  const [storyRow] = await db
    .insert(story)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description ?? "",
      ageBand: input.ageBand ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: story.slug,
      set: {
        title: input.title,
        description: input.description ?? "",
        ageBand: input.ageBand ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Full replace of pages/choices for a clean re-seed (cascade deletes choices).
  await db.delete(page).where(eq(page.storyId, storyRow.id));

  // Insert pages, capture key -> id.
  const keyToId = new Map<string, number>();
  for (const [key, p] of Object.entries(input.pages)) {
    const [pageRow] = await db
      .insert(page)
      .values({
        storyId: storyRow.id,
        key,
        body: p.body,
        imageUrl: p.imageUrl ?? null,
        isEnding: p.ending !== undefined,
        endingLabel: p.ending ?? null,
      })
      .returning({ id: page.id });
    keyToId.set(key, pageRow.id);
  }

  // Set start page id.
  await db
    .update(story)
    .set({ startPageId: keyToId.get(input.start)! })
    .where(eq(story.id, storyRow.id));

  // Insert choices.
  for (const [key, p] of Object.entries(input.pages)) {
    const fromId = keyToId.get(key)!;
    const choices = p.choices ?? [];
    for (let i = 0; i < choices.length; i++) {
      await db.insert(choice).values({
        pageId: fromId,
        toPageKey: choices[i].to,
        label: choices[i].label,
        order: i,
      });
    }
  }

  console.log(`Seeded "${input.slug}" (${Object.keys(input.pages).length} pages)`);
}

async function main() {
  const stories = await loadStories();
  console.log(`Found ${stories.length} story file(s).`);
  for (const s of stories) {
    await seedStory(s);
  }
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
