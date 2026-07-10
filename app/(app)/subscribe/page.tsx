// app/(app)/subscribe/page.tsx
// The subscribe entry point (issue #35). The paywall (#34) routes here after the
// parental gate passes; a parent can also reach it directly. This server component
// enforces access (must be signed in, and there is nothing to buy if already
// entitled) and hands off to the client plan picker, which runs the subscribe flow
// back through the parental gate (#32) before any payment step.
//
// Billing approach (issue #33 option c): purchasing is deferred to the native app
// (M6, #55). The picker states this plainly and never fakes a purchase on the web.
import { redirect } from "next/navigation";
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";
import { PlanSelection } from "@/components/subscribe/plan-selection";

export default async function SubscribePage() {
  const parent = await getParent();
  if (!parent) redirect("/sign-in");

  // Already subscribed (or on a trial)? There is nothing to buy; send them to read.
  const subscription = await getSubscription(parent);
  if (subscription.isActive) redirect("/");

  return <PlanSelection />;
}
