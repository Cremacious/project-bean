// app/(app)/not-found.tsx
// In-shell 404 for missing content inside the authenticated app, most notably a
// story slug that does not exist (the reader calls notFound()). Keeps the header
// and footer around a friendly message (issue #11).
import Link from "next/link";
import { StatusScreen, actionPrimaryClass } from "@/components/feedback/status-screen";

export default function AppNotFound() {
  return (
    <StatusScreen
      emoji="📖"
      title="We could not find that story"
      description="This story may have been moved or is not available right now. Pick another adventure from the library."
    >
      <Link href="/" className={actionPrimaryClass}>
        Back to the library
      </Link>
    </StatusScreen>
  );
}
