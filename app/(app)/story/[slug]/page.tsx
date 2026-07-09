import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getActiveChild } from "@/lib/active-child";
import { getStoryBySlug } from "@/lib/stories/queries";
import { loadStoryGraph } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable } from "@/db/schema";
import { StoryReader } from "@/components/story/story-reader";
import { initialSizeForMode, type ReadingFontId } from "@/lib/reading-prefs";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const active = await getActiveChild();
  if (!active) redirect("/"); // no reader chosen → back to picker

  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const graph = await loadStoryGraph(story.id);
  let startKey: string | undefined;
  if (story.startPageId != null) {
    const [row] = await db.select({ key: pageTable.key }).from(pageTable).where(eq(pageTable.id, story.startPageId)).limit(1);
    startKey = row?.key;
  }
  if (!startKey) startKey = Object.keys(graph.pages)[0];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <h1 className="mb-6 font-display text-2xl font-bold">{story.title}</h1>
      <Suspense>
        <StoryReader
          slug={slug}
          startKey={startKey}
          graph={graph}
          childName={active.name}
          readingMode={active.readingMode}
          initialFont={active.readerFont as ReadingFontId}
          initialSize={initialSizeForMode(active.readingMode, active.readerFontSize)}
        />
      </Suspense>
    </div>
  );
}
