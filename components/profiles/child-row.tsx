"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/children";
import { removeChild } from "@/lib/children-actions";
import { ChildForm } from "@/components/profiles/child-form";

const MODE_LABELS: Record<string, string> = {
  read_to_me: "Read to me",
  can_read: "I can read",
};

export function ChildRow({ child }: { child: Child }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeChild(child.id);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)]">
        <ChildForm
          mode="edit"
          child={{ id: child.id, name: child.name, readingMode: child.readingMode }}
          onDone={() => setEditing(false)}
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-3 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold text-[var(--pc-sub)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:bg-[var(--muted)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-lg font-bold text-[var(--pc-ink)]">{child.name}</p>
        <p className="text-sm text-[var(--pc-sub)]">{MODE_LABELS[child.readingMode] ?? child.readingMode}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!confirming ? (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-[44px] rounded-full border border-[var(--pc-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--pc-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:bg-[var(--muted)]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-[44px] rounded-full border border-transparent px-4 py-2 text-sm font-bold text-[var(--pc-poppy-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:bg-[#FFF1EC]"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-[var(--pc-ink)]">Remove {child.name}?</span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="min-h-[44px] rounded-full px-4 py-2 text-sm font-bold text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
              style={{ background: "var(--pc-poppy)" }}
            >
              {isPending ? "Removing…" : "Yes, remove"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="min-h-[44px] rounded-full border border-[var(--pc-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--pc-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:bg-[var(--muted)]"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
