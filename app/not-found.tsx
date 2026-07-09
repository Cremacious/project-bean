// app/not-found.tsx
// Custom 404 for any unmatched URL across the app (issue #11). Renders outside
// the app shell, so it owns the full viewport via StatusScreen standalone.
import Link from "next/link";
import { StatusScreen, actionPrimaryClass } from "@/components/feedback/status-screen";

export default function NotFound() {
  return (
    <StatusScreen
      standalone
      emoji="🔭"
      title="This page wandered off"
      description="We could not find the page you were looking for. Let us get you back to the stories."
    >
      <Link href="/" className={actionPrimaryClass}>
        Back to the stories
      </Link>
    </StatusScreen>
  );
}
