"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChild, updateChild } from "@/lib/children-actions";

type Mode = "create" | "edit";

const MODES = [
  { id: "read_to_me", label: "Read to me", note: "We read it aloud" },
  { id: "can_read", label: "I can read", note: "Just the words" },
] as const;

export function ChildForm({
  mode = "create",
  child,
  onDone,
}: {
  mode?: Mode;
  child?: { id: number; name: string; readingMode: string };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(child?.name ?? "");
  const [readingMode, setReadingMode] = useState<string>(child?.readingMode ?? "read_to_me");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = name.trim();
    if (!clean) {
      setError("Please enter a name.");
      return;
    }
    startTransition(async () => {
      const result =
        mode === "edit" && child
          ? await updateChild(child.id, clean, readingMode)
          : await createChild(clean, readingMode);
      if (result.ok) {
        onDone?.();
        router.refresh();
      } else {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="child-name" className="text-sm font-bold text-[var(--pc-ink)]">
          Name
        </label>
        <input
          id="child-name"
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Their name"
          className="h-12 w-full rounded-2xl border border-[var(--pc-line)] bg-white px-4 text-base font-semibold text-[var(--pc-ink)] outline-none placeholder:text-[var(--pc-sub)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-bold text-[var(--pc-ink)]">Reading mode</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MODES.map((m) => {
            const selected = readingMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setReadingMode(m.id)}
                disabled={isPending}
                aria-pressed={selected}
                className="flex min-h-[44px] flex-col items-start gap-0.5 rounded-2xl border-2 px-4 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50"
                style={
                  selected
                    ? { borderColor: "var(--pc-plum)", background: "var(--accent)" }
                    : { borderColor: "var(--pc-line)", background: "white" }
                }
              >
                <span className="font-display text-base font-bold text-[var(--pc-ink)]">{m.label}</span>
                <span className="text-xs text-[var(--pc-sub)]">{m.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] w-full rounded-2xl px-4 py-3 text-base font-bold text-white outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-60"
        style={{ background: "var(--pc-plum)" }}
      >
        {isPending ? "Saving…" : mode === "edit" ? "Save changes" : "Add reader"}
      </button>
    </form>
  );
}
