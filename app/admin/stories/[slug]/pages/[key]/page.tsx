import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminStory, listPages, listChoices } from "@/lib/admin/queries";
import { buildStoryGraph } from "@bedtime-quests/core/stories/graph";
import { deriveRolesAndDepth } from "@bedtime-quests/core/stories/wizard/plan-status";
import { placeholderFor } from "@bedtime-quests/core/stories/wizard/placeholders";
import type { AgeBandOrNone } from "@bedtime-quests/core/stories/wizard/types";
import { PageWorkspace } from "@/components/admin/page-workspace";

export default async function PageEditorPage({ params }: { params: Promise<{ slug: string; key: string }> }) {
  const { slug, key } = await params;
  const decodedKey = decodeURIComponent(key);
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const pages = await listPages(story.id);
  const target = pages.find((p) => p.key === decodedKey);
  if (!target) notFound();
  const choices = await listChoices(story.id);

  const initialChoices = choices
    .filter((c) => c.pageId === target.id)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ label: c.label, toPageKey: c.toPageKey }));

  // "How the reader got here": every choice from another page that lands on this
  // one, with the page it came from and that page's text, so the author writes
  // this scene with its context in view.
  const incoming = pages.flatMap((pp) =>
    choices
      .filter((c) => c.pageId === pp.id && c.toPageKey === decodedKey)
      .map((c) => ({ fromKey: pp.key, label: c.label, fromBody: pp.body })),
  );

  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? pages[0]?.key ?? "";
  const graph = buildStoryGraph(pages, choices);
  const status = deriveRolesAndDepth(graph, startKey).get(decodedKey);
  const bodyHint = status ? placeholderFor(status.role, (story.ageBand ?? null) as AgeBandOrNone, status.depth) : undefined;

  return (
    <section className="flex flex-1 flex-col gap-5">
      <Link href={`/admin/stories/${slug}`} className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to the graph</Link>
      <h1 className="font-display text-2xl font-extrabold">
        Editing <span className="text-[var(--pc-plum-ink)]">{decodedKey}</span>
      </h1>
      <PageWorkspace
        slug={slug}
        page={{ id: target.id, key: target.key, body: target.body, isEnding: target.isEnding, endingLabel: target.endingLabel, endingType: target.endingType }}
        otherPageKeys={pages.map((p) => p.key).filter((k) => k !== target.key)}
        initialChoices={initialChoices}
        bodyHint={bodyHint}
        incoming={incoming}
      />
    </section>
  );
}
