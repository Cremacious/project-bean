import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminStory, listPages, listChoices } from "@/lib/admin/queries";
import { buildStoryInput } from "@/lib/admin/story-to-input";
import { buildStoryGraph } from "@bedtime-quests/core/stories/graph";
import { validateStoryComplete } from "@bedtime-quests/core/stories/wizard/validate-complete";
import { storyProgress } from "@bedtime-quests/core/stories/wizard/plan-status";
import { PublishControl } from "@/components/admin/publish-control";
import { StoryProgress } from "@/components/admin/story-progress";
import { StoryGraph } from "@/components/admin/story-graph";
import { AddPageControl } from "@/components/admin/add-page-control";

const linkBtn =
  "rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5";

export default async function StoryGraphPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const pages = await listPages(story.id);
  const choices = await listChoices(story.id);

  const { blocking, warnings } = validateStoryComplete(buildStoryInput(story, pages, choices));
  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? pages[0]?.key ?? "";
  const graph = buildStoryGraph(pages, choices);
  const progress = storyProgress(graph);

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to stories</Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin/stories/${slug}/settings`} className={linkBtn}>Story settings</Link>
          <Link href={`/admin/stories/${slug}/preview`} target="_blank" className={linkBtn}>Preview</Link>
          <PublishControl storyId={story.id} published={story.published} errors={blocking.map((i) => i.message)} />
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold">{story.title}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${story.published ? "bg-[#E6F7F0] text-[var(--pc-leaf-ink)]" : "bg-[#FDECEC] text-[var(--pc-poppy-ink)]"}`}>
          {story.published ? "Published" : "Draft"}
        </span>
      </div>

      <StoryProgress progress={progress} blocking={blocking} warnings={warnings} slug={slug} />

      {/* The map breaks out of the page's max-w-4xl column to use the full screen
          width, so a large branching story is easy to read. */}
      <div className="relative left-1/2 w-[min(96vw,1600px)] -translate-x-1/2 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold">Story map</h2>
          <p className="text-sm text-[var(--pc-sub)]">Tap any page to write it. Green pages have text; amber pages still need some.</p>
        </div>
        <StoryGraph graph={graph} startKey={startKey} slug={slug} />
        <AddPageControl storyId={story.id} slug={slug} />
      </div>
    </section>
  );
}
