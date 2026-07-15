// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { latestChangelogEntry } from "@bedtime-quests/core/changelog";
import { getParent } from "@/lib/session";
import { getActiveChild } from "@/lib/active-child";
import { isAdmin } from "@/lib/admin";
import { getWhatsNewSeenEntryId } from "@/lib/whats-new";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParent();
  if (!parent) redirect("/sign-in");
  const active = await getActiveChild();
  // "What's new" dot (issue #74): the newest changelog entry vs the per-account
  // marker for this parent. Reads null gracefully if the table is not present yet.
  const seenEntryId = await getWhatsNewSeenEntryId(parent.id);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <AppHeader
        parentEmail={parent.email}
        activeChildName={active?.name ?? null}
        isAdmin={isAdmin(parent.email)}
        whatsNew={{ latestEntryId: latestChangelogEntry()?.id ?? null, seenEntryId }}
      />
      <main className="flex flex-1 flex-col">
        <div className="px-gutter mx-auto flex w-full max-w-5xl flex-1 flex-col py-6">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
