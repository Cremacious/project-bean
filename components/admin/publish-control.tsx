// components/admin/publish-control.tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPublished } from "@/lib/admin-actions";

export function PublishControl({ storyId, published, errors }: { storyId: number; published: boolean; errors: string[] }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const blocked = !published && errors.length > 0;

  function toggle() {
    start(async () => {
      await setPublished(storyId, !published);
      router.refresh();
    });
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending || blocked}
        className="cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: published ? "var(--pc-poppy-ink)" : "var(--pc-leaf-ink)" }}
      >
        {isPending ? "Saving…" : published ? "Unpublish" : "Publish"}
      </button>
      {blocked && <p className="text-xs font-semibold text-[var(--pc-poppy-ink)]">Fix the issues below to publish.</p>}
    </div>
  );
}
