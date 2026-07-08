// lib/stories/queries.ts
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { story, storyAccess } from "@/db/schema";

export type StoryCard = {
  id: number;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
};

/** Stories the given reader is allowed to see. */
export async function getLibraryForReader(readerId: string): Promise<StoryCard[]> {
  const rows = await db
    .select({
      id: story.id,
      slug: story.slug,
      title: story.title,
      description: story.description,
      coverImageUrl: story.coverImageUrl,
    })
    .from(story)
    .innerJoin(storyAccess, eq(storyAccess.storyId, story.id))
    .where(eq(storyAccess.readerId, readerId))
    .orderBy(story.title);
  return rows;
}

/** Returns the story row if the reader may access it, else null. */
export async function getAccessibleStoryBySlug(readerId: string, slug: string) {
  const [row] = await db
    .select({
      id: story.id,
      slug: story.slug,
      title: story.title,
      startPageId: story.startPageId,
    })
    .from(story)
    .innerJoin(storyAccess, eq(storyAccess.storyId, story.id))
    .where(and(eq(story.slug, slug), eq(storyAccess.readerId, readerId)))
    .limit(1);
  return row ?? null;
}
