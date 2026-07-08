import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminStory } from "@/lib/admin/queries";
import { loadStoryGraph } from "@/lib/stories/graph";
import { StoryReader } from "@/components/story/story-reader";

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const graph = await loadStoryGraph(story.id);
  const startKey =
    Object.values(graph.pages).find((p) => p.id === story.startPageId)?.key
    ?? Object.keys(graph.pages)[0];
  if (!startKey) {
    return <p className="text-[var(--pc-sub)]">Add a page and set a start page to preview.</p>;
  }
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/admin/stories/${slug}`} className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to the editor</Link>
        <span className="rounded-full bg-[var(--pc-sun)] px-3 py-1 text-xs font-extrabold text-[#3a2d00]">Preview</span>
      </div>
      <h1 className="mb-6 font-display text-2xl font-bold">{story.title}</h1>
      <StoryReader slug={slug} startKey={startKey} graph={graph} childName="Sam" initialFont="rounded" initialSize="md" preview />
    </div>
  );
}
