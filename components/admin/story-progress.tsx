// components/admin/story-progress.tsx
// Completion meter + the two-tier "ready to publish" panel. Presentational:
// takes the pure Progress + validation Issues and renders them. Must fix
// (blocking) gates publish; Worth a look (warnings) never blocks. Issues that
// belong to a page link straight to that page's editor.
import Link from "next/link";
import type { Progress } from "@bedtime-quests/core/stories/wizard/plan-status";
import type { Issue } from "@bedtime-quests/core/stories/wizard/validate-complete";

function IssueList({ issues, slug, tone }: { issues: Issue[]; slug: string; tone: "block" | "warn" }) {
  const linkCls = tone === "block" ? "text-[var(--pc-poppy-ink)]" : "text-[#9a6b00]";
  return (
    <ul className="mt-2 space-y-1.5 text-sm font-semibold text-[var(--pc-ink)]">
      {issues.map((issue, i) => (
        <li key={i}>
          {issue.pageKey ? (
            <Link
              href={`/admin/stories/${slug}/pages/${issue.pageKey}`}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 underline decoration-dotted underline-offset-2 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:bg-white active:translate-y-px ${linkCls}`}
            >
              <span aria-hidden>✏️</span>{issue.message}
            </Link>
          ) : (
            <span className="inline-block px-2 py-1">{issue.message}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StoryProgress({ progress, blocking, warnings, slug }: { progress: Progress; blocking: Issue[]; warnings: Issue[]; slug: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 shadow-[0_4px_0_var(--pc-line)]">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="text-[var(--pc-leaf-ink)]">{progress.written} of {progress.total} pages written</span>
          {progress.needsText > 0 && <span className="text-[#9a6b00]">{progress.needsText} still need text</span>}
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#eef2f4]">
          <div className="h-full rounded-full bg-[var(--pc-leaf-ink)] transition-[width]" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      {blocking.length > 0 && (
        <details className="group rounded-2xl border border-[var(--pc-poppy-ink)] bg-[#FDECEC] px-4 py-3 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-display text-sm font-extrabold text-[var(--pc-poppy-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <span>Must fix to publish ({blocking.length})</span>
            <span aria-hidden className="text-xs transition-transform group-open:rotate-90">▶</span>
          </summary>
          <IssueList issues={blocking} slug={slug} tone="block" />
        </details>
      )}

      {warnings.length > 0 && (
        <details className="group rounded-2xl border border-[#E8A100] bg-[#FFF7E6] px-4 py-3 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-display text-sm font-extrabold text-[#9a6b00] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <span>Worth a look ({warnings.length})</span>
            <span aria-hidden className="text-xs transition-transform group-open:rotate-90">▶</span>
          </summary>
          <IssueList issues={warnings} slug={slug} tone="warn" />
        </details>
      )}
    </div>
  );
}
