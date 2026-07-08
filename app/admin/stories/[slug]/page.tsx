import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminStory, listPages, listChoices } from "@/lib/admin/queries";
import { buildStoryInput } from "@/lib/admin/story-to-input";
import { validateStory } from "@/lib/stories/validate";
import { StoryMetadataPanel } from "@/components/admin/story-metadata-panel";
import { PublishControl } from "@/components/admin/publish-control";
import { PagesPanel } from "@/components/admin/pages-panel";
import { ValidationSummary } from "@/components/admin/validation-summary";

export default async function StoryEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const pages = await listPages(story.id);
  const choices = await listChoices(story.id);
  const errors = validateStory(buildStoryInput(story, pages, choices));
  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to stories</Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/stories/${slug}/preview`}
            target="_blank"
            className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
          >
            Preview
          </Link>
          <PublishControl storyId={story.id} published={story.published} errors={errors} />
        </div>
      </div>
      <h1 className="font-display text-2xl font-extrabold">{story.title}</h1>

      <ValidationSummary errors={errors} />

      <StoryMetadataPanel
        story={{ id: story.id, title: story.title, description: story.description, ageBand: story.ageBand, coverImageUrl: story.coverImageUrl }}
        pageKeys={pages.map((p) => p.key)}
        startKey={startKey}
      />

      <PagesPanel
        storyId={story.id}
        pages={pages.map((p) => ({ id: p.id, key: p.key, body: p.body, isEnding: p.isEnding, endingLabel: p.endingLabel, endingType: p.endingType }))}
        choices={choices.map((c) => ({ id: c.id, pageId: c.pageId, toPageKey: c.toPageKey, label: c.label, order: c.order }))}
      />
    </section>
  );
}
