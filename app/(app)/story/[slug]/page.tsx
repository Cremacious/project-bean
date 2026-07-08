// app/(app)/story/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getReader } from "@/lib/session";
import { getAccessibleStoryBySlug } from "@/lib/stories/queries";
import { loadStoryGraph } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StoryReader } from "@/components/story/story-reader";
import type { ReadingFontId, ReadingSizeId } from "@/lib/reading-prefs";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reader = (await getReader())!; // (app) layout guarantees non-null

  const story = await getAccessibleStoryBySlug(reader.id, slug);
  if (!story) notFound();

  const graph = await loadStoryGraph(story.id);

  let startKey: string | undefined;
  if (story.startPageId != null) {
    const [row] = await db
      .select({ key: pageTable.key })
      .from(pageTable)
      .where(eq(pageTable.id, story.startPageId))
      .limit(1);
    startKey = row?.key;
  }
  if (!startKey) startKey = Object.keys(graph.pages)[0];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">{story.title}</h1>
      <Suspense>
        <StoryReader
          slug={slug}
          startKey={startKey}
          graph={graph}
          initialFont={reader.readerFont as ReadingFontId}
          initialSize={reader.readerFontSize as ReadingSizeId}
        />
      </Suspense>
    </div>
  );
}
