// app/welcome/page.tsx
//
// The public marketing homepage (issue #68). It explains Bedtime Quests to
// PARENTS and is the acquisition front door: signed out visitors to the site
// root are routed here by proxy.ts, and a signed in parent who lands here is
// sent straight into the app.
//
// This server component keeps only the two jobs that must run on the server:
// the metadata and the signed-in redirect. The page itself is a faithful port
// of the approved Claude Design ("Bedtime Quests Homepage"), which is highly
// interactive (scroll reveals, a tappable hero fork, a live story map, a name
// field), so it lives in the WelcomeHome Client Component.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { getParent } from "@/lib/session";
import { WelcomeHome } from "./homepage";

const DESCRIPTION =
  "A choose your own adventure bedtime story you read aloud together, starring your child by name. Gentle, COPPA conscious, and free to start.";

export const metadata: Metadata = {
  // Absolute so this acquisition page keeps a clean, keyword rich title rather
  // than the "%s · Bedtime Quests" template used by in app pages.
  title: { absolute: BRAND.fullName },
  description: DESCRIPTION,
  alternates: { canonical: "/welcome" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: BRAND.fullName,
    description: DESCRIPTION,
    url: "/welcome",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.fullName,
    description: DESCRIPTION,
  },
};

export default async function WelcomePage() {
  // A signed in parent has no use for the marketing page: route them into the app,
  // exactly as the rest of the app does today.
  const parent = await getParent();
  if (parent) redirect("/");

  return <WelcomeHome />;
}
