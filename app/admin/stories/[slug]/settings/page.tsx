import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminStory, listPages } from "@/lib/admin/queries";
import { StoryMetadataPanel } from "@/components/admin/story-metadata-panel";

export default async function StorySettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const pages = await listPages(story.id);
  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? null;

  return (
    <section className="flex flex-1 flex-col gap-5">
      <Link href={`/admin/stories/${slug}`} className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to the graph</Link>
      <h1 className="font-display text-2xl font-extrabold">Story settings</h1>
      <StoryMetadataPanel
        story={{ id: story.id, title: story.title, description: story.description, ageBand: story.ageBand, coverImageUrl: story.coverImageUrl, coverMotif: story.coverMotif, premium: story.premium }}
        pageKeys={pages.map((p) => p.key)}
        startKey={startKey}
        slug={slug}
      />
    </section>
  );
}
