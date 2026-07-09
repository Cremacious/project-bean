"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChild, updateChild } from "@/lib/children-actions";
import { FieldError } from "@/components/ui/field-error";

type Mode = "create" | "edit";

const MODES = [
  { id: "read_to_me", label: "Read to me", note: "A grown up reads aloud and taps the choices" },
  { id: "can_read", label: "I can read", note: "Your child reads and taps, with bigger text" },
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
      setError("Please enter a name so we can personalize the stories.");
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
        setError("We could not save this reader. Please check the name and try again.");
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
          onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
          placeholder="Their name"
          aria-invalid={!!error}
          aria-describedby={error ? "child-name-error" : undefined}
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
                className="flex min-h-[44px] cursor-pointer flex-col items-start gap-0.5 rounded-2xl border-2 px-4 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
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

      <FieldError id="child-name-error">{error}</FieldError>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] w-full cursor-pointer rounded-2xl px-4 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--pc-plum)" }}
      >
        {isPending ? "Saving…" : mode === "edit" ? "Save changes" : "Add reader"}
      </button>
    </form>
  );
}
