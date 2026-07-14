import { redirect } from "next/navigation";
import { shouldAutoShowOnboarding } from "@bedtime-quests/core/onboarding";
import { getParent } from "@/lib/session";
import { listChildren } from "@/lib/children";
import { getActiveChild } from "@/lib/active-child";
import { getOnboardingCompletedAt } from "@/lib/onboarding";
import { ChildPicker } from "@/components/profiles/child-picker";
import { Library } from "@/components/library";

export default async function Home({ searchParams }: { searchParams: Promise<{ age?: string }> }) {
  const parent = await getParent();
  if (!parent) redirect("/sign-in"); // stale cookie passed middleware but the session is invalid
  const kids = await listChildren(parent.id);
  const active = await getActiveChild();
  if (kids.length === 0 || !active) {
    // First-time tutorial (issue #73): only a genuinely new parent (no children
    // and never finished/skipped the tour) is greeted; a returning parent is not.
    const onboardingCompletedAt = await getOnboardingCompletedAt(parent.id);
    const showTutorial = shouldAutoShowOnboarding({
      onboardingCompletedAt,
      hasChildren: kids.length > 0,
    });
    return <ChildPicker kids={kids} needsFirst={kids.length === 0} showTutorial={showTutorial} />;
  }
  const { age } = await searchParams;
  return <Library activeChild={active} ageBand={age} />;
}
