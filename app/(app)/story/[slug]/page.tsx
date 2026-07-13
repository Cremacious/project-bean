import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getActiveChild } from "@/lib/active-child";
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";
import { getStoryBySlug } from "@/lib/stories/queries";
import { isStoryUnlocked } from "@bedtime-quests/core/stories/access";
import { loadStoryGraph } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable } from "@/db/schema";
import { StoryReader } from "@/components/story/story-reader";
import { Paywall } from "@/components/paywall";
import { initialSizeForMode, type ReadingFontId } from "@bedtime-quests/core/reading-prefs";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const active = await getActiveChild();
  if (!active) redirect("/"); // no reader chosen → back to picker

  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  // Server-side paywall gate (#34): a locked premium story is never loaded or sent
  // to a non-subscriber; they get the paywall in its place. Trials count as active.
  const parent = await getParent();
  const subscription = await getSubscription(parent);
  if (!isStoryUnlocked(story.premium, subscription)) {
    return <Paywall storyTitle={story.title} storySlug={slug} />;
  }

  const graph = await loadStoryGraph(story.id);
  let startKey: string | undefined;
  if (story.startPageId != null) {
    const [row] = await db.select({ key: pageTable.key }).from(pageTable).where(eq(pageTable.id, story.startPageId)).limit(1);
    startKey = row?.key;
  }
  if (!startKey) startKey = Object.keys(graph.pages)[0];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <Suspense>
        <StoryReader
          slug={slug}
          title={story.title}
          ageBand={story.ageBand}
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
